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
