# 2026-09-29 — System-map non-deployment classification

Observed:
- skills/agents/chats borging merged successfully;
- system-map `.mjs` caused website deployment applicability;
- Production Source Snapshot attempted an unrelated Netlify deploy;
- terminal closure could not prove a deploy that was not required by the user-facing change.

Root cause:
- canonical system map was not declared non-executable governance;
- Production Source Snapshot path filtering did not exclude the system map/control-plane classifier.

Fix:
- classify canonical system map as non-executable shared governance;
- exclude system map and Brain delivery classifier from automatic source deployment;
- add regression coverage;
- preserve explicit deployment-not-applicable readback for governance-only changes.

Production Source Snapshot follow-up:
- observed that the recovery commit still activated website delivery;
- root cause: `.github/workflows/production-source-snapshot.yml` remained unscoped shared executable work;
- fixed by classifying that workflow as backend control-plane;
- added exact regression coverage for the combined system-map + delivery-tool + snapshot-workflow change set;
- production website delivery remains mandatory for actual website/portal/Netlify-runtime changes.
