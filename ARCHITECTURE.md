# Architecture

## Repository Overview

This repository currently contains two separate static web experiences and one Node-based administrative backend:

- `index.html`, `contact.html`, `jobs.html`, `terms.html`, `admin.html`, `styles.css`, and `script.js` make up the existing Technite website.
- `server.js` provides the local Express application for the Technite site, including static file hosting and the small SQLite-backed admin/job workflow.
- `fraction-quest/index.html` is a standalone single-file React/Babel game page for Fraction Quest.
- `server.js` now serves the Fraction Quest page at `/` when running on Vercel and preserves the Technite homepage for local/default runs.

The repository is intentionally kept simple: the front-end experiences are file-based, and the backend server is a single Express entrypoint.

## Fraction Quest Deployment Path

The Fraction Quest page is deployed as a static page rather than an application bundle.

- Source entrypoint: `fraction-quest/index.html`
- Runtime dependencies: browser-loaded React 18, ReactDOM 18, Babel Standalone, and Tailwind browser CDN
- Deployment routing: Vercel root traffic is handled by `server.js`, which serves `fraction-quest/index.html` at `/` in the Vercel runtime.

This keeps the game deployable on Vercel without requiring a Node build step or a separate bundling pipeline.

## Technite Backend

`server.js` remains the local Node/Express application for the Technite site.

- Static files are served from the repository root.
- SQLite is used for persistent job/application/admin data.
- The backend owns authentication, job management, and application submission flows.

The Fraction Quest static page does not depend on the Express backend and does not share storage or runtime state with it.

## Operational Notes

- The Fraction Quest page depends on external CDNs at runtime. If those CDNs are unavailable, the page will not bootstrap.
- `server.js` now owns the root-route selection so Vercel can serve Fraction Quest without changing the rest of the file layout.
- Existing Technite files were left in place to preserve backward compatibility with the current repository contents.
