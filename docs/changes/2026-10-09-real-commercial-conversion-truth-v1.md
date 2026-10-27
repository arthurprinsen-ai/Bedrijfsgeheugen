# P0 #4198 — verified commercial conversion truth

## Proven defect
The existing `powerhouse_sales_outcome_close_loop_v2` trigger marked zero-revenue `not_executed`, `execution_completed`, `sent`, `no_response`, `no_reply_observed`, `reply_received` and negative objection events as realized `conversion=1`, and inserted false `growth_outcomes.stage='lead'`. Production readback: 1,349 false derived lead rows and 1,349 false realized conversion rows, including 1,254 not-executed activities. These are NOT sales opportunities and must not count toward the EUR 1M actual revenue goal.

## Canonical repair
In the existing trigger, return immediately for non-economic/unqualified events, leaving original `powerhouse_sales_outcomes` rows and the independent message-learning trigger intact. Explicitly qualifying external actions (e.g. verified submitted scan, qualified lead, booked meeting, won order) and actual positive revenue may flow through the existing commercial conversion path. Reconcile only derived invalid growth and realized-value rows linked to original raw outcome IDs, without deleting the raw outcome or append-only decision cycle event. Persist source-scoped reconciliation counts in existing `bg_gezondheid`. Migration can safely replay.

## Release and proof
GitHub protected Required, CodeQL, Supabase Preview, protected main merge, production database migration readback, zero remaining false derived conversions, idempotent rerun, future noncommercial event rejection, and independent provider proof for any claimed market response and realized EUR. Do not infer revenue from sends, no response, internal task completion or test records. Parent P0 stays OPEN without complete channel and predictive evidence.
