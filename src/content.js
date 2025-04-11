// content.js
let tabManagerVisible = false;
let tabManagerEl = null;

// Add this function at the top of content.js
function logDebug(message, data) {
  console.log(`Floating Tab Manager: ${message}`, data || "");
}

// Update the showTabManager function
function showTabManager() {
  logDebug("Showing tab manager");

  if (!tabManagerEl) {
    tabManagerEl = createTabManager();
    logDebug("Tab manager created");
  }

  tabManagerEl.classList.remove("hidden");
  tabManagerVisible = true;

  // Update tabs list
  updateTabsList();

  // Focus the search input
  setTimeout(() => {
    const searchInput = tabManagerEl.querySelector(".tab-search");
    if (searchInput) {
      searchInput.focus();
      logDebug("Search input focused");
    } else {
      logDebug("Search input not found", tabManagerEl);
    }
  }, 100);
}
// Create and initialize the tab manager
function createTabManager() {
  tabManagerEl = document.createElement("div");
  tabManagerEl.id = "floating-tab-manager";
  tabManagerEl.className = "tab-manager hidden";

  // Add search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search tabs...";
  searchInput.className = "tab-search";
  tabManagerEl.appendChild(searchInput);

  // Add tabs container
  const tabsContainer = document.createElement("div");
  tabsContainer.className = "tabs-container";
  tabManagerEl.appendChild(tabsContainer);

  // Make it draggable
  makeElementDraggable(tabManagerEl);

  document.body.appendChild(tabManagerEl);

  // Set up search functionality
  searchInput.addEventListener("input", () => {
    updateTabsList(searchInput.value);
  });

  return tabManagerEl;
}

// Update the tabs list in the UI
// content.js (replace the updateTabsList function)
function updateTabsList(searchTerm = "") {
  // Request tabs from background script
  chrome.runtime.sendMessage(
    { action: "get_tabs", searchTerm: searchTerm },
    (response) => {
      if (!response || !response.tabs) {
        console.error("Failed to get tabs data", response);
        return;
      }

      const tabsContainer = tabManagerEl.querySelector(".tabs-container");
      tabsContainer.innerHTML = "";

      response.tabs.forEach((tab) => {
        const tabEl = document.createElement("div");
        tabEl.className = "tab-item";
        tabEl.innerHTML = `
        <img src="${tab.favIconUrl || "default-icon.png"}" class="tab-favicon">
        <span class="tab-title">${tab.title}</span>
        <button class="tab-close">×</button>
      `;

        tabEl.addEventListener("click", () => {
          chrome.runtime.sendMessage({
            action: "switch_to_tab",
            tabId: tab.id,
          });
          hideTabManager();
        });

        tabEl.querySelector(".tab-close").addEventListener("click", (e) => {
          e.stopPropagation();
          chrome.runtime.sendMessage({
            action: "close_tab",
            tabId: tab.id,
          });
          tabEl.remove();
        });

        tabsContainer.appendChild(tabEl);
      });
    }
  );
}

// Make an element draggable
function makeElementDraggable(element) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  element.addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e) {
    if (e.target !== element && e.target.tagName !== "DIV") return;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = element.offsetTop - pos2 + "px";
    element.style.left = element.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }
}

// Show the tab manager
function showTabManager() {
  if (!tabManagerEl) {
    tabManagerEl = createTabManager();
  }

  tabManagerEl.classList.remove("hidden");
  tabManagerVisible = true;
  updateTabsList();

  // Focus the search input
  setTimeout(() => {
    tabManagerEl.querySelector(".tab-search").focus();
  }, 100);
}

// Hide the tab manager
function hideTabManager() {
  if (tabManagerEl) {
    tabManagerEl.classList.add("hidden");
    tabManagerVisible = false;
  }
}

// Toggle the tab manager
function toggleTabManager() {
  if (tabManagerVisible) {
    hideTabManager();
  } else {
    showTabManager();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_tab_manager") {
    toggleTabManager();
  }
});

// Also allow keyboard shortcut directly from page
document.addEventListener("keydown", (e) => {
  // Ctrl+Shift+Space
  if (e.ctrlKey && e.shiftKey && e.code === "Space") {
    toggleTabManager();
  }
});

// Auto-enable full screen
function enableFullScreen() {
  // Hide Chrome's tab bar via CSS
  const style = document.createElement("style");
  style.textContent = `
    /* Hide tab bar in Chromium browsers */
    @media screen {
      body {
        margin-top: 0 !important;
      }
      
      /* This targets Chrome's tab bar */
      #main-toolbar, .tab-strip {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // You might also want to use the Fullscreen API
  document.documentElement.requestFullscreen().catch((err) => {
    console.log("Error attempting to enable full-screen mode:", err);
  });
}

// Call this function when appropriate, e.g. after user interaction
// Due to browser security, fullscreen needs user interaction
document.addEventListener("click", function fullscreenOnClick() {
  enableFullScreen();
  document.removeEventListener("click", fullscreenOnClick);
});
