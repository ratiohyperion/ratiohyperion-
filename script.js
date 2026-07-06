/* Ratio Hyperion - script.js */

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
  ".section,.service-card,.eco-card,.contact-card,.why-grid div"
);

revealItems.forEach(item => item.classList.add("reveal"));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, { threshold: 0.12 });

revealItems.forEach(item => observer.observe(item));
