# 2026-09-24 — Powerhouse 50 Problem Library v1

- Fingerprint: `powerhouse-50-problem-library-v1`
- Obligation: `powerhouse-50-problem-library-v1`
- Scope: Powerhouse product intelligence / backend foundation
- Intent: één canonieke probleemtaal voor detectie, bewijs, impact, actie, capability, outcome en learning.
- Change: toegevoegd `config/powerhouse-problem-library.json`, schema en backend regression guard.
- Root cause addressed: productmodules en commerciële routes konden zonder canonieke Problem ID uit elkaar groeien.
- Delivery recovery: stale baseline-drift en een unclassified test path werden geïsoleerd; duplicate delivery candidates zijn gesloten zodat één actieve obligation overblijft.
- Verification evidence: isolated Netlify preview `6ab530378136cf00070428c2` was READY; governance admission op de current-main candidate is groen. De current-main Netlify buildfout is inherited en was ook aanwezig op de direct voorafgaande gemergede website-PR.
- Prevention: nieuwe problem intelligence moet het canonieke schema gebruiken; nooit een tweede probleemtruth in portal, content, sales of capabilities bouwen.
- Completion rule: merge pas na beschermde required test; productieclaim alleen met geldige production-readback volgens bestaande delivery authority.
