# Development ledger — janitor HTTP 422 + jq SIGPIPE

Date: 2026-11-02. Obligation-ID: github|janitor-terminal-lease|bounded-successor-history|http422-sigpipe|20261101-v1
Incident #5320. Owner: existing Powerhouse GitHub delivery/Janitor control plane; accountable: arthurprinsen-ai.
Observed: 2026-11-01 run 41342975119, job 124956777904, SHA eedc3f8b380cd1e0c986cc0d0ea98854a48813e8, HTTP 422 then jq Broken pipe. Artifact 13098203266 uploaded, with five evidence files; failed-step runtime-actions JSON not included. Other two jobs succeeded; 133 supervisor drift events remain unresolved.
Failure: bounded closed-PR sample treated as complete successor proof; nonreopenable #2225 likely rejected, early while exit causing SIGPIPE. Endpoint unverified in historical log.
Fix: do not reopen on incomplete history; owner-deferred typed incident; file-backed jq/gh JSON loops; contextual provider delete errors.
Regression: tests/brain-janitor-terminal-lease-422-20261101.test.mjs. No claim of live effect pending protected exact-head checks, merge and new run/readback.
Prevention: incomplete source history cannot authorize mutation; no hidden SIGPIPE; track exact endpoint/action/provider status and affected PR/ref.
