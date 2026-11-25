# Runbook — Netlify source transport authority failure (P0)

Incident of 19 October 2026: [GitHub run 39209401787](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39209401787); [P0 issue 4447](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447).

## Verified evidence

- Packaging, snapshot, source identity and artifact upload succeeded for `6fe132b8cdbbd9c25a6f37819738066d59d0a16d`.
- The latest Netlify production deploy read back from provider was `6ad12ccf4aaa7eab0652fd31`, pointing to `59b4aaa1cfb01c1cd8d3c0085372cb5837db03db`.
- GitHub compare of these exact two commits showed **two commits and twelve changed files** limited to GitHub workflows, tests, documentation and BRAIN learning. The repository's `netlify-ignore-build.mjs` can intentionally skip a build with only governance changes. **Stale Git SHA is not itself proof of different live application behavior.**
- Manual `workflow_dispatch(deploy=true)` attempted exact-source publication; after 36 native-Git checks, the OIDC/Supabase fallback returned HTTP **420**, `composio_netlify_account_not_public`, exit 78.
- That code maps the bridge's `composio netlify connected account unavailable` and cannot by itself identify whether the issue is connection privacy, project-key scope, disabled account, user scope, or another mismatch.

## Required owner action

1. **Git native deployment owner (Netlify):** inspect project **bedrijfsgeheugen**, Git-linked repo `arthurprinsen-ai/Bedrijfsgeheugen`, production branch `main`, build ignore decision, deploy lock/autopublish, deploy approvals and GitHub installation webhook. Do not disable build-ignore merely to turn a governance-only commit into a runtime deploy. Re-run the approved Git-linked production build for an actual runtime change only when required.
2. **Connector owner (Composio + Supabase):** under the exact Composio project for `COMPOSIO_API_KEY` in Supabase Vault, verify `netlify_mcp` account status, account visibility/user scope, correct site `fd527056-493a-4d8a-8125-d00370104fa3`, and permission to execute `NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER`. Compare to independently connected private account without assuming they share project scope. Create a dedicated approved team/service connection if required. Never log keys, copy private tokens into GitHub, or loosen OIDC claims.
3. **CI owner:** run the targeted classification regression, Required CI and CodeQL. Merge only through protected PR checks. A successful bridge proxy issue is **not** a successful site publication.
4. **Production verifier:** inspect Netlify published deploy ID/commit, public `https://www.bedrijfsgeheugen.nl/release.json`, current `main`, and impact classifier for differences. Require exact deployed identity for runtime changes or an independently documented runtime-equivalence exception. Exercise authenticated portal and pricing NL/EN before acceptance.

## Automated classification

`tools/delivery/netlify-authority-incident.mjs` classifies bridge errors and writes the GitHub job summary when the bridge is unavailable. HTTP 420 has class `NETLIFY_AUTHORITY_NOT_VISIBLE`, is *non-retryable without an authorization change*, and links the P0 incident. We deliberately keep `exit 78` and the production identity gates. Attempts must not turn the incident green or report success without provider and public readback.

## Closure criteria

- The team/provider verifies and restores an authorized deployment path.
- Required CI and CodeQL pass for the protected change.
- A meaningful runtime release successfully deploys through native Git or the approved fallback.
- Evidence includes GitHub run, Netlify deploy ID, source SHA, `release.json` parity, and production functional tests.
- Incident 4447 is closed only after those are attached.

## Learning invariant

**NETLIFY_DEPLOY_AUTHORITY_MUST_BE_VISIBLE:** identify authority failures distinctly from slow build/CI; never retry indefinite or expose credentials; enforce explicit owner and evidence; treat old SHA on governance-only changes separately from runtime drift. Linked BRAIN lesson: `brain/learning/netlify-transport-authority-2026-10-19.json`.
