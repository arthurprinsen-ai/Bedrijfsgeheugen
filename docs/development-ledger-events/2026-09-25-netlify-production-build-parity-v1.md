# 2026-09-25 — Netlify production build parity v1

Observed:
- GitHub website validation green;
- linked Netlify production build for current main failed with exit code 2;
- GitHub website composer omitted production build stages.

Permanent repair:
- add exact Netlify production build parity job to website lane;
- include pricing capture/restore, apply-i18n, localized routes, sitemap and release evidence;
- keep production readback and browser proof as terminal gates.

29 September 2026 recurrence:
- production main descendant `cddfe2b6...` reached Netlify build execution but failed with exit code 2;
- the pre-merge parity environment was found to differ from `netlify.toml`;
- `STATIC_I18N_REQUIRE_CACHE` is now `1` in the parity job as it is in production;
- regression coverage now fails if the parity workflow becomes permissive again.
- corrected parity reproduced the provider failure before merge: 54 missing static English translations;
- versioned cache patch added for all 54 money-page conversion strings;
- future NL production copy must carry the corresponding EN cache delta in the same candidate.
