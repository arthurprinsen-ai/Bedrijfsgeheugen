# Social publication recovery: stable regression invocation

The canonical recurring recovery workflow checks its own safety contract before using a service-role token. The preflight check was incorrectly hardcoded to an earlier test filename, so the workflow failed even when the code was valid.

This patch aligns the assertion with the real test file and uses the full `node --test` invocation. It changes no authentication, content approval, contact policy, provider authorization, rate limit or side-effect behaviour. CI, protected merge, same-day recovery and verified provider IDs remain mandatory before an outcome is considered complete.
