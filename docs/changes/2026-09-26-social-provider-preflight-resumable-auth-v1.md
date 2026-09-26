# Social publishing provider-preflight recovery — 2026-09-26

## Incident
LinkedIn and Instagram delivery could fail despite integrations appearing connected. Buffer is currently hard rate-limited, all stored LinkedIn OAuth tokens fail a real provider read with `REVOKED_ACCESS_TOKEN`, and Instagram was blocked on exact final Mira Reel proof.

## Permanent contract
A connector status of `ACTIVE` is not provider health. LinkedIn must pass a real `LINKEDIN_GET_MY_INFO` preflight before the daily publication claim, capability consumption, uniqueness reservation or any provider side effect. Authentication failures remain resumable on the same canonical daily claim. Existing provider URNs are never republished.

Buffer is not a critical-path dependency. Instagram remains Mira-only/Reel-only and requires exact final-media proof plus continuous-video temporal proof. Repository source must match the deployed temporal-proof contract.

## Operational watchdog
The existing Social Publish Recovery task now checks the four canonical daily outputs hourly from 07:05 through 20:05 Europe/Amsterdam. It only reports GREEN after exact provider/public readback and resumes the same lineage on recoverable failures.
