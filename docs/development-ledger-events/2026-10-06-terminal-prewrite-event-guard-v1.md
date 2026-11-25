# Development ledger event — terminal pre-write event guard

Date: 2026-10-06  
Obligation-ID: terminal-prewrite-event-guard-20261006-v1  
Fingerprint: delivery|terminal-writer|prewrite-event-lease-transition|v1

Observed: PR #3994 received content commit `eaac0b6e1f4a2ccdf62c09f61dee0ee0a57d8e91` after terminal lease HEAD `d5862df405db5f244486dccc153e6d66d5e0429b`. The lease head was then advanced, masking that the content write itself occurred under `TERMINAL_DELIVERY`.

Correction: admission now treats the synchronize event snapshot as pre-write truth. `TERMINAL_DELIVERY` synchronize is rejected. Supervisor main refresh uses a bounded `MAIN_SYNC` transition whose commit must have the previous leased HEAD and exact main target as parents, then returns to exact terminal state.

Executable proof: `tests/delivery-terminal-prewrite-event-guard.test.mjs`.
