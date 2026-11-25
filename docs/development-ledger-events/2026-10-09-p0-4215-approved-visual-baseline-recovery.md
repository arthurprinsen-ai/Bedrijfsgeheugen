# P0 #4215 audit event — visual reference artifact fail-closed repair

- Root observation: exact production DOM run #37908103412 failed only at retrieving an exact-head PR visual artifact for PR #4236. No valid production visual comparison was performed; reporting it green would be wrong.
- Existing systems reused: GitHub merged PR metadata, required status, Netlify immutable deploy provider and release.json, Playwright DOM and strict pixel regression, existing production workflow. No additional scheduler, Brain, queue or source of customer data.
- Technical recovery: fallback only if no successful prior artifact, and only by generating an exact merged-PR-head screenshot from its immutable Netlify provider deploy after SHA/deploy-id check. Same Playwright screenshot then compared against independently verified production.
- Security: malformed/untrusted status URL, Netlify preview missing, mismatch, inaccessible screenshot or bad production DOM all fail closed.
- Required test: `node --test tests/brain-p0-4215-approved-visual-baseline-recovery-v1.test.mjs`, historical/shadow/canary.
- Closed only upon protected Required + CodeQL, exact main provider deployment and successful new actual visual readback. P0 customer acceptance remains separate.
