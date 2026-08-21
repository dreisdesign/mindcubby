/**
 * DailyNote - A simple note that clears at the end of the day
 * main.js - Core functionality
 * Version: 1.0.0
 */

document.addEventListener("DOMContentLoaded", function () {
  // Apply dark mode to body if needed
  if (
    localStorage.getItem("darkMode") === "true" ||
    (localStorage.getItem("darkMode") === null &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.add("dark-mode");
  }

  // DOM Elements
  const noteCard = document.getElementById("noteCard");
  const noteContent = document.getElementById("noteContent");
  const noteText = document.getElementById("noteText");
  const noteLabelContainer = document.getElementById("noteLabelContainer");
  const metricLabel = document.querySelector(".metric-label");
  const editLabelIcon = document.getElementById("editLabelIcon");
  const addNoteButton = document.getElementById("addNoteButton");
  const addNoteButtonText = document.querySelector(".track-button-text");
  const settingsButton = document.getElementById("settingsButton");
  const noteOverlay = document.getElementById("noteOverlay");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const closeOverlay = document.getElementById("closeOverlay");
  const closeSettingsOverlay = document.getElementById("closeSettingsOverlay");
  const allAppsButton = document.getElementById("allAppsButton");
  const noteTextArea = document.getElementById("noteTextArea");
  const saveNoteButton = document.getElementById("saveNote");
  const cancelNoteButton = document.getElementById("cancelNote");
  const clearNoteButton = document.getElementById("clearNoteButton");
  const undoButton = document.getElementById("undoButton");
  const menuThemeToggle = document.getElementById("menuThemeToggle");
  const bottomButtonsWrapper = document.getElementById("bottomButtonsWrapper");

  // Label editing elements
  const labelEditOverlay = document.getElementById("labelEditOverlay");
  const labelEditInput = document.getElementById("labelEditInput");
  const saveLabelButton = document.getElementById("saveLabelButton");
  const resetLabelButton = document.getElementById("resetLabelButton");
  const closeLabelEditButton = document.getElementById("closeLabelEditButton");

  let currentNote = "";
  let previousNote = "";
  let currentLabel = localStorage.getItem("noteLabel") || "Today's Note";
  let undoTimer;

  // Check for dark mode preference
  initTheme();
  // Load any existing note
  loadNote();
  // Load the saved label
  loadLabel();
  // Load the current label
  loadLabel();

  // Set initial button text based on the preloaded flag
  if (window.hasExistingNote) {
    addNoteButtonText.textContent = "✐ Edit";
  } else {
    addNoteButtonText.textContent = "+ Add";
  }

  // Event Listeners
  addNoteButton.addEventListener("click", showNoteOverlay);
  settingsButton.addEventListener("click", showSettingsOverlay);
  closeOverlay.addEventListener("click", hideNoteOverlay);
  closeSettingsOverlay.addEventListener("click", hideSettingsOverlay);
  allAppsButton.addEventListener("click", () => {
    window.location.href = "../index.html";
  });
  saveNoteButton.addEventListener("click", saveNote);
  cancelNoteButton.addEventListener("click", hideNoteOverlay);
  clearNoteButton.addEventListener("click", clearNote);
  undoButton.addEventListener("click", undoClear);
  menuThemeToggle.addEventListener("click", toggleTheme);

  // Label editing event listeners
  editLabelIcon.addEventListener("click", function (e) {
    e.stopPropagation(); // Prevent noteCard click event
    showLabelEditOverlay();
  });

  noteLabelContainer.addEventListener("click", function (e) {
    e.stopPropagation(); // Prevent noteCard click event
    showLabelEditOverlay();
  });

  closeLabelEditButton.addEventListener("click", hideLabelEditOverlay);
  saveLabelButton.addEventListener("click", saveLabel);
  resetLabelButton.addEventListener("click", resetLabel);

  // Note card click to edit
  noteCard.addEventListener("click", function () {
    showNoteOverlay();
  });

  // Button press feedback effect
  addNoteButton.addEventListener("mousedown", function () {
    this.classList.add("button-pressed");
  });

  addNoteButton.addEventListener("mouseup", function () {
    this.classList.remove("button-pressed");
  });

  // Settings overlay: Refresh button handler
  const refreshBtn = document.getElementById("refreshButton");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      window.location.reload();
    });
  }

  // Functions

  /**
   * Initialize theme based on user preference or system preference
   */
  function initTheme() {
    const darkModePreference = localStorage.getItem("darkMode");

    const isDarkMode =
      darkModePreference === "true" ||
      (darkModePreference === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    }

    // Update the theme color for browser UI
    updateThemeColor(isDarkMode);

    // Set initial theme toggle text
    const menuThemeText = document.getElementById("menuThemeText");
    if (menuThemeText) {
      menuThemeText.textContent = isDarkMode
        ? "Turn off dark mode"
        : "Turn on dark mode";
    }
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
    updateThemeColor(isDarkMode);

    // Update theme toggle text
    const menuThemeText = document.getElementById("menuThemeText");
    if (menuThemeText) {
      menuThemeText.textContent = isDarkMode
        ? "Turn off dark mode"
        : "Turn on dark mode";
    }
  }

  /**
   * Update theme-color meta tag for browser UI elements
   */
  function updateThemeColor(isDarkMode) {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const color = isDarkMode ? "#121212" : "#c1c1ff";
      themeColorMeta.setAttribute("content", color);
    }
  }

  /**
   * Load the current label or use default
   */
  function loadLabel() {
    const savedLabel = localStorage.getItem("noteLabel");
    if (savedLabel) {
      metricLabel.textContent = savedLabel;
      currentLabel = savedLabel;
    } else {
      metricLabel.textContent = "Today's Note";
      currentLabel = "Today's Note";
    }
  }

  /**
   * Show the note overlay
   */
  function showNoteOverlay() {
    noteTextArea.value = currentNote;
    noteOverlay.classList.remove("hidden");
    document.body.classList.add("overlay-open");
    setTimeout(() => {
      noteTextArea.focus();
    }, 300);
  }

  /**
   * Hide the note overlay
   */
  function hideNoteOverlay() {
    noteOverlay.classList.add("hidden");
    document.body.classList.remove("overlay-open");
  }

  /**
   * Show the settings overlay
   */
  function showSettingsOverlay() {
    settingsOverlay.classList.remove("hidden");
    document.body.classList.add("overlay-open");
  }

  /**
   * Hide the settings overlay
   */
  function hideSettingsOverlay() {
    settingsOverlay.classList.add("hidden");
    document.body.classList.remove("overlay-open");
  }

  /**
   * Save the current note
   */
  function saveNote() {
    const newNote = noteTextArea.value.trim();
    previousNote = currentNote;
    currentNote = newNote;

    if (newNote) {
      noteText.textContent = newNote;
      noteContent.classList.remove("empty");
      localStorage.setItem("dailyNote", newNote);
      localStorage.setItem("noteDate", getCurrentDate());
      // Update button text to "✐ Edit"
      addNoteButtonText.textContent = "✐ Edit";
    } else {
      noteText.textContent = "No note yet";
      noteContent.classList.add("empty");
      localStorage.removeItem("dailyNote");
      localStorage.removeItem("noteDate");
      // Reset button text to "+ Add"
      addNoteButtonText.textContent = "+ Add";
    }

    updateClearNoteButtonState();
    hideNoteOverlay();
  }

  /**
   * Load the saved note if it exists and is from today
   */
  function loadNote() {
    const savedNote = localStorage.getItem("dailyNote");
    const savedNoteDate = localStorage.getItem("noteDate");
    const today = getCurrentDate();

    if (savedNote && savedNoteDate === today) {
      currentNote = savedNote;
      noteText.textContent = savedNote;
      noteContent.classList.remove("empty");
      // Update button text to "✐ Edit"
      addNoteButtonText.textContent = "✐ Edit";
    } else {
      // Clear old notes
      localStorage.removeItem("dailyNote");
      localStorage.removeItem("noteDate");
      noteText.textContent = "No note yet";
      noteContent.classList.add("empty");
      currentNote = "";
      // Reset button text to "+ Add"
      addNoteButtonText.textContent = "+ Add";
    }

    updateClearNoteButtonState();
  }

  /**
   * Get the current date in YYYY-MM-DD format
   */
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Clear the current note
   */
  function clearNote() {
    if (!currentNote) {
      hideSettingsOverlay();
      return;
    }

    previousNote = currentNote;
    currentNote = "";
    noteText.textContent = "No note yet";
    noteContent.classList.add("empty");
    localStorage.removeItem("dailyNote");
    // Reset button text to "+ Add"
    addNoteButtonText.textContent = "+ Add";

    updateClearNoteButtonState();
    // Show undo button
    showUndoButton();
    hideSettingsOverlay();
  }

  /**
   * Show the undo button for a limited time
   */
  function showUndoButton() {
    clearTimeout(undoTimer);

    undoButton.classList.remove("hidden");
    undoButton.offsetWidth; // Force reflow
    undoButton.classList.add("show");

    undoTimer = setTimeout(() => {
      undoButton.classList.remove("show");
      setTimeout(() => {
        undoButton.classList.add("hidden");
      }, 300);
    }, 5000); // Show for 5 seconds
  }

  /**
   * Undo the last clear operation
   */
  function undoClear() {
    currentNote = previousNote;
    noteText.textContent = currentNote;
    noteContent.classList.remove("empty");
    localStorage.setItem("dailyNote", currentNote);
    localStorage.setItem("noteDate", getCurrentDate());
    // Update button text to "✐ Edit" since we've restored the note
    addNoteButtonText.textContent = "✐ Edit";

    updateClearNoteButtonState();
    undoButton.classList.remove("show");
    setTimeout(() => {
      undoButton.classList.add("hidden");
    }, 300);

    clearTimeout(undoTimer);
  }

  /**
   * Show label edit overlay
   */
  function showLabelEditOverlay() {
    labelEditInput.value = currentLabel;
    labelEditOverlay.classList.remove("hidden");
    document.body.classList.add("overlay-open");
    setTimeout(() => {
      labelEditInput.focus();
      // Select all text for easy editing
      labelEditInput.setSelectionRange(0, labelEditInput.value.length);
    }, 300);
  }

  /**
   * Hide label edit overlay
   */
  function hideLabelEditOverlay() {
    labelEditOverlay.classList.add("hidden");
    document.body.classList.remove("overlay-open");
  }

  /**
   * Save the new label
   */
  function saveLabel() {
    const newLabel = labelEditInput.value.trim();
    if (newLabel) {
      metricLabel.textContent = newLabel;
      currentLabel = newLabel;
      localStorage.setItem("noteLabel", newLabel);
    }
    hideLabelEditOverlay();
  }

  /**
   * Reset to default label
   */
  function resetLabel() {
    const defaultLabel = "Today's Note";
    labelEditInput.value = defaultLabel;
    metricLabel.textContent = defaultLabel;
    currentLabel = defaultLabel;
    localStorage.setItem("noteLabel", defaultLabel);
    hideLabelEditOverlay();
  }

  // Add shadow effect to the bottom bar when scrolling
  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      bottomButtonsWrapper.classList.add("shadow");
    } else {
      bottomButtonsWrapper.classList.remove("shadow");
    }
  });

  // Utility: Enable/disable clear note button in settings overlay
  function updateClearNoteButtonState() {
    const clearBtn = document.getElementById("clearNoteButton");
    // Determine if there is a note for today
    const savedNote = localStorage.getItem("dailyNote");
    const savedNoteDate = localStorage.getItem("noteDate");
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    const hasNote =
      savedNote && savedNoteDate === today && savedNote.trim() !== "";
    if (clearBtn) {
      if (hasNote) {
        clearBtn.removeAttribute("aria-disabled");
        clearBtn.removeAttribute("disabled");
      } else {
        clearBtn.setAttribute("aria-disabled", "true");
        clearBtn.setAttribute("disabled", "");
      }
    }
  }

  // Call on load and after note changes
  updateClearNoteButtonState();
});
