# Development ledger — pricing interactions — 2026-09-23

- **Obligation:** `pricing-interactions-functional-20260923-v1`
- **Surface:** public pricing page `/prijzen`
- **Observed failure:** rendered toggles and phase buttons did not reliably produce state transitions; billing-row alignment was inconsistent.
- **Root cause:** single-path direct listener initialization plus insufficient interaction-layer resilience; negative layout offset for billing controls.
- **Change:** delegated capture-phase fallback, explicit stacking/isolation, synchronized ARIA/hidden state, keyboard navigation, billing URL propagation, normal-flow spacing.
- **Candidate branch:** `fix/pricing-interactions-20260923`
- **PR:** #2655
- **Required evidence:** exact-head CI, merge to main, production promotion/readback, functional control-state verification.
- **Prevention:** no pricing control is accepted on visual presence alone; each control must demonstrate its intended state transition and downstream effect.
