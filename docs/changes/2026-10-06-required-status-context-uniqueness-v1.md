# Required status context uniqueness — 2026-10-06

GitHub branch protection depends on a single protected check context named `test`. Fourteen unrelated workflows also emitted a job with that exact name, so a fast unrelated success could satisfy branch protection before `Required test` completed.

This change renames every non-authoritative `test` job to a workflow-specific unique context. `.github/workflows/required-test.yml` remains the sole owner of `test`.

A regression test scans all workflow files and fails if any second owner is introduced. No required gate is removed or bypassed.
