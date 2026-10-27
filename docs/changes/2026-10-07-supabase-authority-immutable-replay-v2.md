# Supabase authority immutable replay v2

This successor repairs a workflow-integrity regression in the Supabase production authority.

The authority is rebuilt from the last known-good clean workflow rather than patched on top of the corrupted main copy. Before writing, the generated workflow is structurally checked to contain exactly one scope resolver, one source-capture stage, one non-blocking provider observer, and one bounded provider-parity retry loop. The requested-function slug regex must be complete and the replay target must be wired explicitly.

Production authority remains byte-for-byte provider source parity. GitHub's Supabase check remains observability only. Successor replay may target PR #4025 only when current Supabase runtime is unchanged from the target merge.
