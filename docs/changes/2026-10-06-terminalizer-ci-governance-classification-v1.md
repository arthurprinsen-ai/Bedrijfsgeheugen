# Terminalizer: CI helpers are governance-only

PR #3952 merged the canonical Netlify applicability authority and only changed CI/control-plane implementation plus evidence. Its post-merge terminalizer still treated `tools/ci/netlify-ignore-build.mjs` as unknown production runtime.

This change classifies `tools/ci/**` alongside the existing `tools/delivery/**` governance family. The runtime boundary is unchanged: `netlify/functions/**` and `supabase/functions/**` remain outside the governance bypass and continue to require runtime/provider readback.

The merge of this recovery replays terminalization for #3952 using current control-plane code.
