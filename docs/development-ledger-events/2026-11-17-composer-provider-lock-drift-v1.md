# Immutable repair event — 2026-11-17 composer migration lock drift

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original publisher: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5960
- Failed original Required gate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44093772404
- Scope: exact provider-version/name lock readback in repository; never apply/mark a migration as fake.
- Before: provider applied 879; existing lock applied 878, version 20261117123000 missing.
- After candidate: intended lock 879, preserving 878, matching canonical applied 879.
- Production proof still required: protected merge + original PR #5960 exact CI + Netlify current deploy + public article + Supabase LIVE_PROVEN and ONE BRAIN consumer ACK. No false-green.
