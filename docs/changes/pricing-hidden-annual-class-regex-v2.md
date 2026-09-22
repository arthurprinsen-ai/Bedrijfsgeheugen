# Pricing hidden annual class gate v2

The pricing release contract had a false-negative regex: the JavaScript regex literal used `\\b` around `jr`, which matched a literal backslash sequence rather than a word boundary. This was masked while `€ 49.950` itself was globally forbidden.

The guard now detects the legacy hidden `.jr` class directly, independent of legitimate visible yearly pricing. The live contract and build-integrity gate therefore distinguish intentional yearly billing from stale hidden annual markup.
