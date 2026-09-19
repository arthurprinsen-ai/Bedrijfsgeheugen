# GitHub-main production identity

For a GitHub-main delivery, the current protected main SHA is a containment witness, not the identity of the obligation being terminalized.

The terminal closure now proves that the obligation's merge SHA is contained in current main, then records the merge SHA itself as `production_observed_sha`. This keeps terminal evidence stable even when main advances after the obligation merged.
