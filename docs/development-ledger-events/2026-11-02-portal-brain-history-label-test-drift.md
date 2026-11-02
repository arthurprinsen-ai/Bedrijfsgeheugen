# 2026-11-02 — bronlabel en historische testdrift na #5282
Incident: `powerhouse|brain|portal-historical-backend-label-stale-after-zero-projection|20261102-v1`.
Original parent issue #4439, original BRAIN #41433667027/backend #125238718390; new protected main `295c12ab94303af30b9b9fc30207d15ecf88db1e`.
Failing test #3050 asserted old label although Portal source now deliberately distinguishes historical failed run from later registered zero. Zero cannot be painted provider-verified by owner-only registry API.

Change: one original historical test file, original agent skill, machine learning, human docs. Regression checks two explicit labels, escaped external proof, and preserves source-backed historical red. Candidate only; Required/CodeQL/full original BRAIN and post-merge no-recurrence still pending. No app runtime, database, publisher, deployment or customer records changed.
