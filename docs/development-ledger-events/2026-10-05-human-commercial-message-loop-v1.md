# 2026-10-05 — Human commercial message loop v1

- Type: IMPROVEMENT / SALES_INTELLIGENCE / COPY_QUALITY
- Fingerprint: `powerhouse|human-commercial-message-loop|v1`
- Existing state: Powerhouse already had identity, intent, NBA, relationship intelligence, provider executors, outcomes, attribution and learning. Sales/copy knowledge existed in Notion and parts of runtime but message strategy was often empty/unknown.
- Root cause: sales plays, persuasion rules, human tone and message quality were not mandatory runtime inputs for every commercial action.
- Fix: canonical sales playbook + persuasion authority + message composer + exact-hash quality gate + outcome lineage + strategy performance learning.
- Execution boundary: Gmail and SalesRobot both fail closed when human-message quality is not proven; database trigger enforces the same boundary independently of executor code.
- Learning boundary: provider send alone is not a business outcome. Strategy promotion requires observed replies/meetings/proposals/wins/revenue.
- Production evidence: closed_loop_v6 healthy=true; 37/37 pending actions planned; 0 strategy gaps; 0 drafted actions without quality; 20 passed drafts; 31 executed strategy-labeled actions in 30d.
- Regression: `tests/brain-human-commercial-message-loop-v1.test.mjs`.
- Rollback: revert migration and edge-function changes; existing sales actions/outcomes remain canonical and no parallel CRM/store is introduced.
