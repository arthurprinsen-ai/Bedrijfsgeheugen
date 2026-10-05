# Production readback authority routing

Date: 2026-10-05  
Obligation: `supabase-production-readback-authority-routing-20261005-v1`

The post-merge readback after migration-history recovery exposed an authority-routing defect rather than a migration-parity defect. The merged recovery commit contained Supabase history plus GitHub control-plane changes, but `.github/**` was still allowed to influence runtime lane classification. The terminalizer also routed every non-governance change through the Netlify website marker.

This change separates production proof by authority:

- GitHub control-plane paths are non-runtime for production deployment classification.
- A bounded `supabase-migration-history-parity-*` recovery may close through main containment because it mirrors already-existing production history and is rejected if any unexpected runtime path is present.
- Netlify-hosted runtime continues to require exact live release identity.
- Any other non-Netlify runtime path without a dedicated production verifier fails closed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.
- Terminal evidence records `readback_mode` and distinguishes performed runtime readback from explicitly not-applicable recovery.

This prevents both failure modes: waiting forever for an irrelevant Netlify marker and falsely claiming a production readback that never occurred.
