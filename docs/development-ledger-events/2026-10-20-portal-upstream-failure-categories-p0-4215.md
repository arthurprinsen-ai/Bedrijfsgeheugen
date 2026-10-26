# Development ledger — portal authenticated gateway diagnosis

Date: 2026-10-20
Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: portal|upstream-failure-classification|20261020
Delivery-Lane: portal
Candidate-Type: recovery
Scope-Budget: 7
Terminal-State: CANDIDATE / NOT_LIVE

Production incident: the official immutable Netlify deployment generated one synthetic Identity user's authenticated portal request and persisted a failed HTTP 502 proof. GitHub then read that *same* proof 30 times; do not misreport 30 separate failing customer calls. The existing Supabase Edge v221 service-token parity fix is deployed but is not on its own a successful authenticated Netlify portal proof.

Scoped change: only existing portal gateway/store code, two targeted tests, Brain learning, human change note and this ledger. Preserve tenant scope, service token, error-cache policy and latency limit. Propagate only known Edge read-stage enum identifiers to server-only logging; no raw message, token or tenant value. No new SQL, privileged clients, provider recipients or job disablement.

Required before terminal: protected Required/CodeQL, build preview, immutable production deploy evidence, authenticated HTTP 200 with payload/tenant verifications and two distinct customer tenant input→Brain/Heartbeat→dashboard readbacks. No synthetic green.
