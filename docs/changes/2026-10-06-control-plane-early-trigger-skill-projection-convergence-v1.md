# Control-plane early-trigger and Skill Projection convergence

On main SHA `e902e07fef8b3411451280072b40f0d0aac24bb8`, the canonical Netlify applicability classifier correctly decided that the merged control-plane change did not require Netlify deployment. However, both Netlify production workflows still started because their early `push.paths-ignore` filters did not include `tools/ci/**`. Runs `37478237193` and `37478237085` prove that unnecessary runner allocation.

The same main push exposed a separate stale regression in Powerhouse Skill Projection. Learning canonicalization itself was green, but `tests/brain-learning-canonicalization-gate-v1.test.mjs` still required `fetch-depth: 0` after the workflow had intentionally converged to bounded `fetch-depth: 2`. Run `37478237282` failed on that obsolete assertion.

The fix keeps the shared Netlify applicability module as the canonical runtime decision, adds `tools/ci/**` only as an early trigger suppression for the two Netlify production workflows, and updates the Skill Projection regression to the current bounded checkout contract.