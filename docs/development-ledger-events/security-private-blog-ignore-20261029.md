# Public blog evidence source safeguard — 2026-10-29

- P0 canonical incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE`.
- Root cause: dated internal blog learning and ledger files historically entered public GitHub source.
- Prior mitigation: exporter v184 (live auth+approval matrix 4/4), canonical writer public allowlist, main-tip cleanup #5082.
- Separate protected prerequisite: #5085 classified the exact root `.gitignore` as backend; unknown dotfiles stay rejected.
- This candidate: PR #5083, `.gitignore` and existing source security contract, with no new schedule or provider.
- Negative test: exact ignore entries must exist, all dated private blog Brain/ledger files absent from the public source tree.
- Admit with canonical human-documentation, activity-ledger and Brain evidence. Release only after exact-head Required/CodeQL and protected merge.
- Historical PR caches, clones and final regulatory determination remain OPEN. No data purge claimed.
