/* theme.js - Shared theme logic for all pages */
/* jshint esversion: 6 */

export function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  // 1. Determine initial theme: Check localStorage, otherwise default to "dark"
  let currentTheme = localStorage.getItem("theme") || "dark";

  // 2. Apply the initial theme immediately on load
  applyTheme(currentTheme);
  updateToggleButton(themeToggle, currentTheme);

  // 3. Listen for both click and touchstart to switch themes (iPad/iOS fix)
  const toggleTheme = (e) => {
    e.preventDefault();
    currentTheme = document.documentElement.classList.contains("dark-mode")
      ? "light"
      : "dark";
    applyTheme(currentTheme);
    localStorage.setItem("theme", currentTheme);
    updateToggleButton(themeToggle, currentTheme);
  };
  themeToggle.addEventListener("click", toggleTheme);
  themeToggle.addEventListener("touchstart", toggleTheme, { passive: false });
}

/**
 * Adds or removes the CSS class based on the selected theme
 */
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark-mode");
  } else {
    document.documentElement.classList.remove("dark-mode");
  }
}

/**
 * Updates the button icon to show what the user can switch TO
 */
function updateToggleButton(btn, theme) {
  // If current theme is dark, show the Light Mode icon (sun) to allow switching
  btn.innerHTML =
    theme === "dark"
      ? '<img src="img/light_mode.svg" alt="Light mode" width="24" height="24" style="vertical-align:middle;">'
      : '<img src="img/dark_mode.svg" alt="Dark mode" width="24" height="24" style="vertical-align:middle;">';
}

// Initialize when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initTheme);
