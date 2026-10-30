"use strict";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("is-open", !isOpen);
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    closeMenu();
    menuButton.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

window.matchMedia("(min-width: 481px)").addEventListener("change", closeMenu);
document.querySelector("#year").textContent = new Date().getFullYear();

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealElements = document.querySelectorAll(
  ".section-label, .about-content, .education-card, .section-heading, .project, .interest, .skills-layout, .contact-link, .contact-bottom"
);
let revealObserver;

function configureMotion() {
  revealObserver?.disconnect();
  if (motionPreference.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.remove("reveal", "is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => {
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}

configureMotion();
motionPreference.addEventListener("change", configureMotion);

// Update the reading progress at most once per animation frame.
const readingProgress = document.createElement("div");
readingProgress.className = "reading-progress";
readingProgress.setAttribute("aria-hidden", "true");
document.body.append(readingProgress);
let scrollFramePending = false;
const natureScene = document.querySelector(".nature-scene");

function updateProgress() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  readingProgress.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
  if (natureScene) {
    const offset = motionPreference.matches ? 0 : Math.min(window.scrollY, 1000);
    natureScene.style.setProperty("--mountain-offset", `${offset * 0.12}px`);
    natureScene.style.setProperty("--near-offset", `${offset * 0.045}px`);
  }
  scrollFramePending = false;
}

function scheduleProgress() {
  if (scrollFramePending) return;
  scrollFramePending = true;
  window.requestAnimationFrame(updateProgress);
}

window.addEventListener("scroll", scheduleProgress, { passive: true });
window.addEventListener("resize", scheduleProgress);
window.addEventListener("load", scheduleProgress);
updateProgress();
motionPreference.addEventListener("change", scheduleProgress);

// Firefly-like woodland light, drawn with JavaScript rather than CSS keyframes.
const natureCanvas = document.querySelector(".nature-canvas");
const natureContext = natureCanvas?.getContext("2d");
if (natureContext) {
  const hero = document.querySelector(".hero");
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = null;
  let lastTime = 0;
  let visible = true;
  const pointer = { x: 0, y: 0, active: false };

  function resizeNature() {
    const bounds = natureCanvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    natureCanvas.width = Math.round(width * ratio);
    natureCanvas.height = Math.round(height * ratio);
    natureContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: width < 600 ? 28 : 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1 + Math.random() * 2,
      speed: 8 + Math.random() * 15,
      phase: Math.random() * Math.PI * 2,
    }));
    if (motionPreference.matches) natureContext.clearRect(0, 0, width, height);
  }

  function drawNature(time) {
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    natureContext.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.x += Math.sin(time * 0.0004 + particle.phase) * delta * 10;
      particle.y -= particle.speed * delta;
      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 140) {
          const force = (1 - distance / 140) * delta * 100;
          particle.x += dx / distance * force;
          particle.y += dy / distance * force;
        }
      }
      if (particle.y < -15) particle.y = height + 15;
      if (particle.x < -15) particle.x = width + 15;
      if (particle.x > width + 15) particle.x = -15;
      const glow = 0.3 + (Math.sin(time * 0.0015 + particle.phase) + 1) * 0.25;
      natureContext.beginPath();
      natureContext.fillStyle = `rgba(225, 240, 164, ${glow})`;
      natureContext.shadowColor = "#d7ed9b";
      natureContext.shadowBlur = 12;
      natureContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      natureContext.fill();
    }
    frame = window.requestAnimationFrame(drawNature);
  }

  function syncNature() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
    if (motionPreference.matches) natureContext.clearRect(0, 0, width, height);
    else if (visible && !document.hidden) frame = window.requestAnimationFrame(drawNature);
  }

  hero.addEventListener("pointermove", (event) => {
    const bounds = natureCanvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }, { passive: true });
  for (const eventName of ["pointerleave", "pointerup", "pointercancel"]) {
    hero.addEventListener(eventName, () => { pointer.active = false; });
  }
  if ("IntersectionObserver" in window) {
    const sceneObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncNature();
    });
    sceneObserver.observe(hero);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resizeNature).observe(natureCanvas);
  else window.addEventListener("resize", resizeNature);
  document.addEventListener("visibilitychange", syncNature);
  motionPreference.addEventListener("change", syncNature);
  resizeNature();
  syncNature();
}
