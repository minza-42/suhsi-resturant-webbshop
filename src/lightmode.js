// lightmode.js - Hanterar växling mellan dark och light mode

document.addEventListener("DOMContentLoaded", function () {
  const themeToggle = document.getElementById("theme-toggle");
  let lightModeActive = false;
  let lightLink = null;

  function setLightMode(on) {
    if (on) {
      if (!lightLink) {
        lightLink = document.createElement("link");
        lightLink.rel = "stylesheet";
        lightLink.href = "css/lightmode.css";
        lightLink.id = "lightmode-css";
        document.head.appendChild(lightLink);
      }
    } else {
      if (lightLink) {
        lightLink.remove();
        lightLink = null;
      } else {
        const existing = document.getElementById("lightmode-css");
        if (existing) existing.remove();
      }
    }
  }

  themeToggle.addEventListener("click", () => {
    lightModeActive = !lightModeActive;
    setLightMode(lightModeActive);
    // Byt ikon
    const img = themeToggle.querySelector("img");
    if (lightModeActive) {
      img.src = "img/light_mode.svg";
      img.alt = "Light mode";
    } else {
      img.src = "img/dark_mode.svg";
      img.alt = "Dark mode";
    }
  });
});
