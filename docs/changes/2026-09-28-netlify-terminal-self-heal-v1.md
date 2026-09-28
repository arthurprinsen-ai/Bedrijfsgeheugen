# Netlify terminal self-healing — 28 september 2026

Fingerprint: `delivery|netlify-terminal-self-heal|v1`.

## Incident

A production recovery was still describing SHA `6a57a333…` as the terminal target while protected `main` had already advanced to `a7bc8529…`. Netlify provider truth showed deploy `6aba29af6a9120db859fa44c` as `ready`, `production`, with `commit_ref=a7bc8529…`.

The earlier write-proxy expiry therefore must not remain a user-visible pending state once a newer protected-main production is already proven.

## Permanent rule

Every delivery node now preflights current GitHub `main` and current Netlify production before a transport write. Expired transport is recoverable: reacquire once, re-read provider truth, and only then retry if the current protected main is still not live.

An old expected SHA may be closed only through repository-proven safe supersession. Terminal success requires ready + production + current-main/safe-supersession identity + browser/readback green. Pending deploy/proxy state is never a terminal user handoff while autonomous recovery remains possible.

Inheritance is explicit for chats, agents, skills, workflows and future capabilities.
