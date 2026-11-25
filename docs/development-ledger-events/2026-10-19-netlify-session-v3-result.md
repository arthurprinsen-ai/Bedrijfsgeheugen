# Netlify Composio session execute evidence — 19 October 2026

Obligation-ID: netlify-composio-session-execute-v3-envelope-20261019
Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Production OIDC evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39228785972

Account discrepancy no longer reproduced in latest 09:16 UTC test: 50 accounts examined, one ACTIVE netlify_mcp, no disabled/missing identity. New stage reached: session successfully created but Netlify reader execution HTTP400. Independently fixed confirmed v3.1 response envelope misuse by using result_type and data, not legacy successful. Added safe error category and provider log-id correlation for the remaining HTTP400.

No new user account, credential, permission, sidecar scheduler, queue or Netlify deploy. Protected CI, readback, genuine provider health and exact production proof required; incident remains OPEN.
