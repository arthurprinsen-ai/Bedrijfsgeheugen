# Publication authority pgcrypto qualification — 20 september 2026

Fingerprint: `publication-authority-pgcrypto-qualification-v1`.

## Incident

After the Instagram pre-publish gate passed and the database accepted `content_ready -> dispatching`, publication capability issuance failed with:

`PUBLICATION_AUTHORITY_ISSUE:function digest(text, unknown) does not exist`.

## Root cause

The authority functions are `SECURITY DEFINER` and deliberately lock `search_path` to `public, pg_catalog`. The project's `pgcrypto` extension is installed in schema `extensions`. Calls to `digest()` and `gen_random_bytes()` were not schema-qualified.

## Fix

Use `extensions.digest(...)` and `extensions.gen_random_bytes(...)` explicitly in both capability issue and consume functions. The locked search path remains unchanged.

## Safety

No identity, Mira, winner, exact-media, dispatching, expiry, token or consume checks are weakened. Execute privileges remain service-role only.

## Terminal proof

Protected merge → migration apply → function-definition readback shows only qualified pgcrypto calls → publisher run issues and consumes a capability → provider dispatch/readback.
