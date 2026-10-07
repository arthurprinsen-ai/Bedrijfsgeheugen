# Development ledger — evidence-first data sovereignty control plane

- Date: 2026-10-07
- Obligation: data-sovereignty-control-plane-20261007-v1
- PR: #4051
- Trigger: customers need transparent, tenant-specific proof of where business data is processed, stored and transferred, including AI routes and connectors.
- Structural implementation: one tenant policy authority, provider registry, dataflow registry, AI-route registry, connector residency projection and live sovereignty snapshot wired into Brain → Heartbeat → Powerhouse.
- Enforcement: `EU_ONLY` and `EU_STORAGE` are fail-closed; confidential AI and connector execution are checked before external processing.
- Provider truth: Supabase is verified in `eu-central-1`; Netlify remains `PLATFORM_ROUTED_UNPINNED / PLATFORM_MANAGED_UNKNOWN_REGION`.
- Provider readback: Netlify deploy `6ac62c9a0bd4ba000871fe77` reported `functions_region=iad` and `blobs_region=us-east-1`; therefore runtime samples are evidence, not residency guarantees.
- Correction: unsupported Netlify per-function `region="fra"` and Blob `region:'eu-central-1'` assumptions were removed and regression-tested.
- AI routing: OpenAI EU is selectable as desired state but remains `AVAILABLE_NOT_CONFIGURED`; no silent provider switch occurs before runtime/evidence are green.
- Automatic update: sovereignty snapshots refresh from the canonical heartbeat and provider/connector observations.
- Truth policy: `measured_or_evidence_backed_else_unknown`.
