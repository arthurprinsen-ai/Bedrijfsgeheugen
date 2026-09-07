# Portal Next Generic Connector Builder — Design

Date: 2026-09-07
Status: design approved in chat; written specification pending final user review
Branch: `feature/portal-next-generic-connector-builder`

## 1. Purpose

Build a native **Data & Koppelingen Builder** inside Portal Next that lets a tenant define, test, activate, and monitor document/data integrations without hardcoding AFAS or a single document type.

The first reusable template is based on the earlier **AFAS Document Intake** pattern:

`mailbox -> document/PDF extraction -> classification -> field extraction -> database lookup/validation -> human review when needed -> AFAS target mapping -> write -> readback/evidence`

The builder must generalize this to other sources, document types, lookup databases, transformations, and target systems.

## 2. Core product rule

A user determines:

1. **where data comes from**;
2. **what document/data type it is**;
3. **which fields must be extracted**;
4. **which database/reference data is used to validate or enrich it**;
5. **how source fields map to target fields**;
6. **where the data goes**;
7. **which validation, confidence, approval, and runtime rules apply**.

No connector may be shown as **Active** unless runtime evidence proves the configured flow has passed its activation contract.

## 3. Initial source types

The architecture must support source adapters, starting with:

- Email / shared mailbox
- Direct file upload
- SharePoint / Teams document library
- API request
- Webhook
- SFTP/file drop
- Database record/event

Email must support attachments, especially PDF documents.

## 4. Document types

Document schemas are tenant-configurable. The UI ships with templates but does not constrain the user to them.

Initial templates:

- Purchase invoice / inkoopfactuur
- Sales invoice / verkoopfactuur
- ISO certificate
- ISO audit/report
- Purchase order
- Delivery note / pakbon
- Contract
- HR document
- Wage garnishment / loonbeslag
- Quote / offerte
- Expense claim / declaratie
- Generic/custom document

A tenant can create a custom document type and define its own fields.

## 5. Extraction schema

Each document type has a versioned extraction schema.

For every field the tenant can define:

- field key
- human label
- data type: string, number, currency, date, boolean, identifier, array
- required/optional
- extraction instruction / semantic description
- example values
- normalization rules
- confidence threshold
- fallback/default value
- whether human review is mandatory below a threshold

Example purchase-invoice fields:

- supplier_name
- supplier_number
- invoice_number
- invoice_date
- due_date
- purchase_order_number
- subtotal
- vat_amount
- total_amount
- currency
- iban
- project_code
- cost_center

Example ISO-certificate fields:

- organization_name
- standard
- certificate_number
- scope
- issuer
- issue_date
- expiry_date
- sites
- status

## 6. Recognition and classification

Incoming files are classified before extraction.

The system stores:

- detected document type
- confidence
- extraction schema version
- classifier/extractor version
- timestamp
- source evidence

A tenant may define deterministic routing rules before or after AI classification, for example sender domain, mailbox, filename pattern, subject line, MIME type, or known supplier.

AI classification must never silently override an explicit deterministic tenant rule.

## 7. Database lookup and enrichment

A mapping can reference one or more lookup sources to validate, enrich, or route extracted data.

Examples:

- supplier name -> supplier ID
- employee name -> employee ID
- project reference -> project ID
- ISO certificate organization -> registered company
- invoice purchase order -> existing PO
- article code -> ERP item

Supported lookup-adapter contract:

- Supabase/Postgres
- SQL database
- AFAS GetConnector
- Exact API
- REST API
- static tenant lookup table

Lookup rules support:

- exact match
- normalized exact match
- fuzzy match
- multi-key match
- not-found handling
- duplicate/ambiguous-match handling
- confidence score

Ambiguous or unsafe matches must enter review; they must not be auto-written.

## 8. Mapping and transformation

The builder exposes source-to-target mappings.

Each mapping row can contain:

- extracted/source field
- optional lookup/enrichment result
- transformation
- target field
- required flag
- validation rule
- sample/preview value

Transformations include:

- trim/case normalization
- date formatting
- decimal/currency conversion
- code lookup
- concatenation/splitting
- constants/defaults
- conditional mapping
- simple formulas

Complex transformations run server-side under a controlled transformation contract; arbitrary browser JavaScript is not accepted.

## 9. Target systems

Target adapters must use a common server-side interface.

Initial targets:

- AFAS
- Exact Online
- Supabase/Postgres
- SQL database
- SharePoint
- Datahub / internal Bedrijfsgeheugen store
- REST API
- Webhook
- Make
- Power Automate

For AFAS, the first reusable template models the earlier Document Intake pattern and supports GetConnector/UpdateConnector usage, including `KnSubject` where applicable.

No credentials, tokens, connector secrets, tenant secrets, or raw auth headers are stored in client-visible configuration.

## 10. Human review

Review is a first-class stage, not an error workaround.

A connector can require review when:

- classification confidence is below threshold;
- extraction confidence is below field threshold;
- required data is missing;
- lookup is ambiguous/not found;
- validation fails;
- amount/risk exceeds a tenant rule;
- the target action is classified as requiring approval.

The review screen shows:

- original document/source metadata
- extracted fields
- confidence per field
- lookup matches
- proposed target payload
- validation failures/warnings
- editable corrections where allowed
- approve/reject/retry actions

Corrections become traceable outcome/learning data; they are not silently discarded.

## 11. Builder UX

Portal Next `Data & koppelingen` adds a primary action **Koppeling bouwen**.

Wizard stages:

1. **Bron** — choose source adapter and source configuration.
2. **Document/data type** — choose or create a schema.
3. **Velden** — define what must be extracted.
4. **Database & matching** — configure validation/enrichment lookups.
5. **Mapping** — map source/enrichment fields to target fields.
6. **Doel** — configure the target adapter/action.
7. **Review & regels** — confidence, validation, approval policy.
8. **Test** — run test data through the complete pipeline without unsafe production writes.
9. **Activeren** — only available when the activation contract is satisfied.
10. **Monitoren** — runtime health, failures, evidence, outcomes, retries, review queue.

Desktop and mobile must support the complete flow. The UI must not rely on hover-only controls.

## 12. Template: Email PDF -> AFAS Document Intake

The first template is named **E-mail PDF -> AFAS Document Intake**.

It preconfigures:

- source: email/shared mailbox
- accepted attachment: PDF
- classification stage
- configurable extraction schema
- optional SharePoint/archive step
- configurable review gate
- AFAS lookup adapter
- AFAS target adapter
- `KnSubject` target profile where selected
- runtime readback/evidence

The older naming is preserved in metadata for discoverability:

- Solution pattern: `AFAS Document Intake`
- Flow pattern: `PA - Intake - Loonbeslag Email to AFAS`
- Review pattern: `AFAS Document Intake Review`

The product UI must not imply that the new builder depends on Power Automate. Power Automate is one possible execution adapter; the canonical configuration belongs to Bedrijfsgeheugen.

## 13. Template: Purchase invoice

A purchase-invoice template demonstrates:

`email/upload -> PDF -> invoice extraction -> supplier/PO/database validation -> mapping -> AFAS/Exact/other target -> evidence`

User chooses both the fields and the destination.

It must support invoice-specific rules such as:

- duplicate invoice detection
- supplier match
- PO match
- amount and VAT validation
- currency
- approval threshold
- target ledger/project/cost-center mapping

## 14. Template: ISO document

An ISO template demonstrates:

`email/upload/SharePoint -> PDF -> ISO certificate/audit classification -> field extraction -> company/certificate database lookup -> chosen target/database -> evidence`

User-defined fields may include standard, certificate number, scope, issuer, issue/expiry date, sites, audit findings, owner, and status.

The system must support alertable dates such as certificate expiry without presenting an alert as active until a real schedule/runtime contract exists.

## 15. State model

Connector configuration lifecycle:

- Draft
- Configured
- Test failed
- Test passed
- Awaiting approval
- Ready to activate
- Active
- Degraded
- Paused
- Error
- Retired

Important rule: `Configured` is not `Active`.

Activation evidence must include at minimum:

- configuration version
- test execution ID
- source/read success
- extraction result
- validation result
- target dry-run or safe test result
- activation timestamp and actor/agent

Runtime success evidence must include an immutable execution reference.

## 16. Execution record

Every processing attempt gets a tenant-scoped execution record containing:

- connector ID/version
- source event/document reference
- source hash/dedupe key
- detected type
- extracted field values plus confidence
- lookup evidence
- transformation/mapping result
- validation result
- review state
- target request reference (redacted)
- target response/result
- start/end timestamps
- outcome state
- error class/root-cause metadata
- retry lineage

Sensitive values must be redacted from logs where required.

## 17. Idempotency and duplicate prevention

A connector must support a tenant-defined dedupe key.

Default document dedupe can combine:

- attachment/file content hash
- source message ID
- invoice/document number
- supplier/customer identifier

A retry must not create duplicate target records unless the target action is explicitly configured as non-idempotent and the user acknowledges the risk.

## 18. Failure and self-healing

Failure lifecycle follows the Bedrijfsgeheugen closed-loop rule:

`detect -> classify -> contain -> root cause -> minimal safe recovery -> regression check -> replay/retry -> runtime readback -> prevention/learning`

Automatic retry is allowed only for retry-safe error classes, with capped backoff and dedupe.

Authentication, mapping, ambiguous lookup, validation, schema mismatch, and permission errors do not loop indefinitely; they create actionable recovery obligations.

## 19. Tenant/security boundary

- Browser query parameters never authorize tenant access.
- Connector configs are tenant-scoped server-side.
- Secrets are server-side only.
- Every config/read/write action requires authenticated tenant context.
- A user may only see/run connectors for their authorized tenant.
- Review and activation actions are auditable.
- Production writes may require an explicit role/policy.

## 20. Data model

Recommended conceptual entities:

- `connector_definitions`
- `connector_versions`
- `connector_source_configs`
- `document_schemas`
- `document_schema_fields`
- `connector_lookup_rules`
- `connector_mappings`
- `connector_validation_rules`
- `connector_target_configs`
- `connector_review_policies`
- `connector_executions`
- `connector_execution_fields`
- `connector_evidence`
- `connector_reviews`
- `connector_recovery_obligations`

Existing project/offer integrations remain readable. The builder adds execution configuration; it does not overwrite offer-derived planning records.

## 21. API boundary

Portal client uses authenticated server endpoints such as:

- `GET /api/connectors`
- `POST /api/connectors`
- `GET /api/connectors/:id`
- `PUT /api/connectors/:id/draft`
- `POST /api/connectors/:id/test`
- `POST /api/connectors/:id/activate`
- `POST /api/connectors/:id/pause`
- `GET /api/connectors/:id/executions`
- `GET /api/connectors/review-queue`
- `POST /api/connectors/reviews/:id/decision`

Names can be adapted to repository conventions, but the security and state boundaries are mandatory.

## 22. Test strategy

TDD is required.

Minimum regression coverage:

### Model/contract tests
- arbitrary custom document schema
- purchase invoice template
- ISO template
- email->AFAS template
- source and target are independent choices
- mapping supports custom fields
- lookup ambiguity fails closed
- no secret fields in client payload
- active state requires evidence
- dedupe/idempotency

### Server/API tests
- tenant isolation
- unauthenticated request denied
- wrong tenant denied
- create/update draft
- test execution
- activation rejected without passing evidence
- activation accepted with evidence
- execution/readback stored
- review required path
- safe retry path

### UI tests
- build wizard complete on desktop
- complete on mobile
- custom field add/edit/remove
- template prefill but editable
- mapping UI
- database lookup config
- test preview
- fail-closed errors
- evidence/status view

### Release gates
- Portal Native Regression Tests
- Required test / portal production contracts
- Business OS Live Preview desktop/mobile
- BRAIN delivery / learning contract where material
- Netlify deploy preview ready
- production readback after merge

## 23. Non-goals for first release

The first release does not need to implement every external vendor adapter at production depth.

It must, however:

1. establish the generic connector/configuration/execution contracts;
2. deliver the full native builder UX;
3. make Email/PDF -> AFAS the first executable template where existing runtime/credentials permit;
4. include purchase-invoice and ISO document schemas as reusable templates;
5. allow arbitrary user-defined fields and source->target mappings;
6. keep unsupported adapters explicitly `not configured` rather than simulating runtime success.

## 24. Acceptance criteria

The feature is accepted when a tenant can:

1. open Portal Next -> Data & koppelingen;
2. choose **Koppeling bouwen**;
3. start from Email PDF -> AFAS, purchase invoice, ISO, or blank template;
4. choose/change source;
5. create/edit extraction fields;
6. configure database lookup/enrichment;
7. map any resulting data to a chosen supported target;
8. define validation/confidence/review rules;
9. run a safe end-to-end test;
10. see field-level test results and proposed target payload;
11. activate only after evidence passes;
12. monitor real executions, failures, reviews, and evidence;
13. never see fabricated `Active`/success state.

## 25. Product continuity

This module must be native to the screenshot-led Portal Next design and must preserve the existing project/offerte Koppelingen information. The page should distinguish clearly between:

- **Geplande koppelingen** from project/offerte scope;
- **Gebouwde koppelingen** with configuration/runtime state;
- **Templates** available to build.

This avoids conflating commercial planning with operational runtime truth.
