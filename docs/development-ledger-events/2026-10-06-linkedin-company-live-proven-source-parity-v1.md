# Development ledger — LinkedIn company LIVE_PROVEN parity

Date: 2026-10-06
Obligation-ID: linkedin-company-live-proven-source-parity-20261006
Delivery-Lane: automation
Candidate-Type: recovery

Production truth before source writeback:
- linkedin_personal: existing provider side effect; never republish;
- linkedin_company: provider side effect exists at `urn:li:share:7513196691630575616`;
- linkedin_company provider create acknowledgement: true;
- linkedin_company provider truth: true;
- fresh organization OAuth: true;
- organization-admin OAuth proof: true;
- organization-write verification: true;
- publication obligation: LIVE_PROVEN;
- instagram_company remains a separate hold and is not part of this source-parity closure.

Runtime authorities captured byte-for-byte:
- powerhouse-composio-linkedin-setup v23;
- powerhouse-content-loop v31;
- powerhouse-social-publisher v115.

Database forward reconciliation:
- same claim + identical normalized hash is idempotent;
- different normalized hash remains blocked;
- expired unconsumed capability leases are reclaimable;
- consumed capabilities remain non-republishable daily fences.

Provider readback contract:
- exact post URN;
- exact organization author;
- exact PUBLISHED lifecycle;
- raw commentary equality OR exact equality after the canonical publication normalizer;
- no fuzzy/semantic threshold for terminal truth.

Terminal sequence for this candidate:
exact current-main snapshot -> exact-HEAD gates -> protected merge -> protected-main Supabase promotion/readback -> source bytes equal production authority.
Provider publication is already terminal; do not rerun publication.
