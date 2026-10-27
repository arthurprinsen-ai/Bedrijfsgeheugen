# Development ledger — LinkedIn company fresh organization OAuth

Date: 2026-10-06
Obligation-ID: linkedin-company-fresh-org-oauth-terminal-20261006
Delivery-Lane: automation
Candidate-Type: recovery

Observed terminal production state:
- personal LinkedIn already has a provider-created share and must never be republished;
- LinkedIn company provider create succeeded as `urn:li:share:7513196691630575616`;
- exact organization author is `urn:li:organization:18234216`;
- the durable fresh OAuth account is bound and fresh;
- organization-admin and organization-write proof are true;
- raw commentary differs because LinkedIn shortened the measurable URL and escaped parentheses;
- normalized commentary is an exact canonical match;
- `content_publication_obligations.linkedin_company = LIVE_PROVEN`;
- `provider_truth_verified=true`;
- `republish_forbidden=true`.

Production-normalization evidence:
- expected text SHA-256: `e4353e8fb028c097751b76c57b9a93e466b014fa5d7990512e7c6dc04f2f7f0a`;
- observed text SHA-256: `e3511ed41ef010e9376d34a515b93a638002c40e5a4aab5c041ef1559e604ee8`;
- normalization rule: `MEASURABLE_URL_TO_LNKD_IN_PLUS_LINKEDIN_PAREN_ESCAPE`;
- terminal reconciliation reason: `LINKEDIN_PROVIDER_NORMALIZATION_EXACT_MATCH`.

Source parity candidate:
- copies production setup v23 exactly;
- copies production content-loop v31 exactly;
- copies production social-publisher v115 exactly;
- preserves no-republish and same-claim idempotency.

Terminal sequence:
exact-HEAD gates -> protected merge -> production source/readback equality -> TERMINAL_GREEN / LIVE_PROVEN.
