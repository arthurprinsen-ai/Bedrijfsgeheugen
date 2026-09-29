# 2026-09-29 — LinkedIn company org-id normalization

Fingerprint: `linkedin-company-org-id-normalization-v1`

## Root cause
LinkedIn returned the Bedrijfsgeheugen organization as numeric id `18234216`; the publisher expected only the full organization URN.

## Change
- normalize organization identity in `powerhouse-social-publisher`;
- preserve the existing canonical organization `urn:li:organization:18234216`;
- preserve the existing 2026-09-29 company publication claim;
- do not introduce Buffer, Make, a replacement post, or a parallel publishing route.

## Verification target
Healthy organization-scoped OAuth with `r_organization_admin` + `w_organization_social` must pass company preflight and allow the existing company claim to progress to one provider create.
