# P0 security admission classification — 2026-10-29

- Canonical incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE`; existing incident issue #5072.
- Observed blocked PR: #5083; failure: exact `.gitignore` is unclassified by the protected delivery admission.
- Root cause: canonical delivery lane map lacks the exact security-critical root ignore file.
- Proposed safe change: classify only `.gitignore` as `backend`, without accepting other hidden paths.
- Negative regression: `.unknown-sensitive-dotfile` must remain unclassified and fail closed.
- Single owner, protected merge, full admission/Required/BRAIN/CodeQL required; do not force or bypass.
- No new scheduler, publisher, network endpoint, secret or public private evidence is introduced.
- Main-tip cleanup #5082 already proven; historical PRs remain an open separate issue.
