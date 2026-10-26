# Development ledger: forecast model tool-use finite network deadline

- Existing authority: approved Anthropic `claude-sonnet-5` and single original `powerhouse-predictive-engine`; no new providers/schedulers.
- Main->production: #4274 merged, v182 independently read back with source parity.
- Authorized test: pg_net 1707 HTTP 500 `Signal timed out.`; independently persisted predictive health `fout` at 2026-10-09 15:25 UTC. This replaced earlier v181 Postgres SQLSTATE 57014 error in the real run.
- Root cause in current code: explicit `AbortSignal.timeout(45000)` around Anthropic tool-use request for up to eighty evidence-bound signals and six forecast plans. Original 45s window is too short for the actual provider latency seen; provider smoke previously 200.
- Change: finite timeout 90 seconds (under 120s outer proof transport), no change to governance, strict forecast plan tool schema, approved model, actor/tenant, scheduler auth, source/forecast dedupe, calibration or external content.
- Regression: `tests/brain-predictive-anthropic-deadline-v1.test.mjs` plus existing predictor/Brain suite.
- Terminal state: NOT yet production-verified; only success after protected merge, exact Edge readback, actual full run, proof of forecasts and real commercial provider/outcome/Brain loop.
