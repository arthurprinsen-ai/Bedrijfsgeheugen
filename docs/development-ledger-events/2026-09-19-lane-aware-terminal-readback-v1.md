# Lane-aware terminal readback v1

- Date: 2026-09-19
- Obligation-ID: lane-aware-terminal-readback-v1
- Cause: PR #2326 spent its terminal closure waiting on website production polling despite being an automation/GitHub control-plane change.
- Change: terminal closure now resolves Delivery-Lane and uses a GitHub-main containment readback for automation-only changes that do not touch deployable runtime paths.
- Safety: runtime-touching paths still require canonical production or descendant production readback.
