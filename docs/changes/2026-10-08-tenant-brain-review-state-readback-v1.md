# Tenant AI/CSRD change: canonical Brain obligation readback

The existing `data_sovereignty_get` call now projects the status of the one canonical Brain obligation corresponding to the authenticated tenant's latest material AI, model, connector, cloud or residency policy change. The EU Supabase authority enforces exact tenant and change identity; wildcard tenant lookups and unfenced table scans are forbidden.

This is a **status-only** projection: state, last update time, `evidenceRequired`, `verifiedOutcome=false`, `aiRuntimeApproved=false`, `csrdApplicability=UNDETERMINED`. No actor/email, tenant evidence payload, prompt, regulatory decision or cross-tenant record is returned. If no source proof exists, the status stays UNVERIFIED/NOT_REGISTERED. Unchanged policy edits do not invalidate the prior material review.

No independent scheduler, review queue or new Brain table is created. Real authenticated end-to-end customer readback and sign-off authority remain separate.

Regression: `tests/brain-tenant-sovereignty-review-readback.test.mjs`.
