# 2026-09-25 — Netlify Identity v2 build compatibility

Production build failed before i18n generation because `tools/bouw-powerhouse-auth.mjs` required the undocumented path `node_modules/@netlify/identity/dist/main.js`.

The customer portal itself uses the official Netlify Identity Widget. The obsolete vendoring step is now optional, while the customer-portal auth race guard and recovery/invite-token guard remain mandatory.

Closure requires protected merge, exact-main production build, and live browser proof.
