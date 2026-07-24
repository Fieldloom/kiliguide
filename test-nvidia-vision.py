import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = True

headers = {
    "Authorization": "Bearer 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",
    "Accept": "text/event-stream" if stream else "application/json",
}

payload = {
  "messages": [
    {
      "role": "user",
      "content": "hello!"
    }
  ],
  "model": "meta/llama-3.2-11b-vision-instruct",
  "frequency_penalty": 0,
  "max_tokens": 512,
  "presence_penalty": 0,
  "stream": stream,
  "temperature": 1,
  "top_p": 1
}

response = requests.post(invoke_url, headers=headers, json=payload, stream=stream)
if stream:
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))
else:
    print(response.json())
