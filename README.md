# Subtitle Overlay Chrome Extension
A Chrome extension that overlays subtitles on videos in real time using **Whisper AI** for accurate speech-to-text transcription. 
This project aims to improve video accessibility and help users understand video content in different languages.
---
##Features
- Audio Capture: extract audio from the video tab.
- Whisper AI integration: transcribes speech into text.
- Live Subtitle Overlay: subtitles are supposed to be displayed directly on top of the video.
- Real-time processing: subtitles appear with minimal delay.

##Usage
1. Open a YouTube video.
2. Enable the extension from the popup.
<img width="525" height="199" alt="image" src="https://github.com/user-attachments/assets/6e33d1bb-cf3d-446e-9529-2fcb1692901f" />
3. The audio will be sent to the server -> Whisper will transcribe -> subtitles appear on the screen.

##Current Issues
- 400 bad request error occurs after turning the extension on.
