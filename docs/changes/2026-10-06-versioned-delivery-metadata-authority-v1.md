# Restore versioned delivery metadata authority

A valid versioned exact-head candidate manifest is immutable delivery metadata for a specific obligation. The mutable pull-request body may drift while repository writers synchronize or refresh a candidate.

The resolver had regressed to preferring any syntactically complete PR body even when a valid manifest existed for the same obligation. That contradicted the existing regression contract and caused unrelated delivery-latency work to fail its shared automation suite.

This fix restores the intended rule: same-obligation versioned manifest wins; PR-body authority is retained only when there is no manifest or the manifest belongs to a different obligation.
