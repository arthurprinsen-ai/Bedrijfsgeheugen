# Provider source migration handoff incident — 830

- Original producer: native Supabase migration integration for protected #5652; original source consumer: protected Supabase migration history source writer / ONE BRAIN
- Applied provider time: 2026-11-12T15:15:03.959Z; project adhjwmvyoixzjtmiroln; original migration 20261112162500 / original_metric_source_temporal_handoff_v1; provider applied 830, original source lock 829
- Root cause: non-atomic producer-applied→source-lock consumer processed acknowledgement, recurrent after 827/828/829
- Recovery: exact append-only same-authority lock update; no SQL replay, customer data write, token bypass, duplicate sender/scheduler
- Regression: tests/brain-cro-production-migration-lock-20261029.test.mjs, tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs; protected CI+CodeQL/preview, exact source/provider 830/830; original owner retains next source epoch correlation
- Parent P0: #4198; downstream Portal/SEO users must not be marked FULL_GREEN from migration parity alone
