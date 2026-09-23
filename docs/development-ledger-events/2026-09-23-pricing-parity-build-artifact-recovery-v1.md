# 2026-09-23 — Pricing parity production artifact recovery

Production readback caught a source-vs-built-artifact drift after the first 100% parity merge. Root cause was placement outside the pricing section restored by `pricing-build-integrity.mjs`.

Recovery moves the block into the protected canonical section and upgrades build-integrity assertions. Do not declare terminal completion until the public route contains the expected parity tokens.
