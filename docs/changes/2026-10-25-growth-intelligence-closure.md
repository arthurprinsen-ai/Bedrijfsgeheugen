# Growth Intelligence decision engine and admission recovery

PR #4901 builds a deterministic decision core, source-verification adapter contract, experiment safety guards and an injectable idempotent learning store. It does not instantiate another scheduler. Exact new `tools/growth-intelligence` paths are mapped to the pre-existing automation lane.

## Root cause and prevention
CI admission originally rejected unclassified delivery paths. After introducing a narrow classifier mapping, the integration closure gate detected missing human documentation, learning and ledger records. These companion records correct the evidence gap, without relaxing CI.

## Evidence and limitations
Growth module tests succeeded on previous head. Required, CodeQL, and Netlify must run against the new exact commit. The actual Heartbeat and customer portal are not yet connected to these libraries; production publication, revenue, and external customer research are not proven. Do not mark these live until protected merge and independent production/provider readback.

## Customer-scoped external guidance increment (2026-10-25)
Existing Heartbeat adapter now creates evidence-linked, tenant-isolated advice cards for verified events. Rejected: cross-tenant, unsupported/unverified, stale, personal data without lawful basis, and paid orders lacking independent verification. No scheduled web crawler, portal endpoint, automatic publication or contact, live source connector, or verified order is asserted. Added module regression test. Requires full protected CI and production readback.

## CRO experiment capability reconciled with current protected main — 29 October 2026

Original PR #4901 diverged from protected main; baseline Growth Intelligence code, customer-signal cards, shared learning and delivery tests already advanced independently. Instead of replacing those changes, the candidate merges current main as a parent and adds only: a pure preregistered CRO experiment contract, WhatsApp/form/scan-followup/desktop exit-intent options, verified-assignment and SRM guards, independent outcome and measurement gap diagnostics, Heartbeat proposal fields, scoped CI lane, canonical Growth Swarm skill and System Map candidate description. All changes remain advisory unless the existing authorized website writer performs a separately verified release. No new scheduler, learning database, outbound publisher or auto-approval is introduced.

Control diagnostics compare only aligned and independently verified source windows; `growth_page_daily` 0 attributed CTA clicks and `bg_interacties` 48 click-like events are not equivalent. Existing Supabase follow-up candidate: `c1727e17-6200-44ff-9a31-eec0ea7c1ead` (measured outcome missing). Isolated V8 source harness previously passed 19/19 tests; the final merged source requires exact-head Node/Required/BRAIN/CodeQL plus Netlify and authenticated production readback before LIVE.
