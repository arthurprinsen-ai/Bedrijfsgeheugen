# Portal demo isolation and canonical BusinessInput ACK

The portal's One Brain write-through path now distinguishes demo-only non-durable state changes from authenticated customer mutations. A demo flush does not send BusinessInput data to the durable store and does not require an acknowledgement. The real tenant branch still denies missing authorization and missing canonical ACK without treating the data as saved.

The causal propagation test is aligned to the current `2026-10-08-v4-one-brain-all-pages` version, with its full dependency assertions left intact. The fix does not weaken tenant verification, Supabase RLS, or the external-execution approvals. Regression: `tests/brain-portal-demo-businessinput-ack-v1.test.mjs`.
