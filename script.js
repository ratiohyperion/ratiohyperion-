/* Ratio Hyperion - script.js (compartido en todas las páginas) */

const nav = document.querySelector(".nav-menu");
const toggle = document.querySelector(".nav-toggle");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.innerHTML = nav.classList.contains("open") ? "×" : "☰";
  });
  document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.innerHTML = "☰";
    });
  });
}

const revealItems = document.querySelectorAll(
  ".section,.service-card,.eco-card,.contact-card,.why-grid div,.unit-card"
);
revealItems.forEach(item => item.classList.add("reveal"));
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.12 });
revealItems.forEach(item => observer.observe(item));

/* Galería: tabs por rubro */
const tabs = document.querySelectorAll(".gallery-tab");
const groups = document.querySelectorAll(".gallery-group");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    groups.forEach(g => g.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.target)?.classList.add("active");
  });
});

/* Lightbox */
const lightbox = document.querySelector(".lightbox");
const lightboxImg = lightbox?.querySelector("img");
document.querySelectorAll(".gallery-grid figure img").forEach(img => {
  img.addEventListener("click", () => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = img.src;
    lightbox.classList.add("open");
  });
});
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target.classList.contains("lightbox-close")) {
    lightbox.classList.remove("open");
  }
});
