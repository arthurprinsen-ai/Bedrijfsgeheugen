# 2026-09-25 — Personal LinkedIn created-URN preservation

- Fingerprint: `linkedin-personal-created-urn-preservation-v1`
- Observed failure: personal LinkedIn reached exact readback after a create attempt; LinkedIn returned `Forbidden`, while the old error path persisted no `delivery_ref` or obligation `external_id`.
- Risk: a provider-side post may exist while canonical state has no exact post identifier, so an automatic retry could duplicate the daily publication.
- Root cause: personal create + readback were implemented as one throwing operation; the post URN was only returned after successful readback.
- Fix: preserve the create URN immediately in the function result, return verification-pending evidence on readback failure, and persist the exact URN as a DISPATCHED claim with `republish_forbidden=true`.
- Transport: LinkedIn remains Composio-only; Buffer is not a fallback.
- Existing 2026-09-25 personal claim: intentionally not retried because provider side-effect status is ambiguous and the old code lost the URN.
- Verification required before terminal status: protected CI → merge → production deploy/readback. No LIVE/DONE claim without provider evidence.
