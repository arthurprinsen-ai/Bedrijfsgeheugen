# Unified Brain Delivery

`BRAIN-DELIVERY-v1` makes backend, website and portal development one release system while preserving specialist ownership.

## Runtime contract

1. `tools/brain-delivery-system.mjs membership` discovers registered Brain components, repository agents and GitHub workflow scenarios. Every discovered member receives `brain.v1`, shared-context, cost, security, outcome-writeback and BG169 production requirements.
2. `tools/brain-delivery-system.mjs plan` reads the exact Git diff and classifies it through `config/brain-delivery-system.json`.
3. Shared contract changes activate all lanes. Scoped changes activate only affected lanes. Unknown active paths fail closed.
4. Backend, portal and website lanes run concurrently with separate specialist ownership.
5. The integration job verifies the combined exact candidate once. Lanes never publish independently.
6. BG169 is the sole production authority. BG168 routes the material outcome to BG166 and BG167 projects it into current shared context.

Before a Netlify upload, run `node tools/brain-delivery-system.mjs deploy-preflight --sha <exact-BG169-sha>`. The preflight proves that the source is a standalone repository at the exact governed SHA and tree. A linked Git worktree is rejected before upload because its `.git` pointer depends on a host-only common directory. Stage a `git clone --no-hardlinks` at the exact SHA, rerun the preflight and deploy only after `DEPLOY_SOURCE_READY`.

## Automatic onboarding

- A new repository agent added to `DEFAULT_AGENT_TEAM` appears automatically in the membership projection.
- A new GitHub workflow appears automatically as a delivery scenario.
- A new Make scenario appears through the existing dynamic Make/Cost component discovery and remains budget-deferred until classified.
- GitHub and Netlify are explicit `PRODUCTION_RELIABILITY` platforms in the Brain component registry, so source, CI and deployment evidence share the same governance and lineage.
- A new repository scope must be added to an existing lane or explicitly classified; otherwise production readiness fails.

## Speed model

The planner minimizes work before compute starts. Independent tests run simultaneously, expensive integration executes once, stale runs are cancelled per pull request and one exact SHA moves through preview and production. This removes serial backend-to-website-to-portal hand-offs without introducing multiple truths or release owners.

## Protected invariants

- one trace and one exact candidate SHA;
- no isolated production writes;
- no unknown active scope;
- no missing Brain/cost/security/outcome membership;
- no weakening of accepted website, portal, security or data contracts;
- last-known-good remains available until exact production verification is green.
