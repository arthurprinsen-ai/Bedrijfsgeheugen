# Production readback governance/runtime scope — 29 September 2026

A mixed governance closure could still be treated as a website deployment because Production Release Readback used the full merge diff internally, even though its trigger already ignored skills, docs, tests and learning paths.

The readback now derives `runtimeChangedPaths` before delivery planning. Governance-only paths such as `.agents/**`, `docs/**`, `tests/**`, `brain/learning/**`, `AGENTS.md`, the canonical system map and the Brain delivery classifier no longer force Netlify/browser deployment.

Real website, portal and Netlify-runtime paths remain deployment-required and fail closed. Mixed changes remain deployment-required whenever at least one true runtime path is present.
