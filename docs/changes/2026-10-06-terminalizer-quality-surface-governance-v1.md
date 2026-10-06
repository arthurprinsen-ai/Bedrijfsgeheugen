# Terminalizer quality-surface governance classification v1

## Problem

PR #3890 merged through protected checks and its canonical Production Release Readback succeeded, but the post-merge Powerhouse Obligation Terminalizer failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.

The Supabase Edge Function paths were valid runtime surfaces. The false blocker was `config/powerhouse-quality-surface-contracts.json`, which is a repository governance registry rather than executable production runtime.

## Structural repair

- Classify `config/powerhouse-quality-surface-contracts.json` as governance in the existing Obligation Terminalizer.
- Keep Supabase Edge Functions on the provider-readback path.
- Keep unknown non-Netlify runtime paths fail-closed.
- Add a regression test that requires the registry to stay inside the terminalizer governance classifier.

## Terminal recovery

After protected merge of this control-plane repair, rerun the failed terminalizer for #3890. The expected terminal evidence remains bound to merge SHA `22d57fdcb0e7344914288091a75319c1198a73ef`, whose canonical Production Release Readback already succeeded.
