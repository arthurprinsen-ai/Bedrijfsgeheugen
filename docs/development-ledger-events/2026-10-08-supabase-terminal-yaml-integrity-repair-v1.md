# 2026-10-08 — terminal YAML integrity recovery

- Bad protected merge: d3c28f375354adbc623003de0a06e2b6a791f3fe (PR #4143).
- Symptom: workflow_dispatch refused with HTTP 422 and no new automatic terminal closure.
- Root: malformed shell pattern followed by duplicate YAML tail from unsafe JavaScript replace `$'` interpolation.
- Repair: restore last proven workflow source, retain edge/runtime gates, isolate migration-only provider proof and add structural tests.
- Rollout: protect merge, verify manual trigger, replay canonical obligation for PR #4128 with readback evidence.
