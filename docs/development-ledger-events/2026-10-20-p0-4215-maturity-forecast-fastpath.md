# Development ledger: revenue evidence projection P0 #4215

Candidate only: direct forecast_id mapping removes duplicated v4 expansion from maturity evidence. Observed historical revenue refresh mean 88.1s, v5 planner cost 153M baseline to 97M candidate, no runtime performance claim. No direct production SQL change. Keep existing 14-stage commercial scheduler and canonical 36-slot runtime mux, consent and all evidence policy. Regressions in tests/brain-p0-4215-maturity-forecast-fastpath.test.mjs; protected preview / parity / release readback mandatory.
