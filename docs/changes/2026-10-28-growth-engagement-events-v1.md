# Measure reading depth, visible time and exit (rebuilt on main)

Rebuilt on current main after #5024 was squash-merged. Only the engagement change is in this branch.

Adds `scroll_depth` (25/50/75/100 %, once each) and `page_exit` (visible seconds, once per page view, highest scroll depth in engagement_reason) from the existing inline script. Server allowlist extended; `value` accepted only when numeric 0..86400 and forwarded to the data hub. No cookie, identifier, PII, collector or schedule.
