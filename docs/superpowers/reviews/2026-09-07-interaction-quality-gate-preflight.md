# Interaction Quality Gate preflight

| Area | Produces / consumes | Check |
|---|---|---|
| Contract registry → static wiring checker | `interactionContracts` | IDs and hooks align with existing homepage builders. |
| Registry → Playwright runner | route/root/states/viewports | Browser selectors use runtime hooks actually emitted by the builders. |
| Browser helpers → Playwright runner | readability/overlap/state assertions | Failure classes are explicit and include geometry/state evidence. |
| PR workflow → browser runner | `BASE_URL` deploy-preview URL | Same canonical browser spec is used as production readback. |
| Production workflow → browser runner | `BASE_URL=https://www.bedrijfsgeheugen.nl` | No alternate production assertion implementation. |
| Existing required `test` → interaction checks | static + Playwright checks | Existing Brain/delivery tests and `v18-vergelijker` regression remain included. |

Ruling: standalone `interaction-quality-gate` branch-protection status cannot be verified because the GitHub App receives 403 on branch-protection reads. Therefore the implementation also strengthens the existing required `test` job; no claim is made that a new required context was configured.
