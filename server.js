const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "technite-session-secret";
const DEFAULT_ADMIN_EMAIL = "Loai.metwalli@technite.net";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "Technite@2026";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie;
  if (!raw) return out;
  raw.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    out[k] = decodeURIComponent(rest.join("="));
  });
  return out;
}

function createSession(admin) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    adminId: admin.id,
    email: admin.email,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.technite_admin_session;
  if (!token || !sessions.has(token)) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, session);
  return { token, ...session };
}

function authRequired(req, res, next) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.adminSession = session;
  next();
}

let db;

async function initializeDb() {
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
  db = await open({
    filename: path.join(__dirname, "data", "technite.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_permanent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      organization TEXT,
      linkedin TEXT,
      cover_letter TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  const admin = await db.get("SELECT id FROM admins WHERE lower(email)=lower(?)", [DEFAULT_ADMIN_EMAIL]);
  if (!admin) {
    const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await db.run("INSERT INTO admins (email, password_hash) VALUES (?, ?)", [DEFAULT_ADMIN_EMAIL, hash]);
  }

  const organizer = await db.get("SELECT id FROM jobs WHERE is_permanent = 1");
  if (!organizer) {
    await db.run(
      `INSERT INTO jobs (title, description, type, is_active, is_permanent)
       VALUES (?, ?, ?, 1, 1)`,
      [
        "Conference Organizer (Permanent Role)",
        "We are always looking for organizers to support scientific congresses, workshops, and high-impact events.",
        "Permanent",
      ]
    );
  }
}

app.get("/api/jobs", async (_req, res) => {
  const jobs = await db.all(
    `SELECT id, title, description, type, is_active, is_permanent, created_at
     FROM jobs
     WHERE is_active = 1
     ORDER BY is_permanent DESC, created_at DESC`
  );
  res.json(jobs);
});

app.post("/api/applications", async (req, res) => {
  const { jobId, fullName, email, phone, organization, linkedin, coverLetter } = req.body || {};
  if (!jobId || !fullName || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const job = await db.get("SELECT id, is_active FROM jobs WHERE id = ?", [jobId]);
  if (!job || !job.is_active) {
    return res.status(400).json({ error: "Invalid job selection." });
  }

  await db.run(
    `INSERT INTO applications (job_id, full_name, email, phone, organization, linkedin, cover_letter)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [jobId, fullName, email, phone, organization || "", linkedin || "", coverLetter || ""]
  );
  res.status(201).json({ success: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const admin = await db.get("SELECT id, email, password_hash FROM admins WHERE lower(email) = lower(?)", [email]);
  if (!admin) return res.status(401).json({ error: "Invalid credentials." });

  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials." });

  const token = createSession(admin);
  res.setHeader("Set-Cookie", `technite_admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
  res.json({ success: true, email: admin.email });
});

app.post("/api/auth/logout", (req, res) => {
  const session = getSession(req);
  if (session) sessions.delete(session.token);
  res.setHeader("Set-Cookie", "technite_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  res.json({ success: true });
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  res.json({ email: req.adminSession.email });
});

app.get("/api/admin/jobs", authRequired, async (_req, res) => {
  const jobs = await db.all(
    `SELECT id, title, description, type, is_active, is_permanent, created_at
     FROM jobs
     ORDER BY is_permanent DESC, created_at DESC`
  );
  res.json(jobs);
});

app.post("/api/admin/jobs", authRequired, async (req, res) => {
  const { title, description, type, isActive } = req.body || {};
  if (!title || !description || !type) {
    return res.status(400).json({ error: "Title, description, and type are required." });
  }

  const result = await db.run(
    `INSERT INTO jobs (title, description, type, is_active, is_permanent)
     VALUES (?, ?, ?, ?, 0)`,
    [title, description, type, isActive ? 1 : 0]
  );
  res.status(201).json({ id: result.lastID });
});

app.put("/api/admin/jobs/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, type, isActive } = req.body || {};
  const existing = await db.get("SELECT id, is_permanent FROM jobs WHERE id = ?", [id]);
  if (!existing) return res.status(404).json({ error: "Job not found." });

  await db.run(
    `UPDATE jobs
     SET title = ?, description = ?, type = ?, is_active = ?
     WHERE id = ?`,
    [title, description, type, isActive ? 1 : 0, id]
  );
  res.json({ success: true });
});

app.delete("/api/admin/jobs/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.get("SELECT id, is_permanent FROM jobs WHERE id = ?", [id]);
  if (!existing) return res.status(404).json({ error: "Job not found." });
  if (existing.is_permanent) return res.status(400).json({ error: "Permanent organizer job cannot be deleted." });

  await db.run("DELETE FROM jobs WHERE id = ?", [id]);
  res.json({ success: true });
});

app.get("/api/admin/applications", authRequired, async (_req, res) => {
  const applications = await db.all(
    `SELECT a.id, a.full_name, a.email, a.phone, a.organization, a.linkedin, a.cover_letter, a.status, a.created_at,
            j.title AS job_title
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     ORDER BY a.created_at DESC`
  );
  res.json(applications);
});

app.patch("/api/admin/applications/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowed = new Set(["new", "reviewing", "shortlisted", "rejected", "hired"]);
  if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status." });

  await db.run("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
  res.json({ success: true });
});

app.use(express.static(__dirname));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

async function start() {
  await initializeDb();
  app.listen(PORT, () => {
    console.log(`Technite server running on http://localhost:${PORT}`);
    console.log(`Admin email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`Default admin password: ${DEFAULT_ADMIN_PASSWORD}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
