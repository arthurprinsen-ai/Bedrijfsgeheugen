# Supabase migration repair blank remote-cell parser fix

Issue #3742 remains fail-closed.

Trusted-main run 37425004020 attempt 4 reached the official Supabase migration-list readback. The four allowlisted replay baselines were present locally and absent remotely, rendered by the CLI as a backtick-wrapped blank remote cell. The parser removed backticks after the first trim but did not trim again, leaving a single space and incorrectly raising `REMOTE_ONLY_OR_IDENTITY_DRIFT`.

This change trims again after removing surrounding backticks in both pre-repair and post-repair parsers. It does not change the four-version allowlist, OIDC database transport, provider mutation command, or zero-drift postcondition.

No production mutation is performed by this PR. Closure still requires trusted repair success, exact #3766 checks, protected merge, and post-merge production readback.
