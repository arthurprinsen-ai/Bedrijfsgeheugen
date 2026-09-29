# 2026-09-29 — ERROR + RECOVERY — LinkedIn company OAuth capability

- **Fingerprint:** `linkedin-company-scope-aware-reconnect-v1`
- **Observed:** all pre-existing LinkedIn connections returned provider 401 `REVOKED_ACCESS_TOKEN`, despite several being reported ACTIVE by Composio.
- **Recovery attempt:** stale company aliases were removed and one new canonical company connection was authorized.
- **New evidence:** the fresh token passed `LINKEDIN_GET_MY_INFO`, but `LINKEDIN_GET_COMPANY_INFO` returned 403 because the new auth grant lacked organization scope.
- **Root cause:** connector-state health, token health and organization-scope health were collapsed into one status; reconnect reused an inadequate default OAuth configuration.
- **Preventive change:** company recovery now requires provider token health plus live organization ACL/write capability on the exact account; scope-deficient reconnects cannot become canonical.
- **Identity:** Bedrijfsgeheugen company organization `urn:li:organization:18234216`.
- **Duplicate safety:** the existing publication claim/content reservation remains authoritative through OAuth recovery; no replacement post or fallback writer may be created.
- **Hard boundary:** if the connector cannot select/create an organization-capable auth config, only that auth-config/OAuth action may be handed to the human.
- **Authority:** `.agents/skills/linkedin-composio-publisher/SKILL.md`, `AGENTS.md`, and the canonical system map.
