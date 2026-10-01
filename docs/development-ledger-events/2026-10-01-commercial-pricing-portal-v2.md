# Development ledger — SaaS + consulting pricing and portal parity

- Date: 2026-10-01
- Obligation: commercial-pricing-portal-v2
- Public pricing rebuilt into two explicit motions: SaaS and consulting/workshops.
- SaaS tiers: Starter / Pro / Groei / Enterprise.
- Self-serve prices: €99 / €299 / €749 per month; Enterprise is custom.
- Portal V2 now mounts authenticated commercial entitlement capacity.
- Checkout page aligned to Starter / Pro / Groei.
- Runtime policy expanded with seats, documents, AI question limits, automation limits, approval workflow, custom domain, model choice, executive summary, review cadence and SLA.
- Supabase canonical plan rows and entitlements provisioned additively; legacy Control/Scale remain temporarily available during production cutover to prevent checkout interruption.
- Final cutover requirement: after production readback, disable legacy Control/Scale direct checkout.
