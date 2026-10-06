# Same-day social publication recovery control plane

Date: 2026-10-06  
Obligation: social-publication-manual-recovery-control-plane-20261006

Observed:
- provider readback still showed no personal LinkedIn publication and no canonical Instagram media for 2026-10-06 after the 10-minute recovery supervisor was live;
- the externally reachable scheduled Netlify recovery route returned HTTP 403 by design;
- direct operator-side Supabase SQL access timed out;
- the canonical full content loop already owns reconciliation, media readiness, provider preflight, content orchestration, publication and terminal readback.

Implemented:
- workflow_dispatch remains available for same-day recovery;
- a reviewed main-branch request marker now provides an auditable fallback trigger when programmatic workflow dispatch is unavailable;
- recovery invokes functions/v1/powerhouse-content-loop, not a second writer and not merely the final publisher;
- scheduler-token retrieval remains inside GitHub Actions and is masked;
- sanitized full-loop and decision evidence is logged and uploaded as an immutable workflow artifact;
- no direct LinkedIn, Instagram, Buffer or alternate provider write primitive is introduced.

Terminal condition:
the incident closes only when the full loop reports provider-side truth for the required publication(s) and independent provider feed readback confirms the live post/media.
