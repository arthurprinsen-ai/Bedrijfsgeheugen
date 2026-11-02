# AI Koppeling Studio — bewezen veiligheidschecks, niet alleen groen (2026-11-02)

Obligation: `portal-connector-trust-gates-20261102-v1`. Fingerprint: `portal|connectors|upstream-secret-leak-and-no-tenant-trust-evidence|20261102-v1`. Original P0 #4215.

## Aangetoonde oorzaak
The original connector API returned and persisted upstream `error.message`, `error.code`, `failedStage` or source `executionId` unfiltered. Third-party APIs may include tokens, internal URLs or PII in exceptions, causing avoidable disclosure. The Studio also had no per-connector proof panel, so a configured provider may be mistaken for real, safe data ingress. Supabase original connector definitions/executions/reviews: 0/0/0 observed in the original preflight; no customer provider data loaded.

## Correctie
The original backend now maps provider failure codes and stages through allowlists before persisting `connector_executions`, recovery obligations or returning client responses; raw error message and provider execution ids never become public. Original tenant-bound read route `/api/connectors/:id/trust` exposes strictly static, secretless checks and interprets a persisted provider **test** for the exact definition version separately from real record ingestion. Original wizard presents that report via safe `textContent` and accessible customer action. Never invent a security score or independent audit.

## Verplichte voorwaarden voor aantoonbaar veilige live koppeling
1. Provider authenticator supports OAuth authorization code with PKCE/state where applicable, least-privilege scopes, secret-vault storage, key/token rotation and actual revoke.
2. Private network access blocked against SSRF; signed HMAC webhooks require timestamp/replay protection; outbound hosts and redirects allowlisted; provider throttling and bounded retries.
3. Every read/write is authenticated and tenant-scoped; RLS defense-in-depth, BOLA/IDOR tests with two real tenants and security abuse cases.
4. Document schemas and field mapping validated; PII minimized; input sanitized; no untrusted code evaluation, SQL or arbitrary external URLs.
5. Source receipt, immutable version, idempotency key, canonical encrypted record storage, outbox/consumer ACK and independent target-readback.
6. Data classification, data retention, deletion/export, provider unsubscribe/revoke and verified purge; logs redact secrets.
7. Exact processor/storage/model region and subprocessors with evidence; declared EU preference alone is not proof.
8. Only actual persisted opted-in data yields charts/KPIs; dashboard shows source timestamp, owner, confidence, freshness, quality and correction action. Brain/Powerhouse requires separate customer AI opt-in.
9. Independent SCA/CodeQL/DAST, actual authenticated browser and recovery drills. Critical findings block deployment.
10. WCAG 2.2 AA, usability measurement, well-organized progressive user journey, 320px/200% zoom and judged Red Dot criteria. Aesthetic claims require human assessment.

## Afsluiting
Code tests and secure source/production deployment are separate from provider-readback, compliance and award verification. Keep original P0 #4215 and the exact symptoms/corrective proof in the original Brain/incident lineage. Do not add second connector store, publisher or scheduler.
