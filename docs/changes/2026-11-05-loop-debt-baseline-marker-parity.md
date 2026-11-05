# Loop-debt baseline parity after marker consolidation — 2026-11-05

## Finding
Main (`bc70c14`, PR #5446) failed one backend-lane test: `baseline contains no skill that already carries the marker`. The PR added the incident-loop marker to `powerhouse-company-intelligence-os` and `powerhouse-delivery-concurrency`, but both still sat in `loop_debt_baseline` of `brain/policies/powerhouse-incident-register-and-self-fix-v1.json`.

## Change
Remove those two skills from `loop_debt_baseline` (31 to 29). Debt shrinks, nothing is hidden. No test changed or skipped.

## Verification
Incident, chat-learning preflight and skill tests: 160 of 160 pass locally. Protected Required, CodeQL, original BRAIN and terminal closure remain the independent gates. Proves no runtime or customer outcome.
