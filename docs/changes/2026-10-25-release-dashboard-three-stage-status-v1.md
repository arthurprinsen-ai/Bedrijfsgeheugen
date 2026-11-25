# Release status separation

The release classifier is no longer a single boolean. GitHub release, Netlify deployment applicability/completion and independently observed production readback have separate statuses.

Intentional non-deployment has `not_required` and a reason; it is not a failure. Unknown applicability and unverified production never go green. Deployment is only complete with a fresh matching production release.

Implementation: `tools/netlify/release-status.mjs`, associated regression tests, and `.agents/skills/release-deployment-readback/SKILL.md`.

This change is on a draft PR. Dashboard adapter integration and CI/provider validation are outstanding, so do not describe this draft as a deployed production fix.
