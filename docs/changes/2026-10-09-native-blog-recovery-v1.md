# Native daily blog recovery — source-controlled evidence path

**Problem.** On 9 October 2026 the generated Powerhouse blog and other prepared commercial content did not close their externally verified delivery obligations.

**Existing-state-first execution.** Triggered the existing Native daily blog publisher using `business_date=2026-10-09` rather than writing directly to production. The workflow selected an older eligible approved article under its documented cold-start policy because the learning API returned 502; a candidate branch and PR #4252 were created with a single date-keyed ledger entry, exact URL and content marker. The writer shadow validated path policy and pinned commit.

**CI traceability.** The initial PR lacked the required machine-readable delivery metadata. That metadata has been added; this change introduces the canonical learning evaluation, human description and development ledger evidence so the integration bundle can prove what did and did not happen.

**Regression contract.** `tests/brain-daily-blog-20261009-canonical-candidate.test.mjs` confirms the dated content ID, article presence and URL; it explicitly refuses a fabricated `live_proof` record.

**No premature green.** A generated file, accepted candidate, successful workflow or green shadow is not a public post. Protected merge, Netlify runtime release and exact public readback must all succeed before reconciliation may mark the business date complete. Existing duplicate, media and email gates continue independently.
