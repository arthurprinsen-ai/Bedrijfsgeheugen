# Composio Netlify source rebuild

Date: 22 September 2026  
Fingerprint: `composio-netlify-source-rebuild-v1`

The Bedrijfsgeheugen production site is currently deployed through Netlify's API transport. GitHub main merges therefore do not by themselves refresh the deployed Functions environment.

After a production Functions secret changes, Powerhouse must create an exact source snapshot of current main and submit that source through the authorized Netlify build transport. Completion requires provider and Supabase readback after the resulting production deploy.
