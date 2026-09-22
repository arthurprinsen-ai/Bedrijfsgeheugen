# Composio post-rotation runtime rebuild v2

Date: 22 September 2026  
Fingerprint: `composio-post-rotation-runtime-rebuild-v2`

The production Composio Project API key was updated after the active Netlify Functions deployment. Provider validation therefore still exercised the prior runtime credential until a later Functions deployment occurred.

This lineage forces one protected deploy-relevant Functions rebuild after the credential rotation timestamp. No publishing behavior changes. Terminal proof requires the resulting production deploy to be newer than the credential update, followed by provider and Supabase readback.
