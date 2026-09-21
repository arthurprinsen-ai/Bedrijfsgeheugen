# Terminalizer obligation boundary

The obligation terminalizer now stops supersession traversal when a historical predecessor belongs to a different `Obligation-ID`. This preserves same-obligation migration verification while preventing unrelated historical obligations from blocking an already-proven production release.
