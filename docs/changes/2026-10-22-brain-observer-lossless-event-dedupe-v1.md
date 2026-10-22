# Brain incident observation: lossless evidence and event identity

Canonical owner: [P0 #4681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681). Fingerprint: `brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1`.

## Confirmed production defect
The existing `public.brain_observe_failure(text,text,text,jsonb)` replacement on a new failure occurrence does `evidence=coalesce(p_evidence,evidence)`. That erases older promoted JSON summaries. Separate agents also used `cron-46:121040` and `supabase:cron:job46:run:121040` to record one run, producing 20 raw events representing 11 unique real cron runs. The raw records remain valuable and must not be purged.

## Fix within the existing BRAIN authority
Keep the existing function signature, service-role-only authority, SECURITY DEFINER, search path and row-lock concurrency. For this project normalize known cron alias formats to `supabase:adhjwmvyoixzjtmiroln:cron:<jobid>:run:<runid>`. All aliases share one transactional advisory lock and a strict fingerprint+SHA identity check: conflicting existing hashes stop rather than silently merge. Append compact per-event pointers to `_event_observations_v1` in the registry, preserving previously promoted summary keys and retaining full immutable event evidence in `brain_failure_occurrences`. Never alter historic raw rows, current schedules or tenant permissions.

## Not sufficient for release
Source-only Node assertions are useful, but not a substitute for transaction-level SQL acceptance on an isolated preview: observe/promote/observe, same event across aliases, different fingerprints/hashes, real simultaneous connections, version CAS, service-role-only ACL and rollback. Exact-head Required/CodeQL and actual provider deployment/readback must complete before production release. Historical raw count and distinct event count must be presented separately, not retrospectively rewritten.

## Prevention
Always check the existing registry/skill before material writes, normalize source/provider event IDs, preserve evidence, deduplicate by true cause and stable event identity, and never mark a material problem PROVEN based solely on a commit or CI result. Commercial runtime #4215 and person-cache #4630 retain their own independent release gates.
