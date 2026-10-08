# Correct tenant AI Netlify release classification

- Obligation-ID: tenant-runtime-netlify-release-impact-20261008-v1
- Problem: transitive hosted AI runtime changes were incorrectly labelled no-deploy.
- Files: canonical release classifier; customer inference Netlify endpoint; executable Brain regression.
- Egress: no new direct model routing or credentials; tenant signed authorization remains unchanged.
- Closure: require exact merged SHA Netlify production readback, not a skipped deployment.
