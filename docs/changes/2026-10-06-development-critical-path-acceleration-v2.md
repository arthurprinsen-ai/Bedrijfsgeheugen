# Development critical-path acceleration v2

This change removes avoidable CI/provider work without weakening protected merge, exact-HEAD, security, deployment or production-readback truth.

The audit observed 124 workflow files and 45 queued runs in the latest sampled 100 Actions runs. Current main already gained single-flight cancellation for Repository Writer Gate Dispatch and Repository Writer Operational Verification, so this candidate only closes the remaining hotspots.

Changes: candidate-shadow and cheap-canary stale runs become cancellable; Powerhouse CodeQL keeps its PR check but avoids analyzer initialization when no JS/TS security surface changed; Supabase Preview Applicability keeps its PR check but avoids checkout on non-Supabase PRs; Netlify gets a conservative fail-open ignore rule for proven non-Netlify paths.

The inspected Netlify production deploy reported 122 seconds of provider deploy time and roughly 6m41 from creation to publication. Unknown or mixed changes still build.
