# Terminal migration canonical identity recovery

Repairs terminal obligation closure when historical supersession evidence references an older migration version for a migration that now has one unique canonical version on current main.

The closure workflow now reconciles by stable migration name only when current main contains exactly one canonical identity, then retains exact version + name production-ledger verification. Ambiguous identities remain fail-closed.
