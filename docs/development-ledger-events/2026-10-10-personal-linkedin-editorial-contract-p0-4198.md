# Publication quality incident — personal LinkedIn

Obligation-ID: p0-4198-personal-linkedin-editorial-contract-20261010
Date: 2026-10-10
Parent-P0: #4198
Observed public URL: https://www.linkedin.com/feed/update/urn:li:share:7514640470329778176/
Observed: raw Markdown ** and ---, public unsupported "seven in ten" claim, internal status reporting, unapproved personal final copy in canonical artifact.
Root cause: build event source status used as surrogate for actual personal voice and content editorial approval.
Fix: three-stage hard editorial gate in existing content orchestrator, independent identity reviewer, and single-writer social publisher. Exact shared policy version, never bypass daily uniqueness, no additional fallback senders.
Test: tests/brain-personal-linkedin-editorial-contract-p0-4198.test.mjs
Evidence requirements: protected CI, Edge production source parity, exact original negative-case review and positive-case review, no republish of existing personal post.
