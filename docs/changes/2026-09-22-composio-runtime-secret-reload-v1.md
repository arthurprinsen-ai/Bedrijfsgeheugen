# Composio runtime configuration refresh

Date: 22 September 2026  
Fingerprint: `composio-runtime-secret-reload-v1`

After rotation of the production Composio Project API key, runtime effectiveness must be proven with a fresh Netlify Functions deployment. Control-plane storage alone is not sufficient evidence that the deployed function runtime is using the rotated credential.

This lineage makes no functional publishing change. Completion requires protected merge, a post-rotation production deployment, provider validation, and Supabase setup-state readback.
