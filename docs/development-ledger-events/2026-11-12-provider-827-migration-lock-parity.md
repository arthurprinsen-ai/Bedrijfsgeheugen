# Event: provider-backed migration lock drift

- UTC provider readback: 2026-11-12T13:18:08.784Z
- Issue: #4198; original protected app gate: #5644, workflow #43225233943
- Root cause: PR #5646 source migration was applied and merged but original immutable provider-backed lock was not incremented from 826 to 827
- Exact provider identity: `20261112131500` / `original_no_publish_provider_side_effect_fence_v1` (once)
- Repair: one append-only entry in `supabase/migration-history.lock.json`, preserving previous 826; no database write or history manipulation
- Test: original production migration parity, lock integrity and history replay; follow protected GitHub Required+CodeQL and exact readback
- Next owner: original Supabase migration writer; no second executor, no false live/outcome claims
