# Daily blog renderer markdown leak — development ledger

- 2026-11-06, owner: daily blog publisher `tools/site-shell/publish_powerhouse_blog_artifact.py` and the content publication blocker register.
- Fingerprint: `powerhouse|daily-blog|markdown-list-in-heading-and-paragraph|20261106-v1`.
- Source: investigation of the red BRAIN backend lane (STATIC_I18N_CACHE_INCOMPLETE, fixed in #5494); root cause in the renderer; live article measured.
- Repair: heading is first line only, mixed blocks split into p and ul, fail-closed markup check, register entry, lesson, rule, test.
- Known limit: five published articles still carry the defect and are not repaired here.
- Status: CODE_CANDIDATE, not verified until protected Required, CodeQL, original BRAIN and terminal closure agree.
