# Production source snapshot recovery

Date: 22 September 2026  
Fingerprint: `production-source-snapshot-recovery-v1`

The Netlify production site currently uses API source deployment. A protected GitHub merge therefore does not prove that Netlify rebuilt the Functions runtime.

The existing `Production Source Snapshot` workflow is reused to create an exact-main source archive on a GitHub-hosted runner. That archive is the authorized source for the subsequent Netlify production deployment.

No application behavior changes in this recovery step. Terminal proof requires exact source identity, production deploy readback, and provider readiness.
