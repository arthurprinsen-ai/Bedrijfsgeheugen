# Development ledger — original innovation writer-time truth versus current waiting

- **Original owner:** agent:agent-integration-engineer.
- **Source candidate:** 55bb0754-355b-4940-aaea-aed7123e7e57.
- **Original operation:** edebcb32-335b-49f0-b527-eb4289f95c5c, original version 7 with historical audit readback.
- **Parent incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
- **Root cause:** PR #5857 originally required mutable `powerhouse_sales_actions.status='done'` for an immutable event; a later internal requeue to waiting produces a false past-execution gap.
- **Actual original 7d baseline:** 164 original writer status-done events, all with canonical evidence ref, historic executed time and linked action; current 163 done, 1 waiting. Provider dispatch, monetary outcome, original agent consumer ACK **NOT PROVEN**.
- **Implement:** existing original read model now joins immutable writer evidence and stored executed_at; count later current status separately; original portal displays two explicit dimensions.
- **Regressions:** 164 events over exact 100-row PostgREST pages, 1 currently waiting with original historical event truth, forged payload/writer/source ref/timestamp rejected, missing action rejected, count drift/duplicate/over-500 fail closed, no PII/secret emission.
- **No new system:** same authenticated function, Netlify deploy classifier, ONE BRAIN and Heartbeat loop. No DB mutation or second executor.
- **Pre-commit state:** code candidate; protected Required/CodeQL, exact prod Netlify sha and authenticated admin readback still required.
- **Rollback:** original protected release revert; retain immutable events, existing original operation and raw evidence.
