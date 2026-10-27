# Required website browser check — native Ubuntu 26 compatibility
Date: 2026-10-19
Obligation-ID: `website-browser-required-ci-ubuntu26-20261019`

## Root cause
[Required CI run 39218740644](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39218740644) failed in the `website / browser` job at `Install shared website browser runtime`. Although the shared installer is being upgraded in [PR #4455](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4455), this independent workflow explicitly injects `PLAYWRIGHT_PACKAGE=playwright@1.55.0`. On Ubuntu 26.04-x64 that version rejects the Chromium dependency install. Retrying cannot resolve a deterministic incompatibility.

## Correction
Use official Ubuntu 26.04-supported Playwright 1.61.0 in the existing website lane. This does not alter bypass policy, target environments, release-authentication checks, or production content. No second system, no replaced test and no unrelated change. Official documentation: https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md

## Acceptance and dependencies
Local regression `tests/brain-website-lane-ubuntu26-playwright-v1.test.mjs`, protected exact-head Required CI, CodeQL, merge, and later production browser readback. Linked [PR #4455](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4455) aligns the three production browser workflows and common installer. Those are separately unmerged/partially blocked until their own permissioned merge + proof. No claim of completed decision action or CMS publication.
