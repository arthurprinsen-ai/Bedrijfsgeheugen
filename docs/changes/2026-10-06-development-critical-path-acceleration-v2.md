# Development critical-path acceleration v2

This change removes avoidable CI/provider work without weakening protected merge, exact-HEAD, security, deployment or production-readback truth.

The audit observed 124 workflow files and 45 queued runs in the latest sampled 100 Actions runs. Before this candidate was finalized, current main had already gained single-flight cancellation for Repository Writer Gate Dispatch and Repository Writer Operational Verification, plus a conservative fail-open Netlify ignore controller. Those mechanisms are reused, not duplicated.

This candidate closes the remaining hotspots: Repository Writer Candidate Shadow and Cheap Canary cancel stale flights; Powerhouse CodeQL keeps its PR check visible but avoids analyzer initialization when no JS/TS security surface changed; Supabase Preview Applicability keeps its PR check visible but avoids checkout and Git-history work when no `supabase/**` path changed.

The first exact-head run caught two integration defects before merge: a duplicate Netlify `ignore` key and YAML comment parsing in the Supabase no-op message. The duplicate Netlify mechanism is removed entirely and the Supabase message is now a multiline shell step.
