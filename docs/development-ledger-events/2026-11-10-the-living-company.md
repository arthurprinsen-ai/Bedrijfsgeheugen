# 2026-11-10 — The Living Company: original Portal V2 decision experience

- Obligation-ID: portal-living-company-decision-world-20261110-v1
- Original owner: Portal V2 Living Interface issue #4547
- Original failure fingerprint: portal|living-company|dashboard-first-instead-of-evidence-first-journey|20261110-v1
- User intent: award-caliber, unique living company interface with evidence-first interactions, measurable business progress and a memorable but professional experience.
- Observed original issue: excessive navigation and technical dashboards obscure a clear meaningful next entrepreneur decision. Evidence exists in the canonical five-stage journey but is not interactively understandable on the first screen.
- Correction in candidate: reuse the exact existing authenticated journey as an accessible five-node company map inside the existing single-action entrepreneur hero. Never create an alternative dashboard, tenant read model, action engine, database or calendar.
- Code: portal-v2/decision-world.js, portal-v2/decision-world.css, original entrepreneur-home.js, index.html. Regression: portal-v2/tests/decision-world.test.mjs. The original living-interface skill is amended, and human change record docs/changes/2026-11-10-the-living-company.md explains the design contract.
- Initial protected Required attempt: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42775921580 failed at hygiene/admission, before product tests. Root cause: first PR #5553 body omitted the four literal machine-required fields Obligation-ID / Delivery-Lane / Candidate-Type / Base-SHA, even though it mentioned admission in prose. Recovery: correct same PR body using immutable main base SHA, then require fresh CI evidence. Do not erase historical FAILED.
- Preventive release practice: before opening new candidate PR, verify exact four metadata lines and valid type implementation and lane portal. Preserve one writer and same lineage. No shortcut to terminal.
- Prevention of UX error: distinguish scan self-report, saved preference, verified source, supported proposal, independently proven result. Never infer revenue from any intermediate state. Unknown stays unknown.
- Required verification: exact-head GitHub admission, Required, CodeQL, BRAIN, real browser/mobile and assistive technology, protected merge, current Netlify published SHA, two authenticated tenants, usability measurements and separate Red Dot jury decision.
- State at authorship: SOURCE_CANDIDATE; production and customer outcome evidence NOT VERIFIED; award NOT VERIFIED. Implementation and test files do not themselves prove live success or an award.
