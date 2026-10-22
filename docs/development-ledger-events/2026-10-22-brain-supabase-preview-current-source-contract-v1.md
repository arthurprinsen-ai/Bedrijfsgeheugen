# Append-only development event — BRAIN Supabase Preview source contract

- Timestamp: 2026-10-22
- Fingerprint: `brain|ci|supabase-preview-retired-source-contract|20261022-v1`
- Parent incident: #3742
- Baseline source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043/job/119469063095
- Baseline: 3511 tests / 3190 pass / 321 fail; seven cases in scope.
- Cause: stale tests opening retired `.github/workflows/supabase-preview-applicability.yml`.
- New checks: provider-owned exact SHA, success stability, spoof/skip/neutral/failure denial, canonical source workflow and historical mirror blob-hash gate.
- Production, migration history and provider settings: unchanged.
- Post-change full suite: not yet proven; exact result to be read from protected GitHub before closure.
- Reintroduction prevention: source tests follow current canonical authorities and retain negative security assertions, not path aliases.
