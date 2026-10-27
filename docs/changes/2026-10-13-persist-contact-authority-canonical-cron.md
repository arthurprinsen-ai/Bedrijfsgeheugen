# Production repair: persist original cron attachment

The canonical contact-authority evaluator is attached to existing `powerhouse-identity-graph-v1` cron job rather than adding a new cron, publisher or worker. The production change was applied before this source-control record and verified by reading back `cron.job` and the existing enrichment ledger.

Four independent bounded 500-contact calls run on each existing quarter-hour tick. Missing approval remains `AUTHORITY_REVIEW_REQUIRED`; suppressions and contact pressure remain enforced and no send permission is granted.

Acceptance boundary: daily coverage and provider-confirmed email/LinkedIn-DM delivery must be verified separately. Today’s `COMMERCIAL_EXECUTION` obligation is fulfilled by previously verified company LinkedIn publication only; this wiring is not itself an additional commercial send.
