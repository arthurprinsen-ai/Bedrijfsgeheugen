# Bedrijfslek claimed tenant projection — skill contract
- Existing `scan_inzendingen` + `scan_identity_verified` authorize reuse of self-reported score only after tenant claim.
- Canonical portal readmodel lives at existing `portal_state_layers:canonical-brain`, accessed exclusively via the established internal RPCs.
- Upsert stable IDs for BusinessInput/signal/health dimension/recommendedAction; never lose older rich data.
- Classify all scan values as SELF_REPORTED, not audited KPI data. New recommendations are proposals and must not be counted as executed projects or realised revenue.
- Fail closed on read/write errors, preserve old portal state and allow idempotent retry.
- Never elevate unauthenticated visitors to tenant identity, reveal contact PII, or create duplicate schedulers, CRM campaigns, or Brains.
- Accept only with regression, protected CI, exact Supabase/Netlify readback and real authenticated customer results.

- In Portal V2 render the attached selfreported score and proposed (not executed) actions only when verified tenant projection exists; use DOM-safe textContent. Never replace audited company KPIs.
