// State management
let extensionState = {
  active: false,
  currentTab: null,
  lastError: null
};

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  
  switch (message.action) {
    case 'getState':
      sendResponse(extensionState);
      break;
      
    case 'updateState':
      extensionState = {
        ...extensionState,
        ...message.state,
        lastError: null
      };
      sendResponse({ success: true });
      break;
      
    case 'error':
      extensionState.lastError = message.error;
      console.error("Extension error:", message.error);
      break;
      
    default:
      sendResponse({ error: "Unknown action" });
  }
  
  return true; // Keep channel open for sendResponse
});

// Clean up when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === extensionState.currentTab) {
    extensionState = {
      active: false,
      currentTab: null,
      lastError: "Tab closed"
    };
  }
});
