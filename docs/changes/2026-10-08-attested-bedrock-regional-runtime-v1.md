# AWS Bedrock customer AI runtime — region-pinned implementation (2026-10-08)

This is an incremental #4152 extension of the existing tenant-bound, HMAC-attested
`/api/tenant-ai-inference` route. It adds one AWS Bedrock Converse provider adapter,
**not** a provisioned customer AWS account.

## Scope
- Existing Identity-derived tenant, saved customer deployment policy, exact policy version,
  customer consent, immutable One Brain cross-domain change impact and independently
  CLEARED privacy/security/supplier/finance/CSRD-ESRS approval all remain mandatory.
- Exact signed proof plus server-only provider registry must agree on model, processing
  region, AWS physical region, provider readback and egress / residency evidence.
- AWS regional `bedrock-runtime.<region>.amazonaws.com` Converse HTTPS transport,
  SigV4 `bedrock` service signing with short-lived STS credentials, no browser credentials.
  Initially allowlisted physical regions: `eu-central-1`, `eu-west-1`, `us-east-1`.
  These are technical endpoint restrictions; they do **not** by themselves attest data
  residency, subprocessor behavior, contractual terms, or provider processing.
- Only explicitly allowlisted direct foundation model IDs (Anthropic, Amazon and Mistral
  model-id families). Reject `eu.`, `us.`, `global.` inference profile IDs, custom endpoints,
  cross-region inference, private endpoint claims and unsupported API response shapes until
  independently verified.
- Redirects blocked, 12s bounded call, zero retries and zero cross-provider fallback.
  Fail closed on missing consent, profile/endpoint/proof mismatch, stale STS, revoked
  receipts, unsupported region/model or missing governance clearance.
- Existing Anthropic, Azure OpenAI, Mistral and Google Vertex routes remain unchanged.
  Existing ON_PREMISE/AIR_GAPPED local-only executor remains separate.

## Server-only operation contract
- Independent provisioning authority must verify a *real* customer AWS account, IAM role,
  allowed model, terms, actual Bedrock region, data processing/residency, outbound traffic
  enforcement and cost agreement **before** signing a short-lived proof.
- Store STS `accessKeyId`, `secretAccessKey`, `sessionToken`, `credentialsExpireAt`,
  `awsRegion`, `modelReadbackRegion`, `processingRegion`, `modelId`, `endpointId`,
  `providerReadbackEvidenceId`, `residencyEvidenceId`, `egressEvidenceId` in the
  existing server-owned `BG_TENANT_AI_VERIFIED_RUNTIME_REGISTRY` for that Identity tenant,
  never on the client. Session expiry needs enough headroom for a 12-second request.
- Signed proof must additionally contain the same `awsRegion`, matched tenant,
  approved use-case, policy version, model and region. Signing a payload is **not** by
  itself evidence of AWS verification.
- Do not grant the app open-ended model access; constrain IAM to a verified account,
  region, model and Converse action. Provider fees require explicit customer approval.
- The gateway currently handles bounded plain-chat prompts only; authorized tenant RAG
  and storage, spending metering, lifecycle/rotation, disaster recovery and production
  customer testing remain independent acceptance requirements.

## Evidence and release boundary
- Automated tests: `tests/brain-attested-bedrock-regional-adapter-v1.test.mjs`;
  covers SigV4 format, exact host/model, denial paths, signature, server approvals, failed
  provider, no fallback and bad responses using simulated provider transport.
- This PR does not claim successful real AWS inference, installed customer infrastructure,
  qualified GDPR or CSRD compliance, approved residency, or a customer acceptance run.
- Keep #4152 open for authenticated production tenant save/readback and actual provider-origin
  receipts, network-egress denial testing, billing controls and on-prem/air-gap field trials.
