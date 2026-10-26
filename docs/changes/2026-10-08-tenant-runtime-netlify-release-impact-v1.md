# Fix: missing Netlify release for transitive tenant AI inference runtime

Issue discovered during merged PR #4207 production readback: GitHub reported `deployment_required=false` even though `platform/runtime/attested-vertex-adapter.mjs` is imported via `attested-cloud-ai.mjs` into the live tenant inference Netlify function.

A false nondeployment classification cannot prove a new adapter has reached production. This correction adds a concrete shared runtime dependency allowlist to the canonical deployment classifier and an executable Brain regression. Customer-local `attested-local-ai.mjs` remains outside Netlify-hosted deployment. The Netlify tenant inference function also bounds server-registry parsing and fails closed on ambiguous prototype keys, requiring a hosted release for this repair.

Definition of done: protected tests pass, PR merged, Netlify production deploy is `ready` for the merged SHA or a proven safe descendant, and production readback requires deployment and verifies provider state. **Cloud and on-prem customer activation still requires independently verified tenant consent, secrets, provider readback and CSRD/privacy approval; this does not provision them.**
