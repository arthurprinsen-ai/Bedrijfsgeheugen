# LinkedIn company fresh organization OAuth terminal closure

Date: 2026-10-06  
Obligation: linkedin-company-fresh-org-oauth-terminal-20261006

## Problem

The company publication path had two production false negatives. First, stale OAuth candidate state could outrank the durable fresh organization-OAuth proof. Second, exact readback used raw string equality although LinkedIn normalizes published commentary by shortening the measurable URL to `lnkd.in` and escaping punctuation such as parentheses.

## Structural fix

- bind the exact durable fresh organization-OAuth account before stale candidate/alias/default discovery;
- verify the canonical Bedrijfsgeheugen ADMINISTRATOR ACL and organization scopes on that exact lineage;
- derive the OAuth principal from canonical setup state rather than a legacy hardcoded person id;
- keep provider side effects exclusively in `powerhouse-social-publisher`;
- mark organization write verified only after a real provider create;
- verify company readback by exact post URN, exact organization author, PUBLISHED lifecycle and normalized commentary equality through `powerhouse_normalize_publication_text_v1`;
- tolerate only provider normalization, not content drift;
- keep `PUBLISHED` non-terminal until fresh OAuth/admin/write plus provider truth are all proven;
- never issue a replacement post after provider-create acknowledgement.

## Production proof

- provider post: `urn:li:share:7513196691630575616`;
- organization author: `urn:li:organization:18234216`;
- terminal obligation: `LIVE_PROVEN`;
- provider truth: true;
- fresh company OAuth: true;
- organization admin proof: true;
- organization write proof: true;
- provider normalization proof: `MEASURABLE_URL_TO_LNKD_IN_PLUS_LINKEDIN_PAREN_ESCAPE`;
- observed short URL: `https://lnkd.in/e-wE3FcK`;
- republish remains forbidden.

## Runtime authority

- `powerhouse-composio-linkedin-setup` production v23;
- `powerhouse-content-loop` production v31;
- `powerhouse-social-publisher` production v115.

Already-applied production SQL remains non-executable evidence under `docs/production-sql-history/`.
