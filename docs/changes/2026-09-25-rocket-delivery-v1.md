# Rocket Delivery v1

Bedrijfsgeheugen now consolidates GitHub delivery around one protected PR authority instead of allowing multiple heavy workflows to prove the same candidate independently.

## What changes

- Required test remains the single required status check.
- Canonical shell full-build becomes explicit diagnostic work rather than automatic PR fan-out.
- V18 promotion no longer duplicates the canonical PR lane.
- Production release/source work is limited to applicable main changes.
- CodeQL only starts for relevant source/dependency changes and uses a stable concurrency group.
- SEO post-merge work is path-scoped.
- Shared Agent Memory testing is removed from every-main execution.

## Why

The previous topology spent runner capacity on duplicate or non-applicable checks. With many agents/chats working concurrently, that creates queue amplification rather than useful parallelism.

## Safety

This change does not bypass protected main, the required test, exact production identity, or production readback. It changes admission and trigger scope, not the definition of production truth.

The PR event itself is also part of the proof: metadata changes require a fresh head event rather than rerunning a stale event payload.
