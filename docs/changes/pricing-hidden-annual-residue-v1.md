# Pricing hidden annual residue

## Root cause

The old annual pricing mode was visually retired, but its hidden DOM payload and `.jr/#tj` CSS remained in `prijzen.html`. As a result, non-visual readback could still expose the legacy Enterprise amount of € 49.950 per year.

## Fix

The hidden annual Enterprise amount and dead toggle CSS are removed. The canonical commercial presentation now contains only the monthly Enterprise amount where the package is shown.

## Prevention

`pricing-build-integrity.mjs` and the immutable live pricing contract now reject hidden `.jr` annual markup and the legacy € 49.950 amount. `test-live-contract.mjs` includes a regression case.

## Evidence

Required website gates, deploy preview and production readback must all pass on the same candidate before this change is considered delivered.
