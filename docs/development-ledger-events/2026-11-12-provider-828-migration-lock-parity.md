# Evidence event: #5648 production migration applied but original source lock stale

- Provider time: 2026-11-12T13:41:02.290Z; project adhjwmvyoixzjtmiroln; provider rows 828; exact version/name 20261112140500/original_blog_provider_identity_handoff_v1 recorded once
- Source main: fc4cf2b22875ddc27c1a11f3021c966ed5a0c539; existing SQL file supabase/migrations/20261112140500_original_blog_provider_identity_handoff_v1.sql; original lock 827
- Root cause: original producer-to-source-lock update not carried through before downstream protected release #5644; recurrent pattern from #5646→#5647
- Fix: append-only canonical source migration-history.lock.json + machine Brain lesson; no production SQL call or altered history
- Prevent: original provider-applied identity → source lock consumer PROCESSED receipt → protected release gate + independent provider readback; original owner remains #4198
- Tests: existing canonical provider/source migration parity historical, shadow, canary; protected Required+CodeQL; no check bypass
