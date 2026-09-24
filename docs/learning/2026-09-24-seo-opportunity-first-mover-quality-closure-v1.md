# SEO first-mover quality closure

The first SEO opportunity resolver implementation exposed two governance gaps after merge: its Edge Function was not registered as a required Powerhouse quality surface, and the Brain learning referenced a test path outside the mandatory `tests/brain-*.test.mjs` pattern.

Both are now part of the contract. The resolver is registered with a required evidence test, and the historical replay uses the Brain-pattern wrapper that also executes the underlying resolver regression suite.

This is not a cosmetic CI fix. It ensures future changes to autonomous search opportunity scoring, intent-owner gating, external-data fusion or first-mover publication cannot silently bypass the central quality registry.

The SEO revenue skill is updated accordingly: new runtime surfaces are not structurally complete until registry and evidence contract are present and green.
