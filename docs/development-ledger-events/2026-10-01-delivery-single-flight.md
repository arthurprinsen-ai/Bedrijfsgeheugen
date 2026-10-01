# 2026-10-01 — Delivery single-flight

Changed `config/powerhouse-delivery-hygiene-v1.json` so `wip.maxExecutable` is `1` for overlapping conflict contracts.

Reason: multiple concurrent website/recovery candidates were consuming expensive CI simultaneously and repeatedly invalidating each other through main drift.
