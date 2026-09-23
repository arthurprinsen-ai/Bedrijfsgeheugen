# Pricing responsive/i18n production promotion — 2026-09-23

## Why this promotion is required

The functional fix passed preview, desktop/mobile browser validation, CodeQL, delivery admission and regression tests, and was merged to `main`. Netlify production nevertheless continued serving an older deployment. Therefore the website was not yet live with the merged code.

## Recovery

This candidate intentionally changes only the operational marker in `.github/workflows/production-source-snapshot.yml`. On protected-main merge, that workflow packages the exact source SHA, invokes the existing authorized Netlify transport, and verifies the deployed identity through public `release.json`.

## Definition of done

The promotion is complete only when Netlify production exposes the exact new protected-main SHA in production context and public pricing readback confirms the canonical page. NL and EN pricing routes are then checked separately before the incident is marked live and proven.
