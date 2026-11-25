# SEO Twinfield intent ownership — 2026-10-19

Obligation: seo-twinfield-intent-owner-20261019

Change: extend existing canonical intent-owner projection for `twinfield koppelingen` and `koppeling twinfield`, routing both to https://www.bedrijfsgeheugen.nl/twinfield-koppeling.

Evidence: GitHub PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4443; commit 06c66ebec27fbf0176f548818c82c4a6970b18ff. No production release or sales outcome verified.

Validation: Required CI, CodeQL, protected merge, Supabase deployment and production readback required. Reversible via GitHub revert.

2026-10-25 same PR #4443 recovery: canonical map and runtime projection plus executable regression; Search Console 16 combined impressions / 0 clicks (2026-10-01..22), keyword intelligence 40 monthly / €16.49 CPC per variant. All protected checks, deploy and production proof PENDING. No revenue outcome claimed.

2026-10-25 deployment recovery: PR #4443 protected merged at 37bbb38098a76375e43512c0aa79662e3d232830, but Supabase Edge Authority run 40176867934 failed missing config registration; provider Edge v9 still lacks aliases. Same obligation, new protected follow-up adds existing function config + authorization-preserving regression; no live claim until provider readback.
