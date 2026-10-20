# Portal P0 #4215 — database sortindex-herstelroute

Obligation-ID: portal|authenticated-read-index-optimization|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Date: 2026-10-20
Status: CODE_CANDIDATE / NO_PRODUCTION_PROOF

Provider checks: preview index inventory confirmed missing global publication-date and permitted-signal-date indexes. Preview tables each have zero rows; performance impact cannot be measured there. Production index check and a simple `select now()` both failed due connection termination/timeout.

Existing diagnostic PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4535 has previously passed Required/CodeQL but attempted protected squash merge returned `3 of 3 required status checks are expected` on the current protected head. Do not bypass checks. The 76 contact-authority and 42 Heartbeat timeouts remain independent critical workload and pool-pressure obligations.

Migration proposed, not treated as live. Required evidence: exact-source checks, production migration readback, query plans and time budgets, signed HTTP 200 and isolated two-tenant acceptance.
