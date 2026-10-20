# Development ledger · OpenAI blog metadata repair

Obligation-ID: openai-approved-blog-meta-length-recovery-20261019  
Incident: [native blog workflow 39295376055](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39295376055)

Measured: OpenAI request completed using GitHub secret; publication failed on `OPENAI_BLOG_META_INVALID`. Root cause is a generated meta field outside the strict approved range.

Action: bounded data-preserving repair of the generated SEO summary with immutable full article content and unchanged approval contract. Regression tests supplied.

Terminal expectation: checked branch, protected PR, exact-head CI, merge and genuine evidence that the approved blog reached its publisher; no fictional send or public URL.
