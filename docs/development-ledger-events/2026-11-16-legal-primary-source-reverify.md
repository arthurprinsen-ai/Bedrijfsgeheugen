# Activity event — 2026-11-16 legal official-source correction
Owner: original legal source/Portal V2 writer. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5920.
Fingerprint: `powerhouse|legal-source|expired-primary-review-false-outdated-20261116-v1`.

- Trigger: original Required test run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43842981950 correctly blocked source review expiry on 3 legal records.
- Root cause: legal register is manually source-curated; it lacked same-source re-review before 15-Nov; hourly-rate entry additionally asserted anticipated 1-Jan-2027 despite published 31-Dec-2026 royal commencement order.
- Source proof: official Staatsblad 2026 207, official Zelfstandigenwet consultation and wetgevingskalender, official Tweede Kamer 9-Nov answer, official Rijksoverheid salary implementation plans; exact links included in `docs/changes/2026-11-16-legal-primary-source-reverify.md`.
- Fix: same original `portal-v2/regelgeving.js` updated statuses, content, milestone and sources and review date; `tests/brain-legal-primary-source-reverification-20261116.test.mjs` asserts date/status/proposal/no-fake-green and time-based recency.
- Prevention: never advance review dates without actual official-source review; distinguish enacted law with future effective date from draft law; original CI stops stale records automatically.
- Outcome: CODE CANDIDATE, not merged/deployed, no fabricated provider/main/readback. Follow Required+CodeQL and original release; then original Portal V2 provider revision parity, production readback and ONE BRAIN learning.
