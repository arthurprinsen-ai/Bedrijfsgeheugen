# Verified Brand Content Learning — runtime initialization recovery

The production content orchestrator previously built the editorial prompt before the verified brand learning guide had been initialized. For company LinkedIn, blog and Instagram routes this would throw a JavaScript Temporal Dead Zone reference error at runtime. This change orders the evidence-guide definition before the editorial expression, without modifying the verified-only, tenant-scoped learning filter, customer information permissions, content policy, release gates or publication authority.

The regression checks the exact source dependency order and retention of `PROVEN` / `bedrijfsgeheugen` learning scope. CI success is not evidence that a future post is published, viewed, clicked or converted. The existing canonical hourly content orchestrator and protected Supabase Edge integration remain the only owners; no second scheduler is created.
