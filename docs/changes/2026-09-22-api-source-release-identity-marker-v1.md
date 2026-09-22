# API-source release identity recovery

Netlify API uploads do not guarantee Git commit metadata. The failed production deploy 6ab254dd2116c8947f08bf50 had deploy_source=api and commit_ref=null. The site build nevertheless required COMMIT_REF or HEAD in its final release-evidence step, causing a build exit code 2.

The canonical source-snapshot workflow now stamps the exact checked-out GitHub SHA into .bg-source-commit before upload and includes the same marker in the archived source. Release evidence accepts this marker only as a validated 40-hex fallback. If Netlify later supplies a provider commit identity too, both identities must match or the build fails closed.

The deploy side effect is again restricted to explicit workflow_dispatch with deploy=true, preventing ordinary pushes from creating unrequested production deploys.
