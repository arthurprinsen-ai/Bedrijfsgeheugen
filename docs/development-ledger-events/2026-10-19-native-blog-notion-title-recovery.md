# Development ledger — Native approved blog Notion title recovery

- Date: 2026-10-19
- Obligation-ID: native-approved-blog-notion-title-shape-recovery-20261019
- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39301488760
- Observation: OpenAI authenticated and emitted a validated 955-word candidate; Notion page creation returned 400.
- Verified root cause: Notion data source `Titel` is type `title`; workflow used type `rich_text`.
- Applied repair: correct the `Titel` payload with no changes to article, approval, Notion schema, or protected publishing.
- Regression: `tests/brain-native-blog-notion-title-contract-20261019.test.mjs`.
- Closed-loop proof required: Required CI + CodeQL, protected merge, real native supply create/readback, then updated learning evidence.
- Status at creation: FIX_CANDIDATE — not yet accepted as production.
