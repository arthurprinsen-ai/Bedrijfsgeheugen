# 2026-10-21 — inherited BRAIN tenant identity SQL contract

- Obligation: `ci-3742-tenant-identity-archive-contract-v1`; parent #3742, related #4215; blocked #4573.
- Source main epoch: `d18ef16edac0e62058a51afee21cfe0b52a91e20`. Failed backend run: `39554866582`.
- Five inherited test cases point to an obsolete executable SQL path; exact original SQL is preserved in read-only migration history (blob `50d899bfa0569cf17661804b8a142cb4aa42d808`).
- Verified prewrite: 17/17 positive and 2/2 negative existing source assertions match archived SQL.
- Code: one existing test source-path update; a new `brain-*` historical/shadow/canary regression; machine-readable Brain learning; existing Green Assurance skill; human change note.
- No executable SQL restore, database mutation, ACL/RLS relaxation, workflow bypass, test removal, deploy or provider side effect.
- Status: `CANDIDATE_UNVERIFIED_CI`; exact-head Required, CodeQL, full BRAIN backend, canonical merge and authenticated production tenant A/B remain unproven.
