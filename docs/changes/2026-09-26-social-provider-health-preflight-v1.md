# Social provider health preflight — 2026-09-26

LinkedIn and Instagram publishing were able to stall even though Composio still reported connected accounts as ACTIVE. Live checks showed all existing LinkedIn connections returning HTTP 401 / REVOKED_ACCESS_TOKEN. Instagram had multiple ACTIVE connections that did not prove the canonical bedrijfsgeheugen.nl provider identity.

The repair changes readiness from metadata-based to provider-proof-based. LinkedIn setup now healthchecks every ACTIVE candidate with LINKEDIN_GET_MY_INFO, ignores revoked candidates, and selects the single health-verified canonical alias when available. Instagram setup now reads the live provider identity for every candidate and accepts only bedrijfsgeheugen.nl, preferring the canonical Mira alias.

The social publisher now performs this health preflight before the atomic publication claim and before issuing/consuming the external publication capability. Authentication failures remain recoverable at content_ready, preserve the exact unique artifact/Mira Reel, and must be resumed after OAuth recovery rather than creating a duplicate.

Definition of done remains protected tests, merge to main, production deployment, setup-state readback, canonical run, and provider publication/readback.
