# Same-day social publication recovery control plane

Date: 2026-10-06  
Obligation: social-publication-manual-recovery-control-plane-20261006

Observed:
- the canonical publisher remained the only legitimate provider writer;
- Netlify production was on merge SHA eca2e35fecdec55e5d03b62a6b58bd0c1de6cf0f with the ten-minute supervisor and deploy hook live;
- provider readback still showed no personal LinkedIn publication and no canonical Instagram media for 2026-10-06 immediately after deploy;
- direct external access to the scheduled Netlify recovery endpoint returned HTTP 403;
- direct Supabase SQL access from the current operator runtime timed out.

Implemented:
- a workflow_dispatch recovery lane that is restricted to today's Europe/Amsterdam date;
- secret retrieval stays inside GitHub Actions and the scheduler token is masked before use;
- the workflow invokes only functions/v1/powerhouse-social-publisher;
- the workflow reads back powerhouse_channel_decisions after the canonical attempt;
- no direct LinkedIn, Instagram or alternate provider write primitive is introduced.

Terminal condition:
the daily publication incident closes only when this workflow or the automated supervisor produces provider-side evidence for the required channel(s), followed by provider feed readback.
