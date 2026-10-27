# Social daily publication no-gap recovery — activity ledger

Date: 2026-10-06  
Obligation: social-daily-publication-no-gap-20261006

Observed before #3823:
- personal LinkedIn had no provider-side publication on 2026-10-06; latest observed post was 2026-10-05 09:33 Europe/Amsterdam;
- canonical Instagram @bedrijfsgeheugen.nl had no provider-side media on 2026-10-06;
- the Netlify social-delivery recovery supervisor ran only once per hour.

#3823 implemented:
- preserve the canonical social publisher as the only provider writer;
- increase Netlify recovery cadence to every ten minutes;
- invoke recovery after a production deploy.

Follow-up observation after #3823 reached production:
- production deploy eca2e35fecdec55e5d03b62a6b58bd0c1de6cf0f was ready;
- Netlify reported `social-publication-delivery` scheduled at `*/10 * * * *`;
- provider readback still showed no 2026-10-06 personal LinkedIn post and no 2026-10-06 canonical Instagram media;
- code inspection proved the recovery supervisor called only `powerhouse-social-publisher`;
- the publisher accepts only existing `content_ready` decisions/artifacts, so a missed generation/orchestration stage could not self-heal.

Follow-up implemented in #3827:
- recovery enters through existing `powerhouse-content-loop`;
- the content loop remains the single end-to-end owner for generation, gates, dispatch and reconciliation;
- fresh delivery state is read only after that loop completes or returns bounded non-terminal state;
- regression coverage enforces `content-loop -> delivery_context -> provider readback`.

Safety:
- no second LinkedIn/Instagram writer;
- no Buffer fallback becomes canonical;
- daily uniqueness, one-time publication capabilities, exact identity/content gates and provider readback remain authoritative;
- a bounded AMBER/RED content-loop response does not create a duplicate writer; it remains observable non-terminal state;
- protected checks and auto-merge remain mandatory.

Terminal condition:
merge is not completion. Close only after production deploy and provider-side readback prove today's required publication outcome without duplicates.

Candidate binding:
- base main: eca2e35fecdec55e5d03b62a6b58bd0c1de6cf0f;
- PR: #3827;
- candidate branch: fix/social-recovery-content-loop-v2.
