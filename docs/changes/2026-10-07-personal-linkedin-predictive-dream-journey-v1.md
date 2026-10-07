# Personal LinkedIn predictive founder journey v1

This change brings the already-live personal LinkedIn founder-journey behavior back under GitHub source control and regression protection.

## What is structurally preserved

- one personal LinkedIn chapter per calendar day;
- Tuesday and Friday use English, the other days use Dutch;
- English chapters are original continuations, not translations of Dutch posts;
- the story stays first-person and follows the founder journey rather than becoming generic AI content or a product pitch;
- external signals can be translated into predicted company impact, priority, action and later measured outcome;
- forecasts remain explicitly probabilistic and may never be presented as established facts;
- software, company data, BI/analytics and AI are described as one combined smart-software model in ordinary business language;
- recent chapters are used to prevent repetitive daily storytelling.

## Repository closure

The runtime source is persisted in `supabase/functions/powerhouse-content-orchestrator/index.ts`. The database-side rules and materializer are persisted in `supabase/migrations/20261007182000_personal_linkedin_predictive_dream_journey_v1.sql`.

The canonical regression is `tests/brain-personal-linkedin-predictive-dream-journey-v1.test.mjs`. It deliberately lives under the existing `tests/brain-*` backend namespace so the delivery classifier does not require a special exception.

No second scheduler, second content store or parallel publication runtime is introduced.

## Terminal acceptance

The repository side is only complete after exact-head Required, Powerhouse CodeQL and Netlify preview are green, protected auto-merge completes, and main readback still contains the exact three material source artifacts plus this closure evidence.
