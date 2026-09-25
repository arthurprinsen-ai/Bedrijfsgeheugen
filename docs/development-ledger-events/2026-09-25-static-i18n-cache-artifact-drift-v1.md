# Development ledger — static i18n cache artifact drift v1

- Date: 2026-09-25
- Candidate: PR #3082
- Symptom: canonical builder and cache validator existed, but `.cache/bg-static-i18n-en.json` was absent from current main.
- Recovery source: proven cache blob from merged PR #2944.
- First recovery attempt: pretty-printed cache caused delivery admission to overflow on the >1 MiB diff.
- Corrected recovery: compact JSON serialization, preserving all 7,707 entries.
- Material closure: Brain learning + human documentation + this activity ledger are included in the same lineage.
- Terminal condition: Required/BRAIN/CodeQL/Skill Projection green -> protected merge -> Production Source Snapshot -> exact Netlify production identity -> NL/EN browser readback.
