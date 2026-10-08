# Terminal closure: route runtime evidence to the correct production authority

On 8 October 2026, GitHub run [37760879023](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37760879023) failed in `Wait for canonical production release readback` for merged PR #4134. Its only deployed runtime change was a Supabase Edge Function, yet the terminal closure required a live Netlify descendant. The provider resolver also filtered out functions absent from `supabase/config.toml`.

## Implementation

- Introduce shared `classifyTerminalReleaseScope` using the existing canonical Netlify runtime contract.
- Edge-only change: require ACTIVE provider identity with version/hash, protected main containment, and changed-source non-supersession; no unrelated Netlify release.
- Netlify changes: preserve existing canonical production release proof and live readback.
- Mixed changes: require both provider attestation and canonical Netlify release evidence.
- Undeclared changed Edge function cannot silently resolve to empty scope. Register the already ACTIVE company LinkedIn setup function with its existing JWT setting.
- Preserve immutable Brain evidence, single writer, branch protection, and fail-closed semantics.

## Verification

Added `tests/brain-terminal-release-authority-scoped-v1.test.mjs` to cover Edge-only, Netlify-only, mixed, unknown paths, undeclared functions, and inventory. This change is **not** declared live until protected tests, merge, provider evidence and durable Brain readback succeed.
