# Technite Website

## Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Admin Panel

Open [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

- Initial admin email: `Loai.metwalli@technite.net`
- Default password: `Technite@2026`
- Change default password via env var before first run:

```bash
ADMIN_DEFAULT_PASSWORD="YourStrongPassword" npm start
```

## Features

- Jobs are database-managed from admin panel (add/edit/remove active jobs)
- Permanent organizer role is seeded and cannot be deleted
- Candidate applications are stored in SQLite and reviewed in admin panel
- Floating WhatsApp business chat button
