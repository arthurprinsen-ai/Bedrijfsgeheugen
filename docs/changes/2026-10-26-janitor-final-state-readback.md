# Janitor final-state readback

Obligation-ID: janitor-final-state-readback-20261026

Observed GitHub Actions run #40301736078 failed the independent readback with `JANITOR_READBACK_FAILED:#3995:open`. The same cleanup run may deliberately reopen a planned-to-close PR when its terminal writer lease has no valid successor. Readback now verifies the final state *after both action phases*, accepting `open` only when the current run recorded `AUTO_REOPEN_TERMINAL_LEASE` for that PR; otherwise `closed` remains mandatory. For any expected open state, `merged=false` is also checked. Branch deletion and dedicated terminal-lease reopen readbacks remain mandatory. No producer state is forged and no check is skipped.
