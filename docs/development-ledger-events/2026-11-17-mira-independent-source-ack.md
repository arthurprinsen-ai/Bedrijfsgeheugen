# Original channel-source ACK recovery — immutable event 2026-11-17

- Original owner: `powerhouse-mira-problem-radar-v1 / powerhouse-content-orchestrator` (single existing Edge #120 and BRAIN pipeline)
- Fingerprint: `powerhouse|mira|valid-business-source-503-because-personal-fact-unverified|20261117-v1`
- Verified original provider: `net._http_response.id=34368` in Supabase canonical project `adhjwmvyoixzjtmiroln`
- 2026-11-17 20:02 UTC original #120 schedule: cron succeeded enqueue; actual Edge HTTP503, outcome `SOURCE_RECOVERY_DUE`
- Native response: `runDate=2026-11-18`, `materialized.ok=true`, business score `0.913`, `sourceRecovery=null`; `personalSourceRecovery.reason=PERSONAL_USER_EXPERIENCE_NOT_VERIFIED`
- Original bug: combined readiness value used for *business* transport ACK; cascade blocked an otherwise viable source
- Proposed code: separate business source ACK from personal readiness; preserve independent personal BRAIN obligation, first-person source gate and `sendsAuthorized=false`
- Regression baseline: 6 existing tests updated + new cross-channel independence test; main skill updated
- No new scheduled jobs, provider sends, fabricated media, direct main write, direct production auth changes, or downgraded face/source gates
- Pending acceptance: Required + CodeQL, protected merge, exact Supabase Edge deploy and live request readback
- Still unproven: Meta Instagram POST/GET, personal LinkedIn post, named BRAIN PROCESSED, Heartbeat effect, applied learning, customer/revenue outcomes
- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
