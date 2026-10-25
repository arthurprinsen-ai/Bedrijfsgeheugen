# Native approved blog — Notion title schema recovery

Date: 2026-10-19
Obligation-ID: native-approved-blog-notion-title-shape-recovery-20261019

## Live failure
The production GitHub workflow [39301488760](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39301488760) successfully obtained and validated a real 955-word article from OpenAI. The subsequent Notion page creation failed with HTTP 400, so the generated article did not reach central approved stock.

The connected Notion source `70706495-cc0c-44ed-84bc-493df00651f1` confirms that `Titel` is a `title` property. The workflow sent `rich_text` for this field. Other referenced fields retain their existing types and approval state.

## Correction and prevention
Update only the `Titel` request object to `{'title': rich(title)}`. The dedicated regression test verifies that contract, one-date stock protection and quality/approval gates. The canonical Brain learning record documents cause and evaluation.

## Evidence and acceptance
- Root-cause workflow: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39301488760
- Test: `tests/brain-native-blog-notion-title-contract-20261019.test.mjs`
- Keep Required CI, CodeQL and protected merge.
- Re-run native supply for a fresh business date. Require evidence of successful Notion creation and exact Notion readback; until then, never claim native supply complete.
- The separate public daily article for 19 October already passed production readback.
