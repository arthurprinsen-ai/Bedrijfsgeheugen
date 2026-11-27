# 2026-11-18 — Mira production frame-verifier transport misclassified as identity failure

- **Original lineage:** `powerhouse|instagram-mira|frame-verifier-429-not-face-result|20261118-v1`
- **Original P0s:** #5232 / #4198, original Media Router/producer/Heartbeat; original job `4a68dc41-6e60-4b64-ba7b-400086cb7296`
- **Observed:** provider video history `r6sZX8kdGyvpD6zEbWg7` complete; original frame verification request `34812` -> HTTP 422 mismatch wrapper, actual nested provider error 429
- **Root cause:** Original router collapsed unsuccessful transport into genuine face mismatch; no measured confidence ever returned
- **Correction candidate:** one pure read-only classifier plus same-source guarded route change, regression and learning
- **Prevention:** only a successful, structurally valid independent numeric verdict may enter the identity rejection writer; never reject on 429/5xx or unavailable result
- **Nonterminal:** protected release, fresh provider verification, Meta readback, outcome measurement still due
- **State:** CANDIDATE / NOT GREEN
