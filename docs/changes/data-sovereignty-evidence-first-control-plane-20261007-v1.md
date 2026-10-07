# Data sovereignty & AI compliance control plane

Bedrijfsgeheugen now exposes one live, evidence-first view of how company and customer data moves through the platform.

The Compliance Command Center shows, per tenant and for Bedrijfsgeheugen itself:

- what data enters each flow;
- which provider/component processes it and in which proven or observed region;
- where it is stored;
- cross-border transfer status;
- retention and training-use information;
- subprocessors and evidence links;
- active AI routes and models;
- configured connectors with source/target residency evidence;
- the last sovereignty refresh and policy violations.

Customers can select a data policy (`TRANSPARENT_GLOBAL`, `EU_STORAGE`, `EU_ONLY`) and a preferred AI provider/region. A preference is explicitly desired state: it does not silently reroute data until the selected runtime is active and evidence-backed.

`EU_ONLY` is fail-closed. Confidential portal AI and connector processing are blocked before external processing when residency or transfer evidence is missing or incompatible.

Provider truth is deliberately asymmetric. Supabase is verified in Frankfurt (`eu-central-1`) and its Edge invocations are region-pinned. Netlify is not labelled EU-only: provider/deploy evidence showed Functions in `iad` and Blobs in `us-east-1` for the tested preview, so the control plane keeps that path PARTIAL/UNKNOWN rather than manufacturing a green status.

The complete snapshot is refreshed by the same Brain → Heartbeat → Powerhouse loop under the invariant `measured_or_evidence_backed_else_unknown`.
