# Pricing production proof contract drift — 2026-09-23

## Root cause

The production snapshot workflow still validated an obsolete pricing contract that expected annual billing controls to be absent. The current pricing page intentionally includes monthly/yearly billing, Start/Run & Grow tabs, and lifecycle routes. This allowed production verification logic to drift away from actual product behavior.

## Fix

The canonical production snapshot proof and its regression test are updated together. The proof now checks the current billing, pricing-tab, and lifecycle controls. Updating the snapshot workflow also triggers the canonical exact-source Netlify production transport after merge.

## Prevention

Pricing interaction changes must update production proof and regression coverage in the same delivery lineage. A website promotion cannot be closed as live without exact production SHA identity and current interaction-contract readback.
