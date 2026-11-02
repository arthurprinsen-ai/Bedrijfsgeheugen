---
name: powerhouse-security-trust-center
description: Use for every material change to security, privacy, provider assurance, data sovereignty, IAM, customer trust answers or security/compliance evidence.
---

# Powerhouse Security Trust Center

Fingerprint: `powerhouse|security-trust|evidence-first|v1`.

## Invariants
- Portal is one product: `portal/`, `portal-next/` and `portal-v2/` are technical implementation paths only, never separate portals, authorities or UX shells.
- Trust surfaces are private portal capabilities: only authenticated customers and Bedrijfsgeheugen administrators may see them; demo/public access is forbidden.
- Customer trust APIs must resolve the tenant server-side; canonical Bedrijfsgeheugen scope is admin-only.
- Legacy standalone URLs may only deep-link into authenticated Portal V2 and must never render independent trust data.
- Never turn provider SOC/ISO/security assurance into a Bedrijfsgeheugen certification claim.
- Never turn legal framework relevance into a compliance conclusion without applicability evidence.
- Never keep IAM/account evidence green after its expiry; use STALE.
- Derive database posture from live catalog/privilege evidence where possible.
- Reuse the data-sovereignty heartbeat; do not create a second scheduler.
- Preserve tenant isolation and server-side tenant resolution.
- Surface answers where the customer asks them: data location, access, AI training, cross-border transfer, open findings and relevant frameworks.
- Unknown is a valid result and is never silently promoted to verified.
- Production/provider readback is required before LIVE_BEWEZEN.

## Canonical runtime
- `portal-v2/?page=trust-center`
- `portal-v2/?page=data-ai-passport`
- `portal-next/security-trust-center.js`
- `netlify/functions/security-trust.mjs`
- `supabase/functions/portal-state-eu/index.ts`
- `public.security_trust_snapshot_v1`
- `public.security_database_posture_v1()`
- `public.powerhouse_refresh_data_sovereignty_v1()`

## Tenant model choice → live passport (2026-10-20)
Fingerprint: `portal|ai-passport|tenant-model-choice-live-projection|v1`.
- Bind passport to existing tenant `portal.aiModelPreferences`, same-tenant sovereignty AI registry, and `/api/tenant-ai-activation-status`.
- Requested preference, registered route, ready-for-test and actual execution remain separate claims.
- Reuse canonical domain-state/BusinessInput/organism writes and the existing sovereignty Heartbeat; no second scheduler.
- Revalidate after successful save ACK, including when mounted during a save. Hide readiness for pending/changed selections.
- Authoritative runtime events force a coalesced refresh; passive focus/visibility is throttled. Queue one follow-up during a read.
- Clear details on identity change; abort/dispose and reject late responses on navigation.
- Even admin model preferences require same-tenant evidence, never a join to canonical admin inventory.
- Regression: `tests/brain-portal-ai-passport-model-binding-v1.test.mjs`.

## Incident egress, immutable logging and historical-copy assurance (2026-10-29)

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1

- Treat **public GitHub PRs and branches**, code-review diffs, Action artifacts, Netlify previews, webhook/agent tools, email and social providers as **external egress**. Unapproved blog drafts, internal Brain/ledger data, tasks, tenant context and credentials MUST NOT be staged there.
- Before the last egress writer, enforce explicit approval (`approved_at` must exist for blog publication; a `publish` decision alone is insufficient), content classification, server-side tenant and recipient/destination authorization, deterministic allowlist and duplicate prevention. Missing evidence is a denial, not a deferred green.
- For each material attempt, persist a sanitized, idempotent audit receipt in **existing private ONE BRAIN** with UTC time, incident fingerprint, owner, source SHA, action, destination class, approval/authorization decision, provider request ID (if one exists), readback, failure class, remediation and regression proof. Do not publish raw drafts, tokens, personal identifiers or internal evidence in PRs, previews or issue comments.
- Keep separate claims for `TECHNICAL_CONTAINED`, `HISTORIC_PUBLIC_COPIES_UNRESOLVED` and fully `RESOLVED`. Closing a PR, deleting its source branch or deploying a fix does **not** delete public historical PR diffs, cached preview assets, Git objects or third-party copies. Preserve original private evidence and re-evaluate the residual exposure.
- Privacy controller classification, independent recipient attribution and provider access logs are distinct evidence types. Absence of a match or a bounded regex scan is never proof of exhaustive absence; reassess if contrary evidence emerges.
- A security decision or failed release must update the same incident/failure fingerprint, its bounded recovery obligation, negative test and preventive skill. Keep the original executor running only on independently authorized lanes; never loosen GitHub Required/BRAIN/CodeQL, approval, OAuth or protected merge to get green.
- Regression: `tests/brain-social-delivery-agent-handoff-20261029.test.mjs`; factual production authorization evidence remains in the existing private incident register, not this public skill.

## Centrale Security Agent — platformbescherming (2026-11-02)
Fingerprint: `powerhouse|security|cross-platform-evidence|20261102`.

- Existing `agent-security` is the specialist inside ONE BRAIN, Powerhouse and the *existing* Heartbeat/agent fabric. Do not create a separate scheduler, worker, autonomous production writer, datastore or unauthenticated dashboard.
- Scope: GitHub branch rules, CodeQL, secrets/supply chain; Supabase Security Advisor, RLS, privileged functions and migrations; Netlify preview protection, secret scanning and exact production deploy; website/portal HTTPS response headers, auth and tenancy boundaries, dependencies and incident detection.
- Record provider-observed metadata through the **existing private** `record_security_management_observation_v1` path. Use only the canonical tenant for Bedrijfsgeheugen-wide provider state. Never place raw scanner output, access tokens, credentials, personal data, repository contents or internal operational evidence in customer-facing snapshots, PRs, issues, previews or static assets.
- Each required platform control needs an independent source identity, timestamp, evidence availability, severity, owner, action, result and bounded expiration. Accept `VERIFIED` / `PASS` only on current readback. `NOT_VERIFIED`, stale, missing, warning or denied access must never turn green. Portal lists unobserved controls as `EVIDENCE_PARTIAL`.
- A valid live deploy does not establish security posture. A passing CodeQL job alone does not establish secret-scanning, authentication or the security of a production API. Recompute only from independent evidence.
- Regression: `tests/portal-private-trust-surfaces-v1.test.mjs` prevents status-substring false green, unsafe evidence hrefs, partial platform coverage and missing proof.
- Normalize provider findings before opening ONE BRAIN security incident: deduplicate by `provider:asset:control:fingerprint`; preserve observation, scope, risk, root cause, owner, before/after evidence, rollback and negative regression test. Keep unresolved findings open; expiry or changed source reopens them.
- Auto-correct only bounded reversible low-risk changes after policy checks and exact-readback proof. Do not revoke unknown production credentials, change auth policies, rotate keys, disclose secrets, weaken security gates, change paid plans or publish publicly without required authorization.
- Releases must remain behind the existing exclusive-writer protected PR path, Required/CodeQL/BRAIN and independent production readback. Security may **veto** a release but may never bypass the release process.
- Auditor alerts and configuration reports must be injected into the *existing* scheduled agent run/Heartbeat; this roster/skill alone does not prove autonomous execution. Report `NOT_WIRED` until the provider poller has a verified scheduled invocation.
- Provider-specific vulnerabilities, affected resources and remediation attempts belong exclusively in the existing private incident register and tenant-scoped trust snapshots, never in this publicly readable repository. Do not claim an audit resolved without a new provider readback.

## Writer-control function search-path regression (2026-11-02)
- Exclusive PostgreSQL writer leases are security-critical. Preserve `SECURITY INVOKER`, schema-qualified table reads/writes, current service-role-only grants and current single-writer enforcement.
- Source-own search-path hardening via `20261102141045_writer_control_fixed_search_path_v1.sql`, not ad hoc production DDL. Pin `pg_catalog, writer_control`; abort on function identity or invoker contract drift; verify three function configs with `pg_proc` after application.
- Canonical negative test: `tests/brain-security-trust-center-v1.test.mjs`. Record provider advisor readback, applied migration identity and real lease smoke tests before resolving the original security warning. Unknown or unapplied remains OPEN.
- A separate token-gated external RPC review is not silently resolved by this change and requires source-callpath and auth readback before adjusting grants.

## Expired cached positive evidence must never render green — 2026-11-02
- A database snapshot's previous `PASS` or `VERIFIED` is not permanent proof. The Portal must independently check **every** required provider observation has parseable `observed_at <= current UTC time < expires_at` before showing a positive platform status.
- Require source snapshot `generatedAt` to be parseable, nonfuture and at most 24h old for overall green. Invalid/missing/expired timestamp, evidence flag or required control = `EVIDENCE_PARTIAL`; current explicit FAIL remains `ACTION_REQUIRED`.
- Regression: `tests/portal-private-trust-surfaces-v1.test.mjs` and canonical `tests/brain-security-trust-center-v1.test.mjs`. Refresh through original ONE BRAIN/Heartbeat and prove via protected production readback; no second scheduler or customer-side source of truth.

## Security migration history must remain provider-identical

- When any security-related Supabase migration is proven applied in the provider, `supabase/migration-history.lock.json` must contain its **exact version and name**, with every prior provider-verified identity intact. Use original Supabase migration history and executable Git sources as two independent witnesses; never invent missing provider rows.
- A post-merge BRAIN failure in migration history is an original ONE BRAIN incident and terminal release blocker, even when Netlify deploy is READY. Do not hide, skip, bypass or weaken any CI assertion; repair the original source lock under the sole protected writer, and rerun exact-head gates.
- Before changing a migration lock, diff **all** provider identities against the existing lock, accept only verified append-only changes, source-close with dedicated `brain-` regression and historical/shadow/canary learning, then require original provider and terminal readback. Never reapply an already-applied database migration merely to make a ledger test green.

## Ondernemerskompas: bronbewijs zonder schijnzekerheid (2026-11-02)
- Het private klantportaal moet binnen **Security Trust Center** eerst antwoord geven op: **Hoe veilig is mijn bedrijf op dit moment, waarom, sinds wanneer en wat wordt eraan gedaan?** Toon het Veiligheidskompas met vijf begrijpelijke categorieën, status in woorden, bronmoment, onzekerheid en relevante klantacties; het technische register is secundair.
- Maak **bewijsdekking** nooit een beveiligingsscore. Geen 100%-veiligheid, garantiestelling, SOC/ISO-claim of certificeringsclaim namens Bedrijfsgeheugen zonder eigen certificatiebewijs. "Geen incident bekend" is niet gelijk aan "veilig".
- De bestaande `securityOverallPosture`, `isCurrentSecurityObservation` en `isFreshSecuritySnapshot` blijven de exclusieve bron van statuskleur. Positieve status alleen bij actueel, volledig, onafhankelijk bewijs per vereiste controle; expliciete FAIL blijft aandachtspunt, verlopen en ontbrekend bewijs blijven onzeker.
- Beperk in de **klantweergave** technische bevindingdetails, databaseprivileges, operationele kwetsbaarheids-ID's en ruwe managementobservaties. Alleen de bevoegde admin ziet die detailstatistieken; de klant krijgt eerlijke uitkomst en vervolgstap op basis van zijn eigen tenant.
- De klantenkaart gebruikt betekenisvolle tekst naast kleur, begrijpelijke taal, focuszichtbaarheid, mobiele stapeling en bewegingsreductie. Interactieve knoppen of links moeten hun bestemming expliciet aangeven; alle HTML-hrefs zijn absolute https-URL's.
- `agent-security` controleert bij iedere bestaande Heartbeat nieuwe/verlengen bronmetingen, heropent vervallen bewijs en registreert oorzaak, impact, eigenaar, herstelvoorwaarde, regressietest en preventieregel in origineel ONE BRAIN. Geen tweede scheduler of writer; geen nieuwe open publieke security-endpoints.
- Elk open archiefaccess- of privileged-RPC-risico blijft expliciet open tot onafhankelijke Netlify/Supabase-providerreadback en originele operationele smoke tests groen zijn. Portalresultaat, productie-SHA en volledige BRAIN-gates afzonderlijk bewijzen.
- Regressie: `tests/brain-security-entrepreneur-compass-v1.test.mjs` en bestaande `tests/portal-private-trust-surfaces-v1.test.mjs`; geen gevoelige details zichtbaar voor niet-beheerder.

- **Server-side customer minimization** is mandatory: the original authenticated Netlify `/api/security-trust` must call the allowlisted customer projection after tenant resolution for non-admins. Hidden UI panels are not an access-control boundary. The source projection may expose high-level status, freshness, necessary labels and count, but never raw findings, secrets, internal diagnostic route, database privilege metadata or management observation source. Regression: `tests/brain-security-customer-projection-v1.test.mjs`.

## Provider-remediation failure closure (2026-11-02)
Fingerprint: `powerhouse|security|provider-fix-not-proven|20261102-v1`.

- The existing `agent-security` uses the existing ONE BRAIN incident fingerprint and Heartbeat. A `422`, `403`, policy denial or unsupported connector action is not a successful write and is never retried indefinitely. After one independently confirmed unsupported/denied action, stop the mutation lane, preserve provider readback as `FAIL` or `WARN`, and route an owner-required dashboard change to the same original obligation. The daily canonical executor must remain active for unrelated authorized work.
- A provider setting is `PASS` only after independent fresh provider configuration readback **and** an anonymous negative access test for private-only assets. A successful API call or local source edit without these two proofs cannot close the issue. Protect both production and deploy-preview surfaces when an archived/private site is involved.
- A privileged backend RPC intentionally gated by a token is still an independently reviewable attack surface when reachable with the anonymous API role. First inventory source-controlled and provider-side callers, credential authority, operational cron effects and rollback. Never revoke production execution permission or rotate unknown credentials just to silence the advisor.
- Least-privilege migration requires original caller substitution, protected CI/CodeQL/full BRAIN, negative unauthenticated invocation, positive original-caller smoke proof, independent provider security advisor result and expiring observation readback. `WARN` remains while the caller is unidentified or the provider lint remains present.
- Original private failures are append-only occurrences with the same fingerprints. Promotion from `OBSERVED` to `VALIDATED` requires independent root-cause evidence; `PROVEN` requires an actual original fix and negative regression. Never upgrade maturity or publish secrets, affected private site URLs or full privileged SQL bodies to public PRs, previews, documents or customer views.
- The canonical `security_management_observation_v1` read model supplies the same authenticated Security Trust Center. For customer communication show consequence, accountable action, checked-at and limitations, not technical exploit details. Evidence coverage is not a safety percentage. No second scheduled agent, parallel publisher, direct production DDL or false-green override.
- Regression: `tests/brain-security-provider-remediation-v1.test.mjs` and `tests/portal-private-trust-surfaces-v1.test.mjs`.

## Imported-agent Netlify deployment parity (2026-11-02)
Fingerprint: `security|agent-roster|netlify-import-deployment-gap|20261102-v1`.

- The canonical `platform/agents/agent-team.mjs` is imported into active Netlify functions (`_cost-projection-store.mjs` and `_powerhouse-compound-improvement-proof.mjs`). Changes to this module must be classified as Netlify runtime, even when their delivery lane is backend. Never treat an agent task change as governance-only without proving its import graph.
- Both the original `deriveNetlifyDeploymentApplicability` and the immutable production truth contract must identify this exact source. A runtime change requires Netlify build parity, actual production deploy, exact source SHA and authenticated two-tenant API proof. `READY` for an older deployment is not a live release.
- Other docs/skills/learning-only modifications remain governance-only; do not force new deployments for them. The original Netlify git deployment remains the only publisher; do not create a parallel build hook, deploy executor or bypass.
- After discovering a historical false `NOT_REQUIRED` decision, require a protected successor release containing the exact imported runtime module and repeat the original Netlify provider readback; leave the source-drift incident open until proven.
- Regression: `tests/brain-security-agent-netlify-runtime-parity-20261102.test.mjs`; also retain `tests/brain-production-readback-terminal-authority-v1.test.mjs`.

## External recovery RPC least-privilege cutover hold — 2026-11-02
- Keep the original `powerhouse_external_cron_reconcile_v1(text)` and its internal private credential gate. Supabase Security Advisor flags the historical explicit `anon` EXECUTE grant; a token gate is not sufficient evidence for a publicly invokable privileged endpoint.
- A *draft* source migration `20261102181500_external_cron_rpc_service_role_only_v1.sql` can remove browser EXECUTE while preserving `service_role`. This is a **staged, not yet authorized-to-apply** migration until every original external caller, schedule, role and rollback owner has been verified. Do not merge a cutover just because tests are green when external-call evidence is incomplete.
- Preflight: compare original Git migration history and provider pg_proc ACL, source search, all owned Netlify project environment *key names only*, native pg_cron command references, limited provider request/statistics evidence. Missing evidence remains UNKNOWN, never "zero callers."
- Apply only via canonical protected Supabase migration authority after consumer migration. Then verify denied `anon` and `authenticated` EXECUTE, positive original service-role execution with proper credential, no cron failures/regressions, zero native advisor warning, and consistent append-only migration history. Keep a tested rollback prepared; do not disable canonical daily executors.
- Retain the unrelated Netlify private archive access failures as open incidents until *dashboard* visibility change and provider plus unauthenticated-denial proof. Source control alone cannot close project visibility.
- Original failure fingerprint: `supabase-security|external-cron-reconcile|anon-definer-rpc-advisor-warn|v1`. Regression `tests/brain-security-external-cron-service-role-20261102.test.mjs`; user/customer trust reports distinguish candidate, deployed and verified.
