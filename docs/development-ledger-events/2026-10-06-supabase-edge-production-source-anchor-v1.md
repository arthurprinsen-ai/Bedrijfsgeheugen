# 2026-10-06 — Supabase Edge production source anchors v1

Obligation-ID: supabase-edge-production-source-anchor-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: 60d41da674c0b0db5b59c5cdf8bff5da08788e51

Observed:
- protected merge 7e03a846 changed social-recovery-runner source;
- Supabase check 112377585210 completed skipped at the /branches endpoint;
- its summary stated that main is not associated with a Supabase Branch;
- provider social-recovery-runner remained v28 and source-different from protected main;
- prior production anchor 2b0539cb changed supabase/config.toml and produced successful project check 112296747565.

Repair:
- add content-bound production_source_git_blob markers for publisher and recovery to supabase/config.toml;
- Required CI recomputes git hash-object for both entrypoints and rejects stale markers;
- update the canonical production authority contract;
- preserve GitHub Integration as sole production writer.

Terminal criteria:
protected merge -> successful Supabase /project production check -> provider version/source update -> authority --use-api byte parity -> same-day canonical social recovery -> provider-truth readback.
