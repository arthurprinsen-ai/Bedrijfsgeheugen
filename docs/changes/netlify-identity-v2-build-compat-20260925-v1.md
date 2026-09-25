# Netlify Identity v2 production-build compatibility — 2026-09-25

## Root cause
The production build called `tools/bouw-powerhouse-auth.mjs`, which treated the undocumented internal file `node_modules/@netlify/identity/dist/main.js` as a required public contract. With `@netlify/identity@2.0.0`, that legacy browser-bundle path is not a supported production interface. The build therefore failed before the NL/EN static-route generation and browser verification could run.

The customer portal itself uses the Netlify Identity Widget from the official CDN. The legacy local vendoring output is compatibility-only and must not block the whole website build.

## Repair
- Customer-portal auth race protection remains mandatory.
- Recovery/invite-token protection remains mandatory.
- Legacy `@netlify/identity` + `gotrue-js` browser vendoring now runs only when both legacy internal files are actually present.
- Absence of those undocumented internals no longer aborts the production build.

## Prevention
Production build tooling must not depend on undocumented paths inside `node_modules`. Package public exports or explicitly owned assets are authoritative. Compatibility artifacts may be optional; security guards are not.

## Evidence
- Regression: `tests/brain-netlify-identity-v2-build-compat-v1.test.mjs`.
- Canonical full-build PR gate proved `npm install`, `1 Powerhouse auth`, V18 production generation, shell gates and release evidence all successful on the repaired candidate.
- Brain fingerprint: `netlify-identity-v2-build-compat-20260925-v1`.
- Terminal closure still requires protected merge, exact-main Netlify production identity and live NL/EN browser proof on homepage, pricing and systems/koppelingen.
