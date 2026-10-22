# Consolidate delivery evidence normalization

On 11 October, two independent POWERHOUSE recovery changes had both installed a JSON evidence normalizer on the same existing channel-decision table. Reconciliation retains the canonical normalizer that was already merged to protected main and teaches it to handle nested JSON strings and a known two-part malformed object representation.

The duplicate repair trigger is removed. The original service-role-only execution permissions and existing delivery/authorship guarantees remain intact. No email, DM or social publication is triggered by this migration.

Production verification must confirm exactly one active canonical normalizer and that all current-day channel decisions carry JSON objects. P0 #4198 remains open until actual external sends, posts and Brain learning outcomes are verified.
