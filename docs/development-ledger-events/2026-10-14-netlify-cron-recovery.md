# Delivery activity — external cron recovery

Obligation: powerhouse-external-cron-recovery-20261014

- Supabase private cron failure reconciler and service-role-only RPC deployed, schema existence read back.
- Independent Netlify scheduled worker committed to GitHub on PR #4370.
- Cron reconciliation call timed out during `FOR` query, so no successful backfill is claimed.
- Required CI initially rejected missing PR machine metadata; corrected and rerun.
- Production activation requires Netlify service credential, protected merge and real run evidence.
