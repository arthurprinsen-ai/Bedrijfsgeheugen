# Planned-action triggers, third wave — 2026-11-06

## Problem
After wave2, 60 of 111 active rules still had no planned-action trigger. The guard only blocks a rule that has a trigger and a PROVEN lesson. 41 of the 60 have a PROVEN lesson and were simply not matched; the other 19 have no PROVEN lesson.

## Change
- `config/planned-action-triggers.json`: 41 triggers appended. Multi-word phrases wherever a single word matches ordinary text (`shadow`, `make`, `cache`, `pr`).
- `tests/brain-planned-action-triggers-wave3-20261106.test.mjs` in the required PR check: fails when an active rule with a PROVEN lesson has no trigger, fires each new trigger through the real guard, and fails on a false positive among 16 neutral actions.
- No existing trigger, rule or lesson edited.

## Not changed
The 19 rules without a PROVEN lesson stay without a trigger. The guard skips them, and a lesson without evidence is not invented. They need a real incident and a PROVEN lesson first.

## Known limit
Recall is not measured. Positive examples are written by hand. Precision was checked on 16 neutral actions and 400 recent commit titles (at most 3 hits per trigger); commit titles are a weak stand-in for the free text of a planned action. A trigger blocks until the agent names the rule, so a too-broad trigger blocks unrelated work. Review the triggers with the most hits first if agents report friction.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure.
