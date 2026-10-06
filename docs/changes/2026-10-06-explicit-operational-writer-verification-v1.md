# Explicit operational writer verification — 2026-10-06

Repository Writer Operational Verification no longer starts on every pull request. It is now an explicit dispatch-only verification tool with immutable writer, base SHA, execution ref and execution SHA inputs.

The verifier validates exact ref identity and current-main overlap, dispatches the selected writer once in candidate mode and exits. It no longer polls up to six minutes for a writer PR and no longer duplicates immutable Shadow dispatch; all seven writers own that event-driven handoff themselves.
