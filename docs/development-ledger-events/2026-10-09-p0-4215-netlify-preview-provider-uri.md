# P0 #4215 engineering event — Netlify dashboard status is not an immutable deploy URL

- Date: 2026-10-09
- Failure: exact-main Portal V2 production DOM #37908103412 failed to resolve an approved visual baseline because the exact-head PR preview #37908040948 had no successful baseline artifact.
- Cause: `portal-v2-live-preview.yml` appended `/release.json` to GitHub provider `target_url` at app.netlify.com, not to the immutable deploy host. Netlify may cancel builds for no content change while a commit status remains green.
- Repair: use strictly validated provider deploy ID and exact immutable release.json, check matching head SHA + deploy ID, upload only proven approved artifact.
- Guard: `tests/brain-p0-4215-netlify-preview-immutable-target-v1.test.mjs` in Required plus learning replay/shadow/canary; no new scheduler or Netlify deployment authority.
- Remaining: proof through fresh exact-head PR screenshot+browser success and postmerge production DOM, plus all independent customer readback and legal gates.
