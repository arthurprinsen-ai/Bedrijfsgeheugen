# 2026-09-29 — Instagram provider ID drift v3

Production incident: publication-ready Mira Reel failed provider identity preflight because a historical numeric Instagram ID was hardcoded.

Fix: live identity discovery and same-providerUserId binding across create/publish/readback; skill, agents, chats, Brain and System Map updated.
