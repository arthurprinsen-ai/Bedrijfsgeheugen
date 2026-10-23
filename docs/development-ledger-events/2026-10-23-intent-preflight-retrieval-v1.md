# Development ledger-event — Brain task-intent skillretrieval — 2026-10-23

**Fingerprint:** `powerhouse|all-intelligence-applicability-reuse-loop|20261023`. **Canonical owner:** Powerhouse 50 #2750; prior candidate PR #4766.

- Root cause: task `intent` was not forwarded from Brain preflight to the existing skill selector; only explicit fingerprints/lanes could retrieve nonmandatory learnings.
- Candidate delta: propagate task intent, infer relevant existing canonical skill targets including Dutch wording, cap implicit recall to 12 while preserving mandatory/explicit entries, expose deferred and unresolved fingerprints.
- Tests: `tests/brain-chat-learning-fast-development-v2.test.mjs` (existing registered test lane).
- Verification: CI Required/CodeQL and exact-SHA release/readback **pending**, not falsely labeled live. This ledger captures an implementation candidate, not proven customer outcomes.
- Prevention: each material agent task must show relevant retrieval and separately prove applied learning/readback/outcome; no second scheduler or learning truth-store.
- Follow-up: [canonical audit #2750](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/2750#issuecomment-6362817130) and [P0 real customer value #4358](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4358).

- Same-lineage successor vanaf actuele `main` wegens strict-main branch drift en reproduceerbare `ci`-substring in `social`; behoud zes canonieke artefacten, voeg negatieve en positieve CI/CD-regressies toe. Oude kandidaat #4768 wordt retired na opvolgerregistratie; geen bypass van Required/CodeQL.
