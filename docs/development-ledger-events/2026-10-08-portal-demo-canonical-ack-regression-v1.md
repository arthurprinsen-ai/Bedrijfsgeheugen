# Portal demo and One Brain canonical ACK repair

- Obligation-ID: portal-demo-canonical-ack-regression-20261008-v1
- Root cause: demo state was incorrectly sent through the authenticated durable BusinessInput acknowledgement assertion; a test still expected the retired v3 causal engine identifier.
- Runtime: demo-only non-durable return; real missing ACK still rejects.
- Verification: `tests/brain-portal-demo-businessinput-ack-v1.test.mjs`, existing Portal BusinessInput and causal propagation suites.
- Scope: only portal domain-state boundary and matching test expectation, no production data modifications.
- Production status: protected checks and deployment readback required after merge.
