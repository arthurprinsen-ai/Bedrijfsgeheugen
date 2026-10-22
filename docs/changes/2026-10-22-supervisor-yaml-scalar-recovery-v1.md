# Supervisor YAML scalar recovery

Fingerprint: `github-actions|supervisor-reenable|unexpected-push-zero-jobs|20261022`.

The existing Delivery Recovery Supervisor cannot start jobs because its embedded AWK and Node programs escape the YAML `run: |` block. The workflow blob from failed run 39813685306 is identical to the inspected current-main blob. PyYAML 6.0.3 rejects line 311; a zero-job push-shaped failure alone therefore does not establish a provider-trigger defect.

The candidate adds only the missing scalar indentation around both embedded programs. YAML removes that indentation before shell execution, so the Node heredoc delimiter remains at shell column zero. The existing supervisor test now extracts literal shell blocks according to their indentation boundaries and checks them with `bash -n`. It requires only existing Node and bash; no parser dependency was added.

Local replay was 20 passing tests and one genuine truncated-shell failure before repair, then 21/21 passing after repair. Separate local actual-YAML parsing and all three parser-extracted shell scripts also pass. These results do not establish hosted CI or live controller recovery.

Publication belongs to the existing supervisor recovery lineage. PR #4008 covers same-lineage recovery but its inspected head still contains an invalid Node block; PR #4663 covers ghost capacity and does not repair this workflow. Protected source/security checks, provider readback and authorized bounded runtime verification remain open. The workflow was neither enabled nor dispatched; queue thresholds, schedules, leases and security gates were not changed.
