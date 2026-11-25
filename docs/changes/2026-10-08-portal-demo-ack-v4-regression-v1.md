# Portal demo durability and causal v4 regression repair

The v4 portal impact loop must not treat a non-durable demo as a failed authenticated business write. A confirmed demo skip is accepted *only when the current portal state client is demo*, with no durable record and no provider call; an authenticated write still requires real authorization plus `stored:true` acknowledgement. This prevents demo from writing confidential customer data to canonical BusinessInput storage without a user identity.

The established causal propagation test was also incorrectly pinned to the retired `2026-09-18-v3-whole-portal-causal` version even though the One Brain v4 contract was merged. It now pins the actual v4 identifier. Full causal page/effect assertions remain unchanged.

Regression: `tests/brain-portal-demo-canonical-ack-v4.test.mjs`, `tests/portal-business-input.test.mjs`, `tests/portal-v2-causal-propagation.test.mjs`.
