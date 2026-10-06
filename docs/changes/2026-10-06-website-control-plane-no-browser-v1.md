# Website control-plane browser scope — 2026-10-06

## Change

Workflow definitions under `.github/workflows/` are now classified as website **control-plane**, not website runtime artifacts. A PR that only changes workflow YAML no longer needs a Netlify preview, Playwright browser installation, or the full public-sitemap visibility sweep.

Real website/runtime changes remain protected. `assets/js/menu.js`, `netlify.toml`, shared site-shell code, public HTML and other website artifacts keep their existing preview and browser requirements.

## Why

A CI-only PR such as #3886 was activating the full website high-risk lane and the bounded 9-minute visibility crawl solely because workflow YAML was globally marked high-risk. The delivery control plane was therefore consuming runtime verification even when no runtime artifact changed.

## Safety

Control-plane changes still run website baseline and syntax-preflight contracts. Regression tests explicitly prove that workflow-only changes skip browser preview while real shared website artifacts still require it.
