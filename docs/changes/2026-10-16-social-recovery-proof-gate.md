# Social publication recovery: fail closed on provider truth

The existing GitHub recovery workflow now rejects scheduled-but-not-published social decisions and rejects responses without `providerTruthHealthy === true`. The change does not create another publisher, bypass permissions, or mark blocked channels as successful. A LinkedIn provider-side-effect fallback may be accepted only through the existing runner's `providerTruthHealthy` contract; no synthetic external identifiers are allowed.

Acceptance: required CI and CodeQL green, protected merge, same-day production recovery, provider-side evidence and canonical readback. Blog, email and Instagram remain separate obligations until actual authorized delivery is demonstrated.
