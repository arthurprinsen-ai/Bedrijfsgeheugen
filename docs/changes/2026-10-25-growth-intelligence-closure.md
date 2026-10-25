# Growth Intelligence decision engine and admission recovery

PR #4901 builds a deterministic decision core, source-verification adapter contract, experiment safety guards and an injectable idempotent learning store. It does not instantiate another scheduler. Exact new `tools/growth-intelligence` paths are mapped to the pre-existing automation lane.

## Root cause and prevention
CI admission originally rejected unclassified delivery paths. After introducing a narrow classifier mapping, the integration closure gate detected missing human documentation, learning and ledger records. These companion records correct the evidence gap, without relaxing CI.

## Evidence and limitations
Growth module tests succeeded on previous head. Required, CodeQL, and Netlify must run against the new exact commit. The actual Heartbeat and customer portal are not yet connected to these libraries; production publication, revenue, and external customer research are not proven. Do not mark these live until protected merge and independent production/provider readback.

## Customer-scoped external guidance increment (2026-10-25)
Existing Heartbeat adapter now creates evidence-linked, tenant-isolated advice cards for verified events. Rejected: cross-tenant, unsupported/unverified, stale, personal data without lawful basis, and paid orders lacking independent verification. No scheduled web crawler, portal endpoint, automatic publication or contact, live source connector, or verified order is asserted. Added module regression test. Requires full protected CI and production readback.
