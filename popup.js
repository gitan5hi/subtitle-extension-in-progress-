const toggleBtn = document.getElementById("toggleBtn");

let mediaRecorder = null;
let capturing = false;
let currentTabId = null;
let audioPlayback = null;

// On popup load, restore capturing state and set button properly
document.addEventListener('DOMContentLoaded', async () => {
  chrome.storage.local.get(['capturing'], (result) => {
    capturing = !!result.capturing;
    updateButton();

    //Disable button if not on Youtube
    if (!capturing){
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]?.url.includes('youtube.com')) {
          toggleBtn.disabled = true;
          toggleBtn.title = "Only works on YouTube pages"
        }
      });
    }
  });
});

toggleBtn.addEventListener("click", async () => {
  if (!capturing) {
    await startCapture();
  } else {
    stopCapture();
  }
});

async function startCapture(){
  try{
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url.includes('youtube.com')) {
      alert("Please open a Youtube video first.");
      return;
    }
    currentTabId = tab.id;

    const stream = await new Promise((resolve) => {
      chrome.tabCapture.capture({audio: true, video: false}, (stream) => {
        if (chrome.runtime.lastError || !stream) {
          throw new Error(chrome.runtime.lastError?.message || 'Capture failed');
        }
        resolve(stream);
      });
    });

    //Validate audio atream
    if (stream.getAudioTracks().length === 0){
      throw new Error('No audio tracks available');
    }

    audioPlayback = new Audio();
    audioPlayback.srcObject = stream;
    await audioPlayback.play().catch(e => console.warn("Playback warning:", e));

    const options = getSupportedMimeType();
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data?.size > 0){
        try {
          const transcript = await sendAudioChunksToServer(event.data);
          chrome.tabs.sendMessage(currentTabId, { transcript });
        } catch (error) {
          console.error("Translation error:", error);
          chrome.tabs.sendMessage(currentTabId, {
            transcript: `[Error: ${error.message}]`
          });
        }
      }
    };

    mediaRecorder.onstop = () => {
      cleanupResources();
      chrome.storage.local.set({ capturing: false });
    };

    mediaRecorder.start(2000); //2s chunks
    capturing = true;
    chrome.storage.local.set({ capturing: true });
    updateButton();

  } catch (err) {
    console.error("Capture error:", err);
    alert(`Error: ${err.message}`);
    stopCapture();
  }
}

function stopCapture(){
  if (mediaRecorder?.state !== 'inactive') {
    mediaRecorder?.stop();
  }
  cleanupResources();
  capturing = false;
  chrome.storage.local.set({ capturing: false });
  updateButton();

  if (currentTabId) {
    chrome.tabs.sendMessage(currentTabId, { clearSubtitle: true });
  }
}

function cleanupResources(){
  if (audioPlayback) {
    audioPlayback.pause();
    audioPlayback.srcObject = null;
    audioPlayback = null;
  }
  if (mediaRecorder?.stream) {
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  mediaRecorder = null
}

function updateButton() {
  toggleBtn.textContent = capturing ? "Turn Off" : "Turn On";
  toggleBtn.classList.toggle("active", capturing);
}

async function sendAudioChunkToServer(blob) {
  const serverURL = "http://localhost:5000/transcribe";
  
  try {
    const formData = new FormData();
    // Create a File object with proper filename and type
    const audioFile = new File([blob], "audio_chunk.webm", {
      type: blob.type || "audio/webm" 
    });
    formData.append("audio", audioFile);

    const response = await fetch(serverURL, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Server error: ${error}`);
    }

    const data = await response.json();
    if (!data.transcript) {
      throw new Error("Invalid response format - no transcript");
    }
    
    return data.transcript;
    
  } catch (error) {
    console.error("Upload error:", error);
    return `[Error: ${error.message}]`;
  }
}

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  return { mimeType: types.find(MediaRecorder.isTypeSupported) || ""};
}