console.log("Content script running"); // For debugging

let subtitleTimeout; 

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.transcript) {
    let overlay = document.getElementById("my-extension-subtitle-overlay");
    if (!overlay) {
      if (!document.body){
        console.error('Document body not found');
        return;
      }

      overlay = document.createElement("div");
      overlay.id = "my-extension-subtitle-overlay";
      Object.assign(overlay.style, {
        position: "fixed",
        left: "50%",
        bottom: "10%",
        transform: "translateX(-50%)",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "1.4rem",
        zIndex: "2147483647",
        transition: "opacity 0.3s",
        maxWidth: "90%",
        textAlign: "center",
      });
      document.body.appendChild(overlay);
    }

    overlay.textContent = msg.transcript;
    overlay.style.opacity="1";

    clearTimeout(subtitleTimeout);
    subtitleTimeout=setTimeout(() => {
      if (overlay) overlay.style.opacity = "0";
    }, 3000);
  }
});