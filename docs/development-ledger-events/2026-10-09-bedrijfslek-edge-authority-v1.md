# 2026-10-09 — Bedrijfslek Edge production authority recovery
- Obligation-ID: bedrijfslek-edge-production-authority-v1
- Parent-P0: #4198
- Delivery-Lane: backend
- Candidate-Type: recovery
- Base-SHA: eccf6bac75d53cc11c9d792356e756843932d994
- Prior completed release: PR #4286, Netlify production eccf6bac, Supabase Edge v12 source parity, canonical SQL trigger + security proof; scan production smoke run 37977917243 GREEN.
- Failed observer: Supabase Edge Production Authority run 37977917429, cause undeclared canonical scan function in supabase/config.toml.
- Repair: Add exact existing function declaration; preserve hashed service token, no new auth bypass, sender, schedule or store.
- Regression: tests/brain-bedrijfslek-edge-production-authority-v1.test.mjs.
- Next safe action: admission → protected merge → existing provider authority readback → one exact revision proof; P0 #4198 stays OPEN for actual commercial outcomes.
- Writer-Lease-State: CANDIDATE_WRITING

- Additional existing-workflow guard: production Bedrijfslek fixture POST twice; require immutable scan/event IDs, no PII, no auto-verified tenant; config changes trigger the same scan proof.
