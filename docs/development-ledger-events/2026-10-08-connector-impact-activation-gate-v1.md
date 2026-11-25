# Connector impact gate and review queue

- Obligation-ID: connector-cross-domain-activation-gate-20261008-v1
- Scope: backend tenant connector API + shared One Brain regulatory module + regression.
- Security invariant: untrusted POST/PUT cannot set Active, fake authorization, or reuse old config version evidence; existing provider/residency guard remains hard.
- Workflow invariant: an unassessed ESRS materiality candidate does not itself deadlock independently verified safe connector execution; pending review stays open and visible.
- Business invariant: connector effects are reviewed with GDPR, security, finance and CSRD/ESRS, not siloed.
- Remaining external obligation: tenant-authorized server-only impact review completion with audited scope/evidence; do not claim final CSRD approval or live cloud AI adapters.
- Evidence: `tests/brain-connector-impact-gate-v1.test.mjs`; protected CI, merge and production deployment remain pending at creation.
