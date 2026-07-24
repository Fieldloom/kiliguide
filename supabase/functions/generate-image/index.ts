import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { prompt } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    // Check Quota
    const { data: settings } = await supabase.from("app_settings").select("image_generation_limit").eq("id", "global").single();
    const limit = settings?.image_generation_limit ?? 5;

    const { data: profile } = await supabase.from("profiles").select("image_generation_count").eq("id", user.id).single();
    const currentCount = profile?.image_generation_count ?? 0;

    if (currentCount >= limit) {
      return new Response(JSON.stringify({ error: "Image generation limit reached." }), { status: 402, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Call NVIDIA NIM Image Generation API
    const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY is not configured.");

    const invokeUrl = "https://integrate.api.nvidia.com/v1/images/generations";
    const payload = {
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 5,
      sampler: "K_DPM_2_ANCESTRAL",
      seed: 0,
      steps: 50
    };

    // The stabilityai/stable-diffusion-3-medium API is actually different (it's OpenAI compatible format):
    const openaiPayload = {
      prompt: prompt,
      model: "stabilityai/stable-diffusion-3-medium",
      response_format: "b64_json"
    };

    const res = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(openaiPayload)
    });

    if (!res.ok) {
      throw new Error(`NVIDIA API failed: ${await res.text()}`);
    }

    const data = await res.json();
    const b64Json = data.data?.[0]?.b64_json;
    if (!b64Json) throw new Error("NVIDIA API returned no image data");

    // Increment usage
    await supabase.from("profiles").update({ image_generation_count: currentCount + 1 }).eq("id", user.id);

    return new Response(JSON.stringify({ imageBase64: b64Json }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
});
