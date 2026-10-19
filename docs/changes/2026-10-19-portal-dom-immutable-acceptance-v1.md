# Portal V2 Production DOM acceptance after an independent Supabase bridge release

## Status at 19 October 2026
Customer portal and public site runtime are published at `1ede6008da2f265941097487b21cbb1f8c334326` on immutable Netlify production deployment `6ad5eece12a6f9cf157bdcf7`. GitHub `main` advanced by one commit to `bcb936d9fb0c42602e2a00d158668e362446bae9` containing **only** Supabase deployment bridge source and governance tests/docs; live Supabase bridge v180 was independently read back and matched the complete GitHub file exactly.

The existing production workflow has a strict and appropriate runtime-change rejection, but it cannot account for an isolated, independently deployed Edge function that does not change the Netlify customer portal. An earlier SHA override fails despite correct site code. This blocks real Chromium acceptance of earlier protected features.

## Minimal repair
Extend the single-file allowlist in `.github/workflows/portal-v2-production-dom-readback.yml` to include the known, independent `netlify-deploy-bridge/index.ts`. No wildcard other than existing documentation/test paths. Do not weaken:
- verified approved protected PR ancestry;
- exact `main` input and published release SHA;
- immutable Netlify deployment identity;
- Playwright Chromium DOM, routing and CSS checks;
- tenant identity and previously verified source gates.

## Validation and remaining obligations
Canonical `tests/brain-portal-dom-proven-bridge-only-v1.test.mjs` guards scope and security markers. Required CI/CodeQL, protected merge and real portal production browser-readback are all compulsory. The older failed GitHub Supabase Edge provider authority test uses an invalid GitHub `SUPABASE_ACCESS_TOKEN`; direct Supabase provider parity was verified separately and must not be described as a green GitHub job. Growth backlog, tenant financial forecast measurements and CMS editorial publication are independent product obligations.
