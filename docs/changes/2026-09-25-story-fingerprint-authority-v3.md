# Canonical story fingerprint authority v3

Date: 25 September 2026
Fingerprint: `powerhouse-story-fingerprint-authority-v3`

Production verification of v2 exposed a dual-normalization bug. Historical backfill normalized source/content IDs in SQL, while the live publisher hashed a simpler TypeScript normalization. The content ID `manual-linkedin-personal-2026-09-24-car` therefore produced two different hashes.

v3 establishes one authority: `powerhouse_story_fingerprint_v1` in Postgres. Historical backfill and live publisher both call/use this same function. If the RPC fails or returns empty, publication fails closed before any provider side effect.
