# Exact migration-history mirror recovery

Obligation-ID: database|exact-remote-migration-mirrors|20261020
Parent-P0: #4215
Dependency: #4540
State: REVIEW_CANDIDATE / NOT_LIVE

Observed production provider check after merge 9535f80c80f73c5857e8b684f2854f42e0cb0867: `Remote migration versions not found in local migrations directory`. Bounded comparison: 730 provider versions; source lacked 20261020104501/20261020104518. Exact stored SQL for both was independently retrieved and compared; both match protected source 20261020124500 by SHA-256 895c2c9e46d72c811bd6bed9639e73562fe8f4fabeba6eecc69e76bdc43f34df. One provider detail query and a retry timed out; catalog SELECT then succeeded. No production history mutation or DDL was attempted.

Repair: preserve original source and mirror both real provider versions, add red-first exact-byte regression and canonical Brain learning/change note. Same existing Git integration authority; no new scheduler or parallel migration executor. Historical source mirrors require normal protected gates. Production acceptance and broader #4215 outcomes remain pending.

Protected admission caught missing structured compiler metadata in the new learning record (`LEARNING_FAILURE_CLASS_REQUIRED`). Added explicit DATABASE/SCHEMA_DRIFT classification and observed test evidence; both learning canonicalization and semantic material-writeback closure then passed locally. Preserve the admission gates and rerun on the corrected head; no gate exception or protection change.
