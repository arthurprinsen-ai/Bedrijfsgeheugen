# Development ledger: historical obligation replay

- Date: 2026-10-08
- Obligation-ID: historical-terminal-replay-4134-20261008-v1
- Failure fingerprint: workflow-dispatch-registration-rejected-historical-closure-4134
- Original obligation: linkedin-cross-workspace-auth-proof-20261008-v1
- Original PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4134
- Exact original merge SHA: f8c7f313be234da58326a399d45b5866ff13ca59
- Current provider: ACTIVE version 29, runtime hash stored in learning record; exact source parity established
- Rejected action: existing workflow_dispatch on GitHub returned HTTP 422 despite registered active workflow
- Recovery: trusted one-time protected main push -> workflow_call canonical closure -> durable Brain readback
- Not authorized: bypass protected branch, SQL terminal state mutation, or mark old failed run as succeeded
- Completion gate: CI + CodeQL + protected merge + called terminal workflow successful + Brain database FULFILLED + artifact
- Status: PENDING_PROTECTED_DELIVERY
