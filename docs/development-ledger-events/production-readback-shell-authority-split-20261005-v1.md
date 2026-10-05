# Development ledger — production-readback-shell-authority-split-20261005-v1

- Originating obligation: terminal closure of PR #3741.
- Pricing recovery merged as PR #3776, merge SHA f3917076d5dfd51042e929e962a0672fa72fcfc5.
- Post-merge failure: Canonical brand shell live readback run 37352198333.
- Exact error: pricing page-tools missing bgx-vraagbalk.
- Root cause: duplicate pricing authority in tools/site-shell/contracts.mjs.
- Recovery: make global shell verification route-neutral for pricing semantics; keep route-specific pricing checks in live-contract.mjs.
- Closure condition: exact-HEAD gates green -> auto-merge -> resulting main SHA -> production release/readback and shell live readback green.
