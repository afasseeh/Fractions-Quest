const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
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

function setActiveLink(activeLink) {
  document.querySelectorAll(".menu a").forEach((link) => link.classList.remove("is-active"));
  if (activeLink) activeLink.classList.add("is-active");
}

const sectionLinks = Array.from(document.querySelectorAll('.menu a[href*="index.html#"]'));
const sectionMap = new Map();
sectionLinks.forEach((link) => {
  const hash = link.getAttribute("href")?.split("#")[1];
  if (!hash) return;
  const section = document.getElementById(hash);
  if (section) sectionMap.set(section, link);
});

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
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const to = contactForm.getAttribute("data-mailto") || "info@technite.net";
    const subject = `New inquiry from ${(formData.get("name") || "Website Visitor").toString().trim()}`;
    const lines = [
      `Full Name: ${formData.get("name") || ""}`,
      `Organization: ${formData.get("organization") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Project Type: ${formData.get("project_type") || ""}`,
      "",
      "Message:",
      `${formData.get("message") || ""}`,
    ];
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });
}

function injectWhatsAppFab() {
  const link = document.createElement("a");
  link.href = "https://wa.me/201034463134?text=Hello%20Technite%2C%20I%20want%20to%20discuss%20a%20business%20project.";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "whatsapp-fab";
  link.setAttribute("aria-label", "Chat with Technite on WhatsApp");
  link.textContent = "WA";
  document.body.appendChild(link);
}
injectWhatsAppFab();

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function renderJobs(jobs) {
  const list = document.getElementById("job-list");
  const select = document.getElementById("application-job-id");
  const empty = document.getElementById("job-empty");
  if (!list || !select || !empty) return;

  list.innerHTML = "";
  select.innerHTML = "";

  if (!jobs.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  jobs.forEach((job) => {
    const card = document.createElement("article");
    card.className = "job-card";
    card.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description}</p>
      <p><strong>Type:</strong> ${job.type}${job.is_permanent ? " • Always Open" : ""}</p>
    `;
    list.appendChild(card);

    const option = document.createElement("option");
    option.value = String(job.id);
    option.textContent = job.title;
    select.appendChild(option);
  });
}

async function setupJobsPage() {
  if (!document.getElementById("job-list")) return;
  const jobs = await fetchJson("/api/jobs");
  renderJobs(jobs);

  const form = document.getElementById("job-application-form");
  const result = document.getElementById("application-result");
  if (!form || !result) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    result.textContent = "Submitting...";
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      await fetchJson("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result.textContent = "Application submitted successfully.";
      form.reset();
    } catch (error) {
      result.textContent = error.message;
    }
  });
}

function jobCardTemplate(job) {
  return `
    <article class="job-card">
      <h3>${job.title}</h3>
      <p>${job.description}</p>
      <p><strong>Type:</strong> ${job.type}</p>
      <p><strong>Status:</strong> ${job.is_active ? "Active" : "Inactive"}${job.is_permanent ? " • Permanent" : ""}</p>
      <div class="job-actions">
        <button class="btn btn-ghost admin-edit-job" data-id="${job.id}">Edit</button>
        <button class="btn btn-ghost admin-delete-job" data-id="${job.id}" ${job.is_permanent ? "disabled" : ""}>Delete</button>
      </div>
    </article>
  `;
}

function applicationTemplate(app) {
  const statusClass = `status-${app.status}`;
  return `
    <article class="admin-card">
      <h3>${app.full_name} <span class="status-pill ${statusClass}">${app.status}</span></h3>
      <p><strong>Role:</strong> ${app.job_title}</p>
      <p><strong>Email:</strong> ${app.email}</p>
      <p><strong>Phone:</strong> ${app.phone}</p>
      <p><strong>Organization:</strong> ${app.organization || "-"}</p>
      <p><strong>LinkedIn:</strong> ${app.linkedin || "-"}</p>
      <p><strong>Message:</strong> ${app.cover_letter || "-"}</p>
      <label>
        Update Status
        <select class="admin-app-status" data-id="${app.id}">
          ${["new", "reviewing", "shortlisted", "rejected", "hired"].map((s) => `<option value="${s}" ${s === app.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </label>
    </article>
  `;
}

async function setupAdminPage() {
  const loginPanel = document.getElementById("admin-login-panel");
  if (!loginPanel) return;

  const loginForm = document.getElementById("admin-login-form");
  const loginResult = document.getElementById("admin-login-result");
  const dashboard = document.getElementById("admin-dashboard");
  const appsPanel = document.getElementById("admin-applications-panel");
  const jobsList = document.getElementById("admin-jobs-list");
  const appsList = document.getElementById("admin-applications-list");
  const jobForm = document.getElementById("admin-job-form");
  const cancelEdit = document.getElementById("admin-job-cancel");
  const logoutBtn = document.getElementById("admin-logout");

  async function loadDashboard() {
    const [jobs, applications] = await Promise.all([
      fetchJson("/api/admin/jobs"),
      fetchJson("/api/admin/applications"),
    ]);
    jobsList.innerHTML = jobs.map(jobCardTemplate).join("");
    appsList.innerHTML = applications.map(applicationTemplate).join("");

    jobsList.querySelectorAll(".admin-edit-job").forEach((btn) => {
      btn.addEventListener("click", () => {
        const job = jobs.find((j) => String(j.id) === btn.dataset.id);
        if (!job) return;
        document.getElementById("admin-job-id").value = String(job.id);
        document.getElementById("admin-job-title").value = job.title;
        document.getElementById("admin-job-type").value = job.type;
        document.getElementById("admin-job-description").value = job.description;
        document.getElementById("admin-job-active").checked = !!job.is_active;
      });
    });

    jobsList.querySelectorAll(".admin-delete-job").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.disabled) return;
        await fetchJson(`/api/admin/jobs/${btn.dataset.id}`, { method: "DELETE" });
        await loadDashboard();
      });
    });

    appsList.querySelectorAll(".admin-app-status").forEach((select) => {
      select.addEventListener("change", async () => {
        await fetchJson(`/api/admin/applications/${select.dataset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: select.value }),
        });
      });
    });
  }

  async function setLoggedIn() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    appsPanel.hidden = false;
    await loadDashboard();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginResult.textContent = "Signing in...";
    const payload = Object.fromEntries(new FormData(loginForm).entries());
    try {
      await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      loginResult.textContent = "";
      await setLoggedIn();
    } catch (error) {
      loginResult.textContent = error.message;
    }
  });

  jobForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("admin-job-id").value.trim();
    const payload = {
      title: document.getElementById("admin-job-title").value.trim(),
      type: document.getElementById("admin-job-type").value.trim(),
      description: document.getElementById("admin-job-description").value.trim(),
      isActive: document.getElementById("admin-job-active").checked,
    };

    if (id) {
      await fetchJson(`/api/admin/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJson("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    jobForm.reset();
    document.getElementById("admin-job-id").value = "";
    document.getElementById("admin-job-active").checked = true;
    await loadDashboard();
  });

  cancelEdit.addEventListener("click", () => {
    jobForm.reset();
    document.getElementById("admin-job-id").value = "";
    document.getElementById("admin-job-active").checked = true;
  });

  logoutBtn.addEventListener("click", async () => {
    await fetchJson("/api/auth/logout", { method: "POST" });
    loginPanel.hidden = false;
    dashboard.hidden = true;
    appsPanel.hidden = true;
  });

  try {
    await fetchJson("/api/auth/me");
    await setLoggedIn();
  } catch (_error) {
    loginPanel.hidden = false;
  }
}

setupJobsPage().catch((error) => {
  const empty = document.getElementById("job-empty");
  if (empty) {
    empty.hidden = false;
    empty.textContent = error.message;
  }
});
setupAdminPage().catch((error) => {
  const loginResult = document.getElementById("admin-login-result");
  if (loginResult) loginResult.textContent = error.message;
});
