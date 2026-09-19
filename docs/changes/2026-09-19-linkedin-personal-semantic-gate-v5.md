# LinkedIn personal semantic gate v5 — 2026-09-19

## Change
Arthur's personal LinkedIn lane now validates the **final text itself**. A post must contain a concrete first-person lived event or daily-life experience. Merely containing words such as `ik`, `mijn`, `vandaag` or `weekend` is no longer sufficient.

## Root cause
The previous identity gate combined shallow lexical checks with caller-supplied booleans such as `personal_life_topic` and `concrete_personal_anchor`. Business or thought-leadership copy could therefore be wrapped in a thin first-person introduction and still reach the personal lane.

## Prevention
The platform gate and production pre-publish review both fail closed when final copy lacks a concrete personal event. Consultant/thought-leadership language and forced business morals are blocked independently. Metadata remains supporting evidence, not semantic proof.

## Regression evidence
`tests/social-learning-buffer-channel-identity-gate.test.mjs` includes explicit escape cases for a first-person process-improvement wrapper and a weekend/leadership wrapper, while preserving a harmless personal printer story as an allowed case.

## Delivery status
Supabase `bg-pre-publish-review` version 13 has runtime evidence recorded on PR #2424. Protected merge and exact-main readback remain the terminal repository proof.
