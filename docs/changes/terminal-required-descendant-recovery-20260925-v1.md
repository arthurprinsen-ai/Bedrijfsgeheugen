# Terminal Required descendant recovery v1 — 25 september 2026

Fingerprint: `github|terminal-required-descendant-recovery|website-baseline|v1`.

## Root cause
A merged website change could remain nonterminal forever when its historical Required run failed on a stale baseline assertion. The concrete incident was the old assertion that required a sequential `for (const route of routes)` loop after the visibility sweep had intentionally moved to bounded route concurrency.

## Fix
The canonical Obligation Terminal Closure now permits a tightly scoped website-only descendant recovery. It requires merge containment in current main, a green current-main website baseline including bounded visibility regression, original exact-head BRAIN and applicable CodeQL success, and unchanged production/provider readback.

The recovery is recorded as descendant regression evidence. It never rewrites a historical failed Required run into exact-head success.

## User handoff
This supports the standing terminal-handoff rule: autonomous recovery remains internal until LIVE_BEWEZEN or a genuine hard external boundary exists. Dashboard/System Map registration remains part of the terminal contract.
