# 2026-10-06 — LinkedIn company scoped OAuth

Obligation: linkedin-company-scoped-oauth-20261006

Observed:
- generic LinkedIn OAuth connections can be ACTIVE and personal-health-valid while organization ACL requests still return 401/403;
- repeating generic reauthorization does not add r_organization_admin;
- company publication remains resumable with no provider side effect.

Repair:
- preserve deployed setup v18 as source authority;
- request explicit organization admin/read/write scopes in a dedicated auth config;
- bind the resulting connection ID into canonical current state;
- require a live approved ADMINISTRATOR ACL for the canonical organization;
- allow resume only after fresh bound organization OAuth is proven.

Acceptance:
- exact source deployed successfully;
- create_link returns a scoped OAuth URL and candidate connection ID;
- after user authorization, status proves company_oauth_fresh_verified=true;
- only then may the existing daily company claim resume through the canonical publisher.
