# 2026-10-21 — CI inherited i18n baseline source-contract repair

- Obligation `ci-inherited-brain-i18n-runtime-fixture-20261021`; fingerprint `ci|inherited-brain|i18n-transform-runtime-fixtures|v1`.
- Observed: PR #4573 BRAIN backend run 39554866582 red, 355 failures reproduced on unmodified main; Portal and protected Required/CodeQL were independently green.
- Root cause: inherited i18n tests matched obsolete implementation-local spelling and pre-build pricing HTML, not the canonical build transformer’s actual behavior.
- Delta: preserve all assertions as runtime fixture tests of CSS+JS, retained CTA, mobile route localization, duplicate prevention and idempotent repeat; one isolated helper. Include skill, learning, System Map and human change note.
- No changes to release workflows, migrated SQL, provider authority, tenant access or production; no claim of full suite green.
- Follow-up: required exact-head BRAIN + protected checks; open inherited SQL/other baseline obligations under #3742. Real customer A/B readbacks remain open in #4215.
