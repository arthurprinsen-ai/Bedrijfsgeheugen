# Personal LinkedIn personal-life-only — 20 september 2026

## Change

Arthur's personal LinkedIn lane is now explicitly **personal life only**. Business content is routed away from the personal profile even when wrapped in a first-person anecdote.

## Root cause

The prior semantic gate already required a concrete lived event and blocked many business signals, but its contract still allowed an exact single-use business exception and did not carry one explicit personal-life-only fingerprint through contract, generator, final-copy validation and pre-publish runtime.

## Prevention

The canonical fingerprint is `personal-linkedin-personal-life-only-v1`.

The personal lane now:
- requires explicit personal-life-only verification;
- has no business-content exception;
- blocks business, consultancy, client, MKB, sales, organizational AI/digitalization and thought-leadership signals;
- keeps the AI generator within personal-life source worlds;
- fails closed before publication if the final text is not personal-life-only.

## Allowed topics

Family, parenting, children/school, hockey/sport, travel/holiday, car/transport, home/garden, consumer technology, daily services, family/generations, leisure, daily routines, frustrations and ordinary human observations.

## Regression evidence

`tests/brain-linkedin-personal-semantic-gate-v5.test.mjs` and `tests/social-learning-buffer-channel-identity-gate.test.mjs` cover harmless personal copy, business-wrapped personal copy, removed business exceptions and missing life-only verification.
