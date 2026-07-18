import fetch from "npm:node-fetch";

async function test() {
  try {
    const url = "https://www.dkut.ac.ke/index.php/about-dekut/administrative-units/directorate-of-ict";
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Length:", json.contents.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
