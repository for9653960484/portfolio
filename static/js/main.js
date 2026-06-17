/**
 * Portfolio — Minimal JS
 * Smooth scroll, theme toggle, subtle interactions
 */

const THEME_KEY = "portfolio-theme";

function getTheme() {
  return localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

document.addEventListener("DOMContentLoaded", () => {
  setTheme(getTheme());

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = getTheme();
    setTheme(current === "dark" ? "light" : "dark");
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Header opacity on scroll (uses CSS variables)
  const header = document.querySelector(".header");
  if (header) {
    const updateHeaderBg = () => {
      const vars = getComputedStyle(document.documentElement);
      const base = vars.getPropertyValue("--header-bg").trim();
      const scroll = vars.getPropertyValue("--header-bg-scroll").trim();
      header.style.background = window.scrollY > 50 ? scroll : base;
    };
    window.addEventListener("scroll", updateHeaderBg, { passive: true });
    updateHeaderBg();
  }

});
