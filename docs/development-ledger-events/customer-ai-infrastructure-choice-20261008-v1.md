# Development ledger — customer AI placement
Date: 2026-10-08
Obligation-ID: customer-ai-deployment-residency-choice-20261008-v1
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4147
Current state: CANDIDATE_PROTECTED_DELIVERY (pending merge, migration, provider runtime readback)
Baseline: main 0a98adc436eaa12d45cf3282bb5b5fec66acfd2b
Existing system: Data Sovereignty UI, tenant policy, Supabase EU gateway and Anthropic confidentiality guard.
Gap: customer cannot request specific cloud/own hardware/model location in the portal.
Prevention: desired vs verified separation; fail closed for selected noncurrent routes; no silent fallback, training, self-certified EU residency or browser secrets.
Affected: portal-next/data-sovereignty-panel.*, netlify/functions/data-sovereignty.mjs, _data-sovereignty-client.mjs, Supabase portal-state-eu + migration, policy module, tests, system map.
Evidence needed for terminal status: protected main merge, migration/Edge/version and Netlify production readback, portal authentication and real enforcement smoke, immutable evidence.
