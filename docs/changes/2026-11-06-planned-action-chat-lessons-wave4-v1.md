# Planned-action guard reads chat lessons, wave 4 — 2026-11-06

## Problem
The planned-action guard blocks a rule only when it has a trigger and a PROVEN lesson. It read lessons from `docs/brain/delivery-failure-lessons.json` only. 19 active rules have their lesson (root cause, required action, fingerprint) in the chat-learning shards, which the delivery preflight already treats as PROVEN. The guard did not see them, so these rules could not block, and #5506 correctly left them without a trigger because a trigger would do nothing.

## Change
- `scripts/brain/planned-action-guard.mjs`: `loadChatLessons` reads the same five chat shards as the preflight; `loadGuardKnowledge` returns delivery lessons first, then chat lessons.
- `tools/delivery-preflight.mjs`: the planned-action guard receives the delivery lessons plus the chat lessons it already builds.
- `config/planned-action-triggers.json`: 19 phrase triggers appended. `DO_NOT_AUTO_FIX_PERFORMANCE_INFO` uses `supabase advisor`, not `advisor`, after a precision check hit "strategic advisor".
- `tests/brain-planned-action-chat-lessons-wave4-20261106.test.mjs`: lesson, trigger, guard and canonical-preflight checks, a precedence check and a false-positive check.
- No existing trigger, rule or lesson edited. No lesson invented.

## Not changed
No rule text, no lesson text, no second guard or scheduler.

## Order with #5506
#5506 appends 41 triggers to the same file. Either can merge first; the second needs a trivial rebase of the end of the triggers array. This change does not assert full trigger coverage, so it passes with or without #5506.

## Known limit
Recall is not measured. Positive examples are written by hand. Precision: 0 of 8 neutral actions and 1 hit in 400 recent commit titles. A trigger blocks until the agent names the rule, so a too-broad trigger blocks unrelated work; review the triggers with hits first if agents report friction.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure.
