// background.js
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-tab-manager") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle_tab_manager" });
    });
  }
});
// background.js (add these message handlers)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  if (request.action === "get_tabs") {
    chrome.tabs.query({}, (tabs) => {
      console.log("Found tabs:", tabs.length);

      // Filter tabs if search term provided
      let filteredTabs = tabs;
      if (request.searchTerm) {
        const term = request.searchTerm.toLowerCase();
        filteredTabs = tabs.filter(
          (tab) =>
            tab.title.toLowerCase().includes(term) ||
            (tab.url && tab.url.toLowerCase().includes(term))
        );
      }

      // Return tabs data
      sendResponse({ tabs: filteredTabs });
    });

    // Required for asynchronous response
    return true;
  }

  if (request.action === "switch_to_tab") {
    chrome.tabs.update(request.tabId, { active: true });
    chrome.windows.update(tabs.find((t) => t.id === request.tabId).windowId, {
      focused: true,
    });
  }

  if (request.action === "close_tab") {
    chrome.tabs.remove(request.tabId);
  }
});
