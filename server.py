from flask import Flask, request, jsonify
import whisper
from deep_translator import GoogleTranslator
import tempfile
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load Whisper model once at startup
model = whisper.load_model("small")

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():  # Renamed function to avoid conflicts
    # Check if audio data is present in request
    if 'audio' not in request.files:
        return jsonify({"error": "no audio file part"}), 400
    
    audio_file = request.files['audio']

    # Save to a temp file for whisper processing
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_file:
        audio_path = tmp_file.name
        audio_file.save(audio_path)
    
    # Transcribe audio using Whisper
    result = model.transcribe(audio_path)
    original_text = result["text"].strip()

    # Clean temp file
    os.remove(audio_path)

    # Get target language for translation
    target_language = request.form.get("target_lang", "en")

    # Translate transcript to target language if needed
    try:
        translated_text = GoogleTranslator(source='auto', target=target_language).translate(original_text)
    except Exception as e:
        translated_text = original_text  # Fallback to original text
    
    # Return both original and translated transcripts
    return jsonify({
        "original_text": original_text,
        "translated_text": translated_text
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)