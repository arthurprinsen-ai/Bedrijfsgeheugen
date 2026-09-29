# 2026-09-29 — Bedrijfslek built-artifact contract

Material change: the website release lane now executes the Bedrijfslek regression after the exact Netlify production build command. This closes the gap between source correctness and generated-artifact correctness.

Evidence path: `.github/workflows/lane-website.yml` → exact Netlify build → `tests/brain-bedrijfslek-product-led-acquisition-v1.test.mjs`.

Terminal condition: the lane may only pass when the final built `zelfscan.html` still contains the 12-question value-first Bedrijfslek and no mandatory leadgate.
