# BG169 signed rollback canary — 2026-08-28

Purpose: prove a history-preserving rollback can restore the exact last-known-good tree while the resulting `main` commit is GitHub-verified through a guarded pull-request merge.

This file is intentionally docs-only and must disappear again after the rollback acceptance test.

Safety invariants:
- no runtime website files change;
- exact candidate/base SHA gates;
- rollback branch starts from exact promoted main;
- rollback commit tree equals the pre-canary LKG tree;
- rollback PR head is SHA-guarded;
- resulting merge commit must be GitHub verified;
- Netlify production must be READY on that exact merge SHA.
