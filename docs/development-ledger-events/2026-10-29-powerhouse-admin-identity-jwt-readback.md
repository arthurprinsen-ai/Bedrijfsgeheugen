# Ontwikkellog — originele Powerhouse admin Identity readback hersteld
- **Tijd / fingerprint**: 29-10-2026, `portal|powerhouse-control-plane|missing-identity-jwt|20261029-v1`.
- **Originele codebron**: `portal-v2/control-plane-cockpit.js` en `netlify/functions/powerhouse-control-plane.mjs`.
- **Waarneming**: Netlify `/api/powerhouse-control-plane`: 49×401 en 2×499 (18:30–18:54 UTC). Gedeployde source leverde geen zelfstandig geauthenticeerde admin-200-readback.
- **Oorzaak**: client gaf geen Netlify Identity Authorization JWT mee; server `getUser()` kreeg het originele HTTP-request niet.
- **Herstel**: browser `ensureIdentityWidget + currentUser.jwt` → bestaand admin endpoint; backend GET/Bearer/request-bound `getUser(request)`; admin-check vóór Supabase service-role; behoud originele errors.
- **Regressie**: `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs` met niet-geauthenticeerde/no-JWT/bad-token/403 en echte Authorization-header contracten.
- **Leren / verspreiden**: `brain/learning/2026-10-29-portal-admin-jwt-readback-v1.json`, menselijke documentatie en Notion Operating Skill/Portal Dashboard Hub. Releasestatus `SOURCE_CANDIDATE` tot protected merge en live owner/browser-readback.
- **Security**: geen JWT/secrets in logs; geen extra tracker, scheduler, writer, parallel systeem of fictieve uitkomst.
