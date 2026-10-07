# Netlify just-in-time production deploy authority v1

This change removes the dated/persisted Netlify MCP proxy from the canonical production delivery path.

## What changed

- Added the existing production `netlify-deploy-bridge` Edge Function to source control.
- Preserved exact GitHub OIDC restrictions for repository, `main` ref and `production-source-snapshot.yml`.
- Reads the canonical Composio project key server-side from Supabase Vault.
- Requests a fresh Netlify deployment authority for each deployment attempt through the existing connected Netlify account.
- Does not persist issued Netlify proxy URLs.
- Adds contract tests that fail if dated or persisted Netlify MCP proxy authorities return to the bridge.
- Classifies bridge dependency failures without exposing credentials.

## Why

Successive Netlify MCP authority issuances produced different proxy URLs. A previously stored proxy later failed with 401 Unauthorized even though GitHub OIDC remained valid. The durable authority is therefore the authenticated Composio connection, not an individual issued proxy URL.

## Completion rule

This source close is not terminal by itself. Completion requires: Required + CodeQL green on the exact PR head, protected merge, exact-main Netlify production release identity, and live Security Trust Center browser/readback.