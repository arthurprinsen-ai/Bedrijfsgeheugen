# Paginacontrole self-validation trigger

Fingerprint: `paginacontrole-self-validation-trigger-v1`.

The workflow now includes its own YAML path in both push and pull_request filters, so future workflow-only repairs execute the exact workflow they modify instead of relying on indirect syntax checks.
