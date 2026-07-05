/* Ratio Hyperion */

const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

const nav = document.querySelector(".nav-menu");

if (nav) {

  const btn = document.createElement("button");

  btn.className = "nav-toggle";
  btn.innerHTML = "☰";

  document.querySelector(".nav-container").insertBefore(btn, nav);

  btn.addEventListener("click", () => {

    nav.classList.toggle("open");

    if (nav.classList.contains("open")) {
      btn.innerHTML = "✕";
    } else {
      btn.innerHTML = "☰";
    }

  });

}

const elementos = document.querySelectorAll(
".section,.service-card,.solution-card,.contact-card,.project-box"
);

elementos.forEach(el=>el.classList.add("reveal"));

const observer = new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("is-visible");

}

});

},{
threshold:0.15
});

elementos.forEach(el=>observer.observe(el));
