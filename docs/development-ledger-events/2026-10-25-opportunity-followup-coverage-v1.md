# Commercial opportunity follow-up gap — 25 October 2026

- Canonical P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Candidate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4895
- Fingerprint: `commercial|opportunity|no-next-action-date-or-overdue|20261025-v1`
- Observed read-only production: 838 opportunities, 837 open; 618 NULL next-action dates; 219 overdue; zero future-dated; 219 never acted; 6,808 historical expired actions.
- Existing components: `growth-intelligence-daily`, `brain/revenue/commercial-opportunity-qualification.mjs`, `powerhouse_opportunities`, `revenue_learning_obligations` and `brain_records`.
- Failure: no mandatory persisted next action in the daily opportunity assessment. A missing commercial qualification initially escaped the uncovered counter in the new planner; canonical regression caught and fixed it.
- Preventive control: max 24 review plans/run; fair allocation, deterministic obligation IDs, no unsolicited provider sending, no invented monetary value, no contact suppression bypass, guarded opportunity-date writeback, explicit remaining backlog.
- Tests: `tests/brain-opportunity-followup-coverage-20261025.test.mjs` and `tests/brain-commercial-opportunity-daily-integration-20261025.test.mjs`.
- Initial CI: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40199076882 (missing PR metadata); https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40199324338 (learning schema absent); https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40199599884 (uncovered-count regression); https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40199708061 (integration closure artifacts absent).
- Follow-up proofs pending: exact-head Required/CodeQL, protected merge, production run with durable PostgREST response/readback and measurable drop of missing/overdue follow-ups.
- Terminal classification: `CANDIDATE_NOT_LIVE` until all evidence arrives; internal planning is not execution and not revenue.
