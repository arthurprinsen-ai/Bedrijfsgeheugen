# Development ledger — Powerhouse CI Acceleration v1

- Date: 2026-09-28
- Obligation-ID: powerhouse-ci-acceleration-v1
- Candidate-Type: implementation
- Delivery-Lane: automation
- Goal: reduce GitHub Actions time-to-terminal-proof and runner waste while preserving exact-head, security, protected merge and production readback.
- Observed root cause: duplicate domain checks/builds, repeated dependency downloads and local browser builds even when an exact-SHA preview existed.
- Implementation: Required/preflight slimming, manifest-keyed npm download cache, website build dedupe, preview reuse, mutation off PR critical path, CI telemetry.
- Regression discovered during delivery: setup-node cache was initially configured against a non-existent package-lock.json.
- Recovery: replaced the invalid lockfile cache/npm ci assumption with package.json-keyed ~/.npm caching plus npm install --prefer-offline.
- Regression evidence: tests/brain-ci-critical-path-acceleration-v1.test.mjs.
- System Map: platform/system-map/canonical-system-map.mjs registers Powerhouse CI Intelligence & Acceleration.
- Human architecture: docs/powerhouse/POWERHOUSE_CI_ACCELERATION.md.

- Scope synchronized to 18 files after moving the release-control regression contract into this lineage.

- Browser-runtime regression contract migrated from duplicate page-seo/local-only assumptions to build-once plus exact-preview reuse with local fallback.
