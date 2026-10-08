# PR #4134 historical terminal closure: confirmed, redundant replay retired

## Original immutable evidence
- Original merged PR: [#4134](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4134).
- Original merge SHA: `f8c7f313be234da58326a399d45b5866ff13ca59`.
- Historical failure: [#37760879023](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37760879023). It failed because the old terminalizer awaited a Netlify production release for a Supabase-only function change.
- Correct canonical closure: [#37768018373](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37768018373), completed **success** from `workflow_dispatch`, using the trusted original workflow OIDC identity.
- Database readback: Brain obligation `linkedin-cross-workspace-auth-proof-20261008-v1` is **FULFILLED** at the original merge SHA.
- Immutable artifact: `obligation-terminal-evidence-4134`, SHA-256 `521c6993abad495094bb553e7a23f2a4b1455f132cbf72ff280a1c448fe1ca1a`.
- The Supabase provider readback was verified ACTIVE, with exact source parity and version/hash at the time of closure.

## Unnecessary secondary attempt
PR [#4153](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4153) introduced a spent one-shot marker, a new workflow_call route and a caller in the historical reconciler before discovering the original obligation was already FULFILLED. The later replay [#37768605469](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37768605469) passed the content/source/provider gates but failed at `OIDC_WORKFLOW_REJECTED`, because reusable workflow OIDC claims identify the caller and the production Brain evidence writer only trusts the canonical terminal workflow reference.

## Safe retirement
This follow-up reverts only those unnecessary #4153 workflow changes, deletes the spent marker and rewrites the associated regression test. The original historical reconciliation workflow and direct canonical closure stay operational; the Supabase-only production release classifier, provider readback and immutable Brain evidence policy from #4142/#4146 remain intact. No authentication policy is loosened and no direct Brain state update is performed.

The original historical failure and the later duplicate failure remain in GitHub's audit history; neither is mislabeled as successful.
