# LinkedIn reconciliation independent from Buffer

Date: 2026-09-28  
Fingerprint: `linkedin-reconciliation-buffer-isolation-v1`

The daily social runtime previously ran provider reconciliation only when Buffer was healthy. That unintentionally made Composio-owned LinkedIn readback depend on an unrelated retired fallback provider.

The publisher now runs exact existing-provider reconciliation first on every run. LinkedIn personal and company URNs are reconciled through Composio regardless of Buffer cooldown. If Buffer is unavailable, only Buffer-owned records are marked audit-deferred; LinkedIn recovery continues.

This preserves the single-writer/no-duplicate contract: once LinkedIn returns a provider URN, the runtime reconciles that exact URN and never creates a replacement merely because Buffer is rate-limited.

Regression coverage lives in `tests/brain-linkedin-composio-authority.test.mjs`.
