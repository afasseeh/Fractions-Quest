# Future Tasks

## Remove Runtime Babel Dependency

- Context: Fraction Quest currently uses Babel Standalone in the browser.
- Limitation: The page depends on runtime transpilation and multiple external CDNs.
- Proposed improvement: Precompile the JSX into plain JavaScript during a build step.
- Benefit: Faster startup, fewer runtime failure points, and better deployment reliability.
- Priority: Medium

## Bundle External Front-End Assets

- Context: Fraction Quest loads React, ReactDOM, Babel, and Tailwind from public CDNs.
- Limitation: The page is sensitive to external network availability and CDN policy changes.
- Proposed improvement: Vendor or bundle the required assets into the deployment artifact.
- Benefit: More deterministic rendering and fewer production outages caused by third-party script failure.
- Priority: Medium

## Split the Game Into Smaller Modules

- Context: Fraction Quest is currently a large single-file HTML implementation.
- Limitation: The code is harder to maintain, review, and extend safely.
- Proposed improvement: Break gameplay, UI, persistence, and audio into separate modules.
- Benefit: Easier maintenance and lower risk of regressions when adding new worlds or question types.
- Priority: Low

## Remove Environment-Based Root Switching

- Context: `server.js` now selects the root entrypoint based on whether it is running on Vercel.
- Limitation: The deployment behavior is implicit rather than driven by explicit deployment config.
- Proposed improvement: Move the root selection into a clearer deployment boundary once the repository is split into dedicated app surfaces.
- Benefit: Lower confusion for future maintenance and less coupling between the Technite app and the game page.
- Priority: Low
