# CodeQL main-push fan-out prevention — 25 september 2026

Generic CodeQL was still triggered by every push to `main`, even though its pull-request trigger was correctly scoped to Python changes. During the Actions queue incident this consumed runner capacity for unrelated control-plane merges.

The main-push trigger now mirrors the PR ownership scope: Python files and the CodeQL workflow itself. A regression in `tests/brain-ci-admission-single-flight.test.mjs` makes that invariant executable.

Fingerprint: `github|codeql-main-push|path-scope-python|v1`.
