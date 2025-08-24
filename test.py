import requests

with open("output.wav", "rb") as f:
    files = {"audio": ("output.wav", f, "audio/wav")}
    response = requests.post("http://localhost:5000/transcribe", files=files)

print(response.status_code)
print(response.json())