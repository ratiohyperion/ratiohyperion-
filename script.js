/* Ratio Hyperion - script.js */

const header = document.querySelector(".site-header");
const nav = document.querySelector(".nav-menu");
const toggle = document.querySelector(".nav-toggle");

window.addEventListener("scroll", () => {
  if (header) {
    header.classList.toggle("scrolled", window.scrollY > 20);
  }
});

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.innerHTML = nav.classList.contains("open") ? "✕" : "☰";
  });

  document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.innerHTML = "☰";
    });
  });
}

const revealItems = document.querySelectorAll(
  ".section, .service-card, .contact-card"
);

revealItems.forEach(item => item.classList.add("reveal"));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, {
  threshold: 0.15
});

revealItems.forEach(item => observer.observe(item));
