# Control Plane Diet — execution ledger

Obligation: `control-plane-diet-20261006-v1`.

PR fan-out was reduced from 38 direct authorities to 7 top-level pull_request authorities: 2 admission authorities and 5 closed-PR lifecycle/recovery authorities. The only admission authorities are Required test and Powerhouse CodeQL. Read-only specialist assurance runs on merge_group; Portal preview and repository-writer verification consume successful Required runs through workflow_run.

Latest-main Netlify artifact reuse and terminal-writer protections remain authoritative after reconciliation. Security, provider and writer boundaries remain fail-closed. Protected auto-merge remains the only promotion path.


## Post-merge terminal readback recovery

PR #3984 merged with Required and Powerhouse CodeQL green, but the obligation terminalizer failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` because `config/netlify-project-registry.json` and `tools/netlify/ephemeral-janitor.mjs` were not registered as control-plane-only production-readback paths.

Successor PR #4020 keeps the same obligation and adds those exact paths to the canonical verifier-only authority. Real Netlify runtime prefixes and exact runtime paths remain fail-closed and continue to require deployment/readback.
