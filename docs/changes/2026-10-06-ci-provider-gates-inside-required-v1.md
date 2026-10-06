# CI provider gates inside Required v1

The protected PR critical path is narrowed again.

- Required preflight now classifies scope and contracts only; it no longer executes the complete Netlify deploy-preview build before release lanes can start.
- Exact Netlify production build parity remains a separate post-classification job and therefore runs in parallel with selected delivery lanes.
- Supabase Preview Applicability becomes reusable through `workflow_call`.
- Required test calls that exact provider proof only when `supabase/**` changed and the event is not a merge-group replay.
- The protected aggregate remains fail-closed when Supabase proof is required.

The standalone Supabase PR trigger is intentionally retained for this rollout commit because main branch protection still requires its existing status context. After this PR is protected-merged, branch protection can safely remove that global context; a follow-up can then retire the standalone PR trigger.
