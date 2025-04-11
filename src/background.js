// background.js
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-tab-manager") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle_tab_manager" });
    });
  }
});
