# 2026-11-05 — ONE BRAIN original Mira virgin producer handoff

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439
- Original owner: `powerhouse-content-loop` + `powerhouse-instagram-media-router` + original Mira media producer.
- Production source: canonical Supabase `powerhouse_instagram_media_jobs_v1` 2026-11-05 Instagram; WAITING_ASSET, attempts=0, no OpenArt history, exact frozen winner `5f95bf92-73f8-419a-bac4-0e388b256b76`, original obligation BLOCKED/MEDIA_ASSET_REQUIRED.
- Root cause: daily recovery ignored exact original job state already read by preventive gate and emitted generic final-media verification request rather than upstream producer-claim task.
- Change: original content-loop passes already queried media state/attempts to existing pure recovery; only exact source-linked virgin job gets `MIRA_PRODUCER_CLAIM_REQUIRED`. Never claim, charge, generate, approve or post inside classifier; existing provider producer remains exclusive and must prove real claim before spending.
- Prevention: preserve rejected/claimed/history and mismatched winner fail closed; do not lower Mira 0.940. No second scheduler, sender, database or bypass.
- Regression: `tests/brain-daily-publication-no-silent-gap-20261031.test.mjs` for first-claim, historical/unsafe states, provider-side terminal protection and actual original-loop data wiring.
- Human docs: `docs/changes/2026-11-05-mira-original-producer-handoff.md`; original skill: `.agents/skills/instagram-composio-publisher/SKILL.md`.
- ONE BRAIN: `brain/learning/2026-11-05-mira-producer-claim-original-recovery.json`.
- Candidate terminal requirement: protected Required, CodeQL, BRAIN; original safeguarded merge, exact authorized Edge bundle readback, same original scheduler execution and actually updated next_action. Claim/asset/Meta proof is distinct and remains EVIDENCE_DUE.
- Status: SOURCE CANDIDATE; no claim that live Instagram video was created.
