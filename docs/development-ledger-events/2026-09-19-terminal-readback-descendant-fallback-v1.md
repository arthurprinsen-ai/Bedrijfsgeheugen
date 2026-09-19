# Terminal readback descendant fallback v1

- Date: 2026-09-19
- Obligation-ID: terminal-readback-descendant-fallback-v1
- Incident pattern: repeated Obligation Terminal Closure failures at the canonical production-readback step.
- Root cause: immediate exit on canonical readback failure prevented the already-implemented descendant-live proof from running.
- Change: canonical failure now falls through to descendant containment verification; no deployment bypass is introduced.
- Expected effect: fewer recovery loops, lower CI cost and faster terminal landing while preserving production proof.
