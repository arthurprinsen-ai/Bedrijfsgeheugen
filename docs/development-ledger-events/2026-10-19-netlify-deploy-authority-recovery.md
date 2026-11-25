# Netlify production transport authority — recovery event (19 October 2026)

**Obligation:** netlify-transport-authority-recovery-20261019
**Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
**Source run:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39209401787
**Recovery PR:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4448

## Observation / failure

GitHub source snapshot run 39209401787 successfully packed exact source at 6fe132b8cdbbd9c25a6f37819738066d59d0a16d, but native Git publication did not converge within the bounded window. The Supabase OIDC bridge verified its GitHub token and failed in proxy-account lookup with HTTP 420, composio_netlify_account_not_public. These facts were independently corroborated by Supabase function logs at 2026-10-19T06:32:41Z. The bridge maps any missing active Netlify connection in its project scope to that code. It does not prove which connection or account visibility adjustment is required.

## Investigation / separate production recovery

Netlify later published successful Git-native production deploy 6ad5ba106bfc20fb52b8a159 on 2026-10-19T06:37:04Z, SHA d015232819caabe212c703de8ff832a05baf6c57. Provider deploy status was ready; GitHub main at subsequent readback matched this SHA exactly. Browser and tenant-authenticated workflow readback remain separately required. The Composio fallback authorization has not been fixed by this Git-native recovery.

## Intervention

- Introduced reusable strict classification for the bridge failure (420 is non-retryable without a scope/authorization change), safe GitHub Actions incident summary, source SHA and issue linkage.
- Added tests/brain-netlify-transport-authority-regression.test.mjs with security-sensitive replay, shadow and CI-canary evaluation modes.
- Recorded linked BRAIN lesson and active delivery prevention rule; created an explicit Netlify authorization recovery playbook.
- Preserved protected merge, OIDC and production-readback controls; did not invent a provider publish or broaden credentials.

## Acceptance / still open

Canonical CI admission and CodeQL must succeed on the exact PR head before a protected merge. The integration owner must restore an approved Netlify account visible to the scoped Composio bridge and verify the fallback via provider-level effect and public deploy identity. The P0 remains open until there is evidence; a ready Git-native deploy by itself does not certify the fallback or authenticated portal functionality.
