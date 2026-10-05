# Backend install timeout v1

The backend reusable release lane previously executed `npm install` without a bounded duration. A transient package-manager or network stall could therefore keep the protected Required test in progress long after other gates had completed.

This change preserves the existing install semantics but adds two fail-closed bounds:

- the install command is limited to eight minutes with TERM followed by KILL after 30 seconds;
- the complete backend job is limited to twenty minutes.

The command is no longer silent so dependency failures remain observable. Runtime application behavior is unchanged.
