# Activity ledger — 2026-10-29 Mira frozen-library producer preflight

- **Obligation:** `mira|reel|canonical-winner-producer-admission-format-mismatch|20261029-v1`
- **Original observed failure:** Supabase pg_net #16098, HTTP 422 `MIRA_FROZEN_REEL_PRODUCER_AUTHORITY_REQUIRED`; original winner PH-P006, original failed OpenArt video `i6e9teMFpPH7YwZG4PMS`, face 0.900 < 0.940.
- **Additional truth:** newer OpenArt `dZlZknlaWFJ3JEXZhggv` is a completed but inadmissible candidate with audio and incorrect production mode/frozen scene. It has NOT been submitted or published.
- **Root cause:** generator admission was limited to `approved_source_led`, omitting frozen approved canonical PH-P mappings while the rest of the router supports PH-P final-media proof.
- **Fix:** guard original frozen-library preflight by exact immutable source/scene, original prior rejection, remaining budget, original project and unsent daily claim. Original master ID pinned from code. Provider format check and final identity/temporal/Meta gates remain independent.
- **Regression:** `tests/brain-mira-frozen-library-producer-preflight-20261029.test.mjs`, 4 tests covering valid and adversarial scenarios plus intact final publisher guard presence.
- **Safety:** existing original media owner only; no new cron, publisher, model approval, direct SQL status edits, invented economics or provider side-effect.
