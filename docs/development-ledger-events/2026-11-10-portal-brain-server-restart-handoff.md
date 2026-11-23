# 2026-11-10 — Portaal server-acknowledged source but Brain handoff lost on restart

Original owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: `portal|domain-state|brain-pending-memory-lost-on-restart|20261110-v1`.
- Failure class: transient browser-only pending BusinessInput map, despite successful server source save; any unconfirmed downstream Brain section can be silently omitted on reload.
- Recovery: original `/api/portal-state` stores a versioned principal-scoped pending manifest, original `createPortalDomainState.init()` restores it and original `flush()` retries. Partial ACK keeps only unconfirmed work; original `/api/portal-business-input` and canonical Brain remain authorities.
- Security: strict user + app_metadata tenant, validate all paths on rehydration, never reroute A to B or leak internal journal to AI-eligible BusinessInput snapshot.
- No new cron, workers, tables, databases, external providers or alternative outreach executors. Document remaining issue #4215 browser-offline and server-only processing / 2-tenant acceptance evidence.
- Additional verified root cause: the authenticated portal handler used the browser readback timestamp for NEW state saves, while the existing database RPC rejects source_updated_at values not later than the current layer. Original handler now server-stamps new authenticated writes; no RPC changes or stale-bypass, regression in `tests/portal-server-state.test.mjs`.
- Regression: `portal-v2/tests/portal-server-handoff-restart.test.mjs`, `tests/brain-portal-server-durable-replay-20261110.test.mjs`.
