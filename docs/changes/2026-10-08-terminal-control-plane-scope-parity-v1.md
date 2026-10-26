# Terminal release scope: deployment tooling is not production runtime

The first scope classifier for Supabase-only terminal closure distinguished Edge, Netlify and mixed changes, but treated newly modified `tools/delivery/` and `tools/supabase/` modules as unknown deployed runtime. Consequently the combined change set from PR #4142 could still enter a Netlify readback wait.

## Correction
Recognize these two deployment-control-plane directories as non-runtime. Preserve unknown application paths as fail closed; do not ignore all tooling generally. Add a regression test replaying the full changed-path mix of PR #4142.

## Terminal safety
Supabase Edge remains dependent on an ACTIVE provider version, matching runtime hash, protected-main ancestry and immutable Brain evidence. Netlify website changes still require the canonical Netlify release and readiness proof; mixed changes require both.

Status: PENDING_PROTECTED_DELIVERY until this correction passes protected tests, merges and produces provider readback and durable closure.
