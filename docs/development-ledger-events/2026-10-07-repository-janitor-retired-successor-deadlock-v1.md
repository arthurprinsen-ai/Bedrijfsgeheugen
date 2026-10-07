# 2026-10-07 — Repository Janitor retired-successor deadlock recovery v1

Obligation: repository-janitor-retired-successor-deadlock-20261007-v1

Observed evidence:
- Powerhouse Repository Janitor run 37595314458 attempt 1 stopped at `TERMINAL_LEASE_SUCCESSOR_AMBIGUOUS` for #3928 because three explicitly retired PRs were still open;
- manually closing those PRs was not durable because attempt 2 auto-reopened retired terminal leases;
- attempt 2 then stopped on #3953 with the same false-ambiguity class before stale Actions cleanup could run;
- the nine 12 September queued runs therefore remained unreachable by the Janitor despite existing cancel, force-cancel and delete-fallback logic.

Installed prevention:
- retired open PRs are not active successors;
- merged same-obligation successors satisfy old terminal leases;
- multiple real active successors still fail closed;
- stale Actions escalation and branch safety checks are unchanged;
- regression coverage is part of the same delivery lineage.
