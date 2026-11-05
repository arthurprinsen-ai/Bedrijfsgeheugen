# Development ledger — browser installer HTTP 504 / preview identity HTTP 401

- Date: 2026-11-05. Existing original owners: Website Cross-Browser Screenshot Assurance and Portal V2 Live Preview.
- Parent incident: #4447; Portal #4547. Protected candidate PR #5457.
- Fingerprints: `ci|cross-browser|ffmpeg-static-postinstall-http-504|20261105-v1` and `ci|netlify-preview|nonproduction-auth-401-retry-misclassified-timeout|20261105-v1`.
- Reproduction: browser run #42047646698, job #127314880548: npm root ffmpeg-static lifecycle GitHub HTTP 504, no browsers, no screenshot artifact. Preview run #42048047434, job #127316300431: Netlify preview 401 repeated ~9 minutes, then generic exact-SHA timeout.
- Root cause: unrelated npm lifecycle download was coupled to screenshot prereq; immutable preview curl discarded permanent authorization HTTP status. Nonproduction Netlify team SSO remains enabled and must not be bypassed.
- Original-source remediation: only in the existing cross-browser job use `npm install --no-save --ignore-scripts playwright@1.55.0`, then install actual Chromium/Firefox/WebKit and OS deps; preserve prerequisite failure artifact. Existing Portal preview must classify alias/immutable 401/403 immediately, never turn status into a false source-SHA timeout or share response data.
- Skill/agent: update `brain/skills/powerhouse-netlify-session-health-v1.json` and `.agents/skills/portal-living-interface/SKILL.md`; two typed incidents in `brain/learning/` with owner and cause. No parallel workflow, publisher or bypass.
- Regression: `tests/brain-ci-browser-install-and-netlify-preview-auth-20261105.test.mjs`, existing website screenshot and Netlify source identity adversarial tests.
- Admission: Required run #42052090462 rejected the **first 8-file candidate** because `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger`. Add **this** original append-only ledger to same protected PR, keep admission hard gate. Do not mark that rejected run PASS.
- Status: CODE_CANDIDATE_UNVERIFIED until new exact-head Required, CodeQL, protected merge and independent original scheduled cross-browser + authorized immutable preview effects. Production website unchanged by the candidate.
