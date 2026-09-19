# Repository hygiene control plane v1

## Why

The Bedrijfsgeheugen repository accumulated thousands of historical branches and repeated generated writer candidates. This obscures active canonical lineage and increases the chance of stale candidates being mistaken for current work.

## What changed

The new repository hygiene control plane introduces a deterministic policy for generated writer PRs and writer branches. It keeps the newest generated candidate per family, classifies older candidates conservatively, and only auto-closes bot-created superseded candidates whose complete delta is explicitly marked discardable.

Orphan writer branches are only eligible for automatic deletion when GitHub compare proves they contain no commits ahead of `main`. Open PR heads, backup/archive branches, branches with unique commits, and all non-controlled namespaces are retained.

The workflow runs daily in audit mode and supports an explicit apply mode. Every run emits a machine-readable evidence artifact.

## Safety and operating rules

- Never delete unique commits automatically.
- Never delete an open PR head.
- Never infer safety from branch naming alone.
- Use GitHub compare as the deletion authority for orphan writer branches.
- Keep cleanup deterministic and idempotent.
- Treat code/PR/merge as intermediate states; terminal success still requires protected merge and main/runtime readback.

## Expected outcome

Repository hygiene becomes part of the Powerhouse control plane instead of a manual cleanup task. Repeated writer candidates and orphan branches can be reduced continuously without risking active or uncaptured work.
