/**
 * Portfolio — Minimal JS
 * Smooth scroll, theme toggle, subtle interactions
 */

const THEME_KEY = "portfolio-theme";
const LANG_KEY = "portfolio-lang";
const LANGS = ["ru", "en", "fr"];
const I18N = JSON.parse(document.getElementById("site-i18n")?.textContent || "{}");

function getTheme() {
  return localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return LANGS.includes(saved) ? saved : "ru";
}

function uiText(lang, key) {
  return I18N[lang]?.ui?.[key] || I18N.ru?.ui?.[key] || "";
}

function formatText(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

function captureOriginals() {
  document.querySelectorAll("[data-i18n^='author.']").forEach((el) => {
    if (el.dataset.ruText == null) el.dataset.ruText = el.textContent;
  });
  document.querySelectorAll(".card").forEach((card) => {
    if (card.dataset.titleRu != null) return;
    const title = card.querySelector(".card-title a") || card.querySelector(".card-title");
    card.dataset.titleRu = title?.textContent.trim() || "";
    card.dataset.descRu = card.querySelector(".card-desc")?.textContent.trim() || "";
  });
}

function projectCopy(card, lang) {
  const id = card.dataset.projectId;
  if (lang !== "ru") {
    const translated = I18N[lang]?.projects?.[id];
    if (translated?.title) return translated;
  }
  return { title: card.dataset.titleRu || "", description: card.dataset.descRu || "" };
}

function authorText(el, lang) {
  const field = el.dataset.i18n.slice("author.".length);
  if (lang !== "ru") {
    const value = I18N[lang]?.author?.[field];
    if (value) return value;
  }
  return el.dataset.ruText ?? el.textContent;
}

function applyLanguage(lang) {
  if (!LANGS.includes(lang)) lang = "ru";
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  const replaceLabel = uiText(lang, "upload.replace");
  if (replaceLabel) {
    document.documentElement.style.setProperty("--label-replace", `"${replaceLabel}"`);
  }

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key.startsWith("author.")) {
      el.textContent = authorText(el, lang);
      return;
    }
    const text = uiText(lang, key);
    if (text) el.textContent = text;
  });

  document.querySelectorAll(".card").forEach((card) => {
    const copy = projectCopy(card, lang);
    const title = card.querySelector(".card-title a") || card.querySelector(".card-title");
    if (title) title.textContent = copy.title;
    const desc = card.querySelector(".card-desc");
    if (desc) desc.textContent = copy.description;

    card.querySelectorAll("[data-i18n-aria], [data-i18n-alt]").forEach((el) => {
      const key = el.dataset.i18nAria || el.dataset.i18nAlt;
      const template = uiText(lang, key);
      if (!template) return;
      const label = formatText(template, { title: copy.title, n: el.dataset.i18nN || "" });
      if (el.dataset.i18nAlt) el.alt = label;
      else el.setAttribute("aria-label", label);
    });
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    if (el.closest(".card")) return;
    const label = uiText(lang, el.dataset.i18nAria);
    if (label) el.setAttribute("aria-label", label);
  });

  document.querySelectorAll(".lang-switch-btn").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.lang === lang ? "true" : "false");
  });

  const role = document.querySelector("[data-i18n='author.role']")?.textContent.trim() || "";
  const tagline = (document.querySelector("[data-i18n='author.tagline']")?.textContent || "").replace(/\s+/g, " ").trim();
  if (role && tagline) document.title = `${role} — ${tagline}`;
}

captureOriginals();
applyLanguage(getLang());

let pageReady = false;

function initPage() {
  if (pageReady) return;
  pageReady = true;
  setTheme(getTheme());

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = getTheme();
    setTheme(current === "dark" ? "light" : "dark");
  });

  document.querySelectorAll(".lang-switch-btn").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
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

  document.querySelectorAll(".card-media--carousel").forEach((media) => {
    const slides = [...media.querySelectorAll(".card-shot-wrap")];
    const segments = [...media.querySelectorAll(".carousel-segment")];
    if (!slides.length) return;
    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      segments.forEach((segment, segmentIndex) => {
        const active = segmentIndex === index;
        segment.classList.toggle("is-active", active);
        if (active) segment.setAttribute("aria-current", "true");
        else segment.removeAttribute("aria-current");
      });
    };

    segments.forEach((segment, segmentIndex) => {
      segment.addEventListener("click", () => {
        show(segmentIndex);
        queue();
      });
    });

    let touchStartX = 0;
    let touchStartY = 0;
    media.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });
    media.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      show(index + (deltaX < 0 ? 1 : -1));
      queue();
    }, { passive: true });

    const AUTO_MS = 10000;
    let timer = 0;
    const queue = () => {
      window.clearInterval(timer);
      if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = window.setInterval(() => show(index + 1), AUTO_MS);
    };
    queue();
  });

  document.querySelectorAll(".card-shot-wrap").forEach((shot) => {
    const input = shot.querySelector(".card-shot-input");
    const removeButton = shot.querySelector(".card-shot-remove");
    if (!input) return;

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      uploadShot(shot, file);
    });

    shot.querySelector(".card-shot")?.addEventListener("click", (event) => {
      if (event.target.closest(".card-shot-remove, .card-shot-zoom, .card-shot-input, .card-shot-upload")) return;
      const frame = shot.querySelector(".card-shot");
      if (frame?.classList.contains("has-image")) return;
      input.click();
    });

    removeButton?.addEventListener("click", () => {
      deleteShot(shot);
    });
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = lightbox?.querySelector(".lightbox-image");

  document.addEventListener("click", (event) => {
    const zoom = event.target.closest(".card-shot-zoom");
    if (!zoom || !lightbox || !lightboxImage) return;
    const image = zoom.querySelector("img");
    if (!image?.src) return;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || "";
    lightbox.showModal();
  });

  lightbox?.querySelector(".lightbox-close")?.addEventListener("click", () => {
    lightbox.close();
  });

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  lightbox?.addEventListener("close", () => {
    if (lightboxImage) {
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPage);
initPage();

function shotFrame(shot) {
  return shot.querySelector(".card-shot") || shot;
}

function shotContext(shot) {
  const card = shot.closest("[data-project-id]");
  return {
    card,
    projectId: card?.dataset.projectId,
    slot: shot.dataset.slot,
    status: card?.querySelector(".card-upload-status"),
  };
}

function setShotStatus(status, message) {
  if (!status) return;
  status.hidden = !message;
  status.textContent = message || "";
}

async function uploadShot(shot, file) {
  const { projectId, slot, status } = shotContext(shot);
  const form = new FormData();
  form.append("file", file);
  const frame = shotFrame(shot);
  frame.classList.add("is-uploading");
  setShotStatus(status, "");

  try {
    const response = await fetch(`/api/projects/${projectId}/images/${slot}`, {
      method: "POST",
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || uiText(getLang(), "upload.fail"));
    }
    showShotImage(shot, `${data.url}?t=${Date.now()}`);
  } catch (error) {
    setShotStatus(status, error.message);
  } finally {
    frame.classList.remove("is-uploading");
  }
}

async function deleteShot(shot) {
  const { projectId, slot, status } = shotContext(shot);
  const frame = shotFrame(shot);
  frame.classList.add("is-uploading");
  setShotStatus(status, "");

  try {
    const response = await fetch(`/api/projects/${projectId}/images/${slot}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || uiText(getLang(), "delete.fail"));
    }
    clearShotImage(shot);
  } catch (error) {
    setShotStatus(status, error.message);
  } finally {
    frame.classList.remove("is-uploading");
  }
}

function showShotImage(shot, url) {
  const frame = shotFrame(shot);
  frame.querySelector(".card-shot-empty")?.remove();
  let zoom = frame.querySelector(".card-shot-zoom");
  if (!zoom) {
    zoom = document.createElement("button");
    zoom.type = "button";
    zoom.className = "card-shot-zoom";
    zoom.dataset.i18nAria = "shot.zoom";
    zoom.dataset.i18nN = String(Number(shot.dataset.slot) + 1);
    frame.prepend(zoom);
  }
  let image = zoom.querySelector("img");
  if (!image) {
    image = document.createElement("img");
    image.alt = "";
    image.dataset.i18nAlt = "shot.alt";
    image.dataset.i18nN = zoom.dataset.i18nN;
    zoom.append(image);
  }
  image.src = url;
  frame.classList.add("has-image");
  applyLanguage(getLang());
}

function clearShotImage(shot) {
  const frame = shotFrame(shot);
  frame.querySelector(".card-shot-zoom")?.remove();
  frame.classList.remove("has-image");
  if (frame.querySelector(".card-shot-empty")) return;

  const empty = document.createElement("div");
  empty.className = "card-shot-empty";
  empty.innerHTML = '<span class="card-shot-plus" aria-hidden="true">+</span><span class="card-shot-hint" data-i18n="upload.hint"></span>';
  frame.prepend(empty);
  applyLanguage(getLang());
}
