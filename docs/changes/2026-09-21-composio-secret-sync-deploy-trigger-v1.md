# Immediate Composio secret binding after production deploy

Date: 21 September 2026  
Fingerprint: `composio-secret-sync-deploy-trigger-v1`

The scheduled Netlify secret bridge is deliberately not publicly invocable. A production URL probe returned 403, which preserves the desired security boundary but means the first cron execution alone cannot provide same-release closure.

The same idempotent, status-first sync operation is now reused by a Netlify `deploySucceeded` platform event handler. It runs only for production deploys. Netlify signs platform event invocations, so no public trigger endpoint or browser-held secret is introduced. Publication ownership remains exclusively with the existing Powerhouse content loop and social publisher.
