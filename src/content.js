// content.js
let tabManagerVisible = false;
let tabManagerEl = null;

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
function updateTabsList(searchTerm = "") {
  const tabsContainer = tabManagerEl.querySelector(".tabs-container");
  tabsContainer.innerHTML = "";

  chrome.tabs.query({}, (tabs) => {
    const filteredTabs = searchTerm
      ? tabs.filter((tab) =>
          tab.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : tabs;

    filteredTabs.forEach((tab) => {
      const tabEl = document.createElement("div");
      tabEl.className = "tab-item";
      tabEl.innerHTML = `
        <img src="${tab.favIconUrl || "default-icon.png"}" class="tab-favicon">
        <span class="tab-title">${tab.title}</span>
        <button class="tab-close">×</button>
      `;

      tabEl.addEventListener("click", () => {
        chrome.tabs.update(tab.id, { active: true });
        hideTabManager();
      });

      tabEl.querySelector(".tab-close").addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.tabs.remove(tab.id);
        tabEl.remove();
      });

      tabsContainer.appendChild(tabEl);
    });
  });
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
