# Pricing production promotion recovery

The pricing redesign itself passed its protected pull-request gates and merged to main, but production verification found that Netlify was still serving an older source commit. This recovery uses the repository's canonical Production Source Snapshot workflow as the deployment authority instead of bypassing release controls.

## Prevention

Website work is not complete at merge. The exact production release marker must contain the merged obligation, and stale production identity must route to the authorized exact-source deployment workflow followed by bounded readback.
