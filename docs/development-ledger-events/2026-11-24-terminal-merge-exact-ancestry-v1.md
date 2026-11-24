# Development ledger — exact terminal ancestry evidence
Date: 2026-11-24
Obligation: delivery|terminal-merge|exact-ancestry-evidence|20261124-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661

Observed failing regression against protected main 210ec4c3a1136979a9cc392fb0e37b87d798da40: absent ancestry was admitted. Corrected original terminal guard, added executable regression, isolated combined result 15/15. No source admission change or new scheduler. Candidate requires protected delivery and independent production readback; central promotion slot and existing shared skill handoff remain open.

Protected Required run 45470360730 rejected the former test path because learning evaluations require tests/brain-*.test.mjs. The same executable regression has been moved into the dedicated canonical brain test, with the original state-machine test restored byte-for-byte. All 15 isolated regressions and the actual canonicalization evaluator historical replay, shadow and canary passed locally. No policy or check weakened. Fresh exact-head protected CI remains mandatory.
