# Control-plane admin cockpit recovery

Obligation: `powerhouse-control-plane-admin-cockpit-v1`.

This recovery ports only the original #2317 cockpit delta onto current main. It adds an admin-only read-only projection of canonical obligation state, preserves current shared-file changes, and creates no parallel truth store.

Security remains fail-closed: Netlify Identity admin/powerhouse_admin authorization is required; 401/403/404 mount no customer-visible cockpit; the Supabase action reads only canonical projection views and performs no writes.
