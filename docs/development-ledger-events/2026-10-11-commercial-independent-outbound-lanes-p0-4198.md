# 2026-10-11 commercial outbound lane separation
- Parent #4198; obligation `p0-4198-commercial-independent-outbound-lanes-v1`
- Source owner: existing commercial Heartbeat runner (Netlify 5-minute entry), no new scheduler
- Separate routed lanes: email, linkedin_dm, linkedin_comment, linkedin_like (last deliberately held pending authorized provider write capability)
- Original sender RPCs retained, per-hour event dedupe, per-lane transaction isolation
- Existing LinkedIn comments fixed to actual documented structured tool request with canonical identity and post readback
- External provider proof required before delivered/revenue claims; SalesRobot execution days=0; no shadow campaign
