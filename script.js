const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 70, 320)}ms`;
  observer.observe(el);
});

const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });
}

const yearNodes = document.querySelectorAll(".copyright-year");
if (yearNodes.length > 0) {
  const year = new Date().getFullYear().toString();
  yearNodes.forEach((node) => {
    node.textContent = year;
  });
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const to = contactForm.getAttribute("data-mailto") || "info@technite.net";

    const name = (formData.get("name") || "").toString().trim();
    const organization = (formData.get("organization") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const projectType = (formData.get("project_type") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();

    const subject = `New inquiry from ${name || "Website Visitor"}`;
    const bodyLines = [
      `Full Name: ${name}`,
      `Organization: ${organization}`,
      `Email: ${email}`,
      `Project Type: ${projectType}`,
      "",
      "Message:",
      message,
    ];

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailtoUrl;
  });
}

const sectionLinks = Array.from(
  document.querySelectorAll('.menu a[href*="index.html#"]')
);
const sectionMap = new Map();
sectionLinks.forEach((link) => {
  const hash = link.getAttribute("href")?.split("#")[1];
  if (!hash) return;
  const section = document.getElementById(hash);
  if (section) sectionMap.set(section, link);
});

function setActiveLink(activeLink) {
  const allMenuLinks = document.querySelectorAll(".menu a");
  allMenuLinks.forEach((link) => link.classList.remove("is-active"));
  if (activeLink) activeLink.classList.add("is-active");
}

const path = window.location.pathname.toLowerCase();
const isHomePage = path === "/" || path.endsWith("/index.html") || path === "/index";

if (sectionMap.size > 0 && isHomePage) {
  const homeLink = document.querySelector('.menu a[href="index.html"]');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length > 0) {
        const link = sectionMap.get(visible[0].target);
        setActiveLink(link || homeLink);
      } else {
        setActiveLink(homeLink);
      }
    },
    { rootMargin: "-30% 0px -50% 0px", threshold: [0.2, 0.45, 0.65] }
  );

  sectionMap.forEach((_link, section) => sectionObserver.observe(section));

  sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveLink(link);
      if (menu) menu.classList.remove("open");
    });
  });
}
