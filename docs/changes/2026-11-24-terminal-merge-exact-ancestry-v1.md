# Terminal merge: exact ancestry evidence

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Obligation: delivery|terminal-merge|exact-ancestry-evidence|20261124-v1

The existing terminal guard coerces null or blank ancestry to zero and can accept an absent SHA identity. The new executable regression failed on the exact protected source 210ec4c3a1136979a9cc392fb0e37b87d798da40 before the correction. The corrected guard refuses missing or malformed SHA identities and requires an observed nonnegative integer behind count. A value other than zero remains blocked. Admission epoch semantics, native branch protection, existing checks and original budgets are unchanged.

Isolated Node 24 regression: 15/15 passed across the original state-machine and terminal-writer tests. This is a source-level correction, not proof of a historical unsafe merge, global native auto-merge arbitration, release synchronization, or production success. Protected Required/CodeQL, merge and independent terminal readback are required. The original #6142 and #6165 remain under their existing ownership and exhausted refresh budgets.
