# 2026-10-07 — Supabase authority immutable replay v2

- Corrupted main: `7f422aab334dd09a85d6c1d635ee2ab87f82933f`.
- Workflow-load failure: run `37576825013`.
- Symptom: workflow loaded under its path name and failed before any job started.
- Exact defect: truncated requested-function grep expression in the scope resolver.
- Recovery source: last proven clean authority at `90d1b205a238664300f1f96f3efa54207309b003`.
- Recovery rule: rebuild from clean source, then apply parity/replay changes once; do not patch the corrupted workflow in place.
- Structural guard: one resolver, one capture, one observer, one bounded parity loop, complete slug regex, explicit replay target.
- Runtime code unchanged; database DDL unchanged; secrets unchanged.
