# Netlify production transport self-execution — development ledger

- Obligation-ID: netlify-production-transport-self-executing-v1
- Delivery-Lane: automation
- Candidate-Type: recovery
- Problem: the secure Netlify transport packaged current main on push but only performed the deploy on manual workflow_dispatch.
- Fix: allow the existing authorized deploy and exact production proof steps to execute when the transport workflow itself is pushed to main.
- Security: reuse the existing temporary encrypted Netlify MCP proxy secret; no provider credential is added to the repository.
- Definition of done: Required + BRAIN green on exact head, protected merge, push-triggered exact-source deploy, production release marker/readback green.
