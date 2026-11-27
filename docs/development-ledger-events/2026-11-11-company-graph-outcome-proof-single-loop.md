# Development Ledger — 2026-11-11 Company Graph false causal edge / false realised value

- Fingerprint `company-graph|unrelated-first-item-causal-link-and-false-realized-value|20261111-v1`.
- Owner: original Portal V2 Company Intelligence context; original source consumers #4215/#4198.
- Problem: UI linked unrelated first arrays and rendered unverified `value` as realised euros with silent invalid-number-to-zero conversion.
- Root cause: Context graph used positional first-element proximity and untyped outcome pairs instead of canonical `verifiedCustomerOutcome` and source/action correlation.
- Repair: reuse original outcome validator, compare explicit causal IDs, require typed source/metric/period/baseline and independent action-linked evidence, separate forecast from realised, next-decision proof for learning.
- Tests: original Company Intelligence historical/shadow/canary, deterministic mismatched and positive fixtures, tenant A/B and missing proof.
- Prevention owner: original data-quality agent and Company Intelligence OS skill.
- No second store, scheduler, agent or action issuer. Scope not proof of external execution, actual revenue, two real tenants or next-cycle applied Heartbeat learning.
- Protected Required+BRAIN+CodeQL, current Netlify SHA and independent real browser/tenant readback are final release gates.
