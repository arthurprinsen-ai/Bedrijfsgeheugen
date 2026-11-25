# Tavily lesson corrected after reading bg-bedrijfsnieuws — 2026-11-06

## Problem
The PROVEN lesson `tavily|pipeline|shared|plan-limit-432-read-as-no-results` said the same blind spot was open in `bg-bedrijfsnieuws`. That was a guess made before the source was read.

## Change
- `docs/brain/delivery-failure-lessons.json`: one sentence in that lesson now states what the deployed function (version 12) does: it throws `TAVILY_<status>` on a non-ok response and records a failed `bg_bewijs`.
- `brain/learning/2026-11-06-system-error-register-v1.json`: the matching known limit is corrected.
- No rule, fingerprint or test changed.

## Known limit
Zero hits on 26-29 October are not explained.
