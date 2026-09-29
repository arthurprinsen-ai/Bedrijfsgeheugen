# LinkedIn company organization ID normalization

Date: 2026-09-29  
Fingerprint: `linkedin-company-org-id-normalization-v1`

## Problem

The canonical Bedrijfsgeheugen LinkedIn OAuth connection was healthy and held both `r_organization_admin` and `w_organization_social`. LinkedIn's organization lookup returned the managed Bedrijfsgeheugen organization as numeric id `18234216`, while the publisher validated only by searching for the full string `urn:li:organization:18234216`.

That representation mismatch caused a false `LINKEDIN_COMPANY_REAUTH_REQUIRED` result even though the organization capability itself was valid.

## Fix

The company selector now derives the canonical organization id from the URN and accepts either representation in provider evidence:
- `urn:li:organization:18234216`
- `18234216`

No new publication path is introduced. The existing `powerhouse-social-publisher`, publication authority, semantic uniqueness gate and current daily claim remain canonical.

## Prevention

Provider identity comparisons must normalize equivalent external identifier representations before capability rejection. A missing optional readback scope must not be confused with missing organization write capability.
