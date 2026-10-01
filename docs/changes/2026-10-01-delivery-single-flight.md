# Delivery single-flight

Powerhouse delivery hygiene now admits at most one executable candidate for overlapping conflict contracts. Unrelated delivery work can still proceed in parallel.

This reduces duplicated CI, main drift and repeated recovery loops while preserving the existing exact-SHA production and readback gates.
