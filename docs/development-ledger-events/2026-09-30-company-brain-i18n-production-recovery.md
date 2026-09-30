# 2026-09-30 — Company Brain i18n production recovery

Obligation: `company-brain-i18n-production-recovery-2026-09-30`.

Observed failure:
- AI Modelwijzer Falcon main merge: `9031a7e54e16aaf452a9b4b09e4693c752a9121e`
- failed production source snapshot: GitHub Actions run `36690947075`
- failed premerge production build parity that exposed the exact missing cache strings: GitHub Actions run `36690887423`

Root cause: 11 exact Company Brain strings were absent from the fail-closed static English cache.

Action: added all 11 exact translations to `config/bg-static-i18n-en.d/20260930-company-brain-category-v1.json` without weakening the production i18n contract.

Expected outcome: current main can build and deploy to Netlify production, after which the AI Modelwijzer Falcon expansion is visible on https://www.bedrijfsgeheugen.nl/ai-modelwijzer.
