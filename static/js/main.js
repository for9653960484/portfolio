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

  document.querySelectorAll(".card-media--carousel").forEach((media) => {
    const slides = [...media.querySelectorAll(".card-shot-wrap")];
    const indexLabel = media.querySelector(".carousel-index");
    if (!slides.length) return;
    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      if (indexLabel) indexLabel.textContent = String(index + 1);
    };

    media.querySelector(".carousel-prev")?.addEventListener("click", () => show(index - 1));
    media.querySelector(".carousel-next")?.addEventListener("click", () => show(index + 1));

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
    }, { passive: true });
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
});

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
      throw new Error(data.error || "Не удалось загрузить изображение");
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
      throw new Error(data.error || "Не удалось удалить изображение");
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
    zoom.setAttribute("aria-label", "Увеличить иллюстрацию");
    frame.prepend(zoom);
  }
  let image = zoom.querySelector("img");
  if (!image) {
    image = document.createElement("img");
    image.alt = "";
    zoom.append(image);
  }
  image.src = url;
  frame.classList.add("has-image");
}

function clearShotImage(shot) {
  const frame = shotFrame(shot);
  frame.querySelector(".card-shot-zoom")?.remove();
  frame.classList.remove("has-image");
  if (frame.querySelector(".card-shot-empty")) return;

  const empty = document.createElement("div");
  empty.className = "card-shot-empty";
  empty.innerHTML = '<span class="card-shot-plus" aria-hidden="true">+</span><span class="card-shot-hint">Загрузить</span>';
  frame.prepend(empty);
}
