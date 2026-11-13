# Source-test drift recovery 2026-11-13
- Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Fingerprint: `portal|brain|historical-native-838-test-hard-coded-terminal-after-provider-839|20261113-v1`
- Original provider: Supabase native applied 839 distinct (then 840 after separate protected release), original main migration lock 839 when test failed.
- Original BRAIN postmerge run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43380911816, backend failure `839 !== 838`.
- Overlap: other failure in `tests/brain-groen-draaiboek-20261108.test.mjs` is owned by already open original PR #5708. No change to AGENTS here.
- Original single-owner test correction: immutable earlier migration 838 prefix and exact 839 next row; future rows allowed and uniqueness preserved. Existing BRAIN historical/shadow/canary execution and protected CI, no bypass.
- Current state: candidate EVIDENCE_DUE until independent protected merged/new BRAIN check. BusinessInput DB schema fix is independently provider-applied, but customer processed ACK and effect remain unproved.
