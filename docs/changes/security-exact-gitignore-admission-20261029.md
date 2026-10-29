# P0 repair: classify only root .gitignore in protected admission

The existing delivery hygiene gate correctly rejected a proposed private-blog safety rule as `unclassified delivery path: .gitignore`. Rather than bypassing the gate, this repair adds precisely one root file to the protected backend lane of the canonical delivery path classifier. The new test confirms that an arbitrary unclassified dotfile remains denied.

The actual ignore patterns are *not* added by this PR; they remain isolated in the existing security candidate #5083, which must be readmitted and independently tested only after this protected classifier release.

The existing blog publisher, exporter, providers, queues and schedules are unchanged. No private blog bodies, personal identifiers, secrets or internal Brain payloads are copied into public Git.
