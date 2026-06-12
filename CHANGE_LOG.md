# Change Log

## 2026-06-12 - Fraction Quest Vercel Entry Fix

- Summary: Added a dedicated `fraction-quest/index.html` deployment entrypoint and rewired Vercel root traffic to it.
- Files or modules affected: `fraction-quest/index.html`, `vercel.json`, `ARCHITECTURE.md`, `FUTURE_TASKS.md`, `CHANGE_LOG.md`
- Reason for change: The deployed Vercel URL was returning a root 404 instead of serving the Fraction Quest page.
- Architecture impact: Introduced a separate static game entrypoint and documented the root-route rewrite strategy.
- Migration or deployment impact: Vercel now needs the repository root plus `vercel.json` so `/` resolves to the game page.
- Follow-up notes: The game still depends on browser-loaded CDNs, so asset bundling is a good next hardening step.

## 2026-06-12 - Vercel Root Routing Adjustment

- Summary: Updated `server.js` so Vercel serves `fraction-quest/index.html` at `/` while local runs still serve the Technite homepage.
- Files or modules affected: `server.js`, `ARCHITECTURE.md`, `FUTURE_TASKS.md`, `CHANGE_LOG.md`
- Reason for change: The first production deploy was still returning the Technite homepage because Express was owning the root route.
- Architecture impact: Root entrypoint selection is now runtime-aware and deployment-specific.
- Migration or deployment impact: The Vercel deployment must be rebuilt so the new root route behavior is published.
- Follow-up notes: `vercel.json` can remain in place, but the Express app now provides the effective root behavior.
