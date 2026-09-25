# Main push fan-out budget

After PR single-flight consolidation, a merge to `main` could still start deployment, production browser readback, Shared Agent Memory, SEO and CodeQL independently even for closure-only commits.

Production Source Snapshot and Production Release Readback now ignore pushes whose complete delta is docs, tests, GitHub governance, agent skills or Brain learning. Canonical shell, SEO and CodeQL pushes are domain scoped. Shared Agent Memory no longer duplicates its pre-merge coverage on every `main` push. Main Write Integrity intentionally remains active for every main write.

Mixed commits containing any non-ignored runtime path still execute production delivery because GitHub `paths-ignore` skips only when every changed path is ignored.
