# 2026-09-25 — Netlify Identity v2 build compatibility

Production build failed before i18n generation because `tools/bouw-powerhouse-auth.mjs` required the undocumented path `node_modules/@netlify/identity/dist/main.js`.

The customer portal itself uses the official Netlify Identity Widget. The obsolete vendoring step is now optional, while the customer-portal auth race guard and recovery/invite-token guard remain mandatory.

Closure requires protected merge, exact-main production build, and live browser proof.

Additional closure evidence: repaired visible mobile selector/three-route locale proof, corrected the setBilling-scoped ARIA regression oracle, and synchronized the pricing rescue content-addressed asset key across source/build/production gates.
