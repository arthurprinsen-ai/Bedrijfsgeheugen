# Development ledger: supervisor YAML recovery candidate

Date: 2026-10-22. Fingerprint: `github-actions|supervisor-reenable|unexpected-push-zero-jobs|20261022`.

Source baseline: protected main `6258ec1be551afebfb4d475c91394824047a2fdc`; supervisor blob `746c19281b5042950c26ad5081b2a40dd36411ae`. The same blob exists at failed run 39813685306's exact revision. Root cause is executable source syntax: column-zero AWK and Node text outside the YAML run scalar.

Local candidate: indent both blocks, add a real truncated-shell regression to the existing owned supervisor suite, and preserve the original controller behavior. RED: 20/1. GREEN: 21/0. Independent PyYAML parse PASS and extracted shell `bash -n` 3/3. No new dependency, scheduler, external write, workflow enable or dispatch.

State: CANDIDATE / RECOVERING, not live proven. Existing recovery ownership, protected exact-head checks, main readback, incident-registry writeback, skill projection and authorized bounded live verification remain obligations of the same lineage.
