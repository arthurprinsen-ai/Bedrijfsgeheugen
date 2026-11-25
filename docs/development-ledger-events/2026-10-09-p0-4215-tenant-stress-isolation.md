# P0 #4215 engineering event — tenant-scoped canonical stress and retry evidence

- Obligation: `p0-4215-input-stress-tenant-isolation-20261009-v1`
- Root cause: protected portal implementation lacked an always-executed 1000-observation / 200-field regression against the canonical input processing contract.
- Existing authority: portal BusinessInput HTTP handler, Netlify Identity tenant resolution, ONE BRAIN idempotent append abstraction, organism impact graph and canonical projection.
- Fix: checked-in Node test with 1000 synthetic input writes across two separate test tenant contexts, 200 field values per request, full Brain record lineage, duplicate/retry control, spoofed tenant/owner and revoked-session denials, >750KB fail-closed refusal.
- Operational boundary: these are **synthetic mocks**, not real production customer identities, provider calls or durable DB outbox.
- CI: `required-test.yml` preflight plus canonical learning historical replay/shadow/canary evaluation.
- P0 closure prohibition remains until real two-tenant auth and persistent ACK readback, 750KB split-batch/atomic outbox, actual browser fields and official customer-specific CSRD/ESRS evidence.
