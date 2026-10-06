# Terminalizer quality-registry and historical Supabase readback

Date: 2026-10-06

PR #3890 merged exact production LinkedIn runtime source and already had provider proof for setup v23, content-loop v31 and publisher v115. Its post-merge terminalizer failed before evaluating those proofs because `config/powerhouse-quality-surface-contracts.json` was treated as an unknown runtime path.

This change classifies that registry as governance and extends historical terminal reconciliation with the same fail-closed Supabase Edge provider-readback contract. PR #3890 is pinned by PR number, obligation, merge SHA and all three provider version/SHA tuples. Unknown runtime paths remain rejected.

The merge of this repair intentionally retriggers Historical Terminal Reconciliation on main. No Supabase deployment, schema mutation, LinkedIn provider write or replacement post is introduced.
