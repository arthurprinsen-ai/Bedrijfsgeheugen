# Writer control-plane lane ownership — 2026-10-06

Writer workflow definitions are now explicitly owned by the automation delivery lane. The previous broad `.github/workflows/` shared-path fallback could classify an automation-only writer change as backend + portal + website + automation and start unnecessary Required lanes.

The canonical writer workflow bundle now resolves to shared + automation only. Product runtime changes keep their existing fail-closed lane classification.
