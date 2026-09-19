# 2026-09-19 — LinkedIn personal semantic gate v5

- **Type:** incident prevention / social identity integrity
- **Fingerprint:** `linkedin-personal-semantic-gate-v5`
- **Symptom:** personal LinkedIn could accept business/thought-leadership copy when wrapped with shallow personal tokens.
- **Impact:** Arthur's personal profile risked publishing content that belonged on the Bedrijfsgeheugen company channel.
- **Root cause:** semantic identity was partly delegated to caller-supplied flags and broad lexical matches.
- **Fix:** require a concrete lived personal event in final copy; block consultant voice and forced business morals.
- **Regression:** `tests/social-learning-buffer-channel-identity-gate.test.mjs`
- **Runtime evidence:** PR #2424 records Supabase `bg-pre-publish-review` version 13 and production readback of both new blocker codes.
- **Provider caveat:** Buffer audit remains rate-limited and is not used as release proof.
- **Status:** protected merge/readback pending at time of this ledger event.
