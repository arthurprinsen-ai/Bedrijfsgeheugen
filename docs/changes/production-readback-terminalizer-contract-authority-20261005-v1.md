# Production readback terminalizer contract authority — 5 October 2026

## Trigger

PR #3808 merged at `9f4758aa72241773abe3b5711a038c7ac5c1a8e6`, but the post-merge Powerhouse Obligation Terminalizer failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.

## Root cause

The terminalizer still maintained a private hardcoded governance-path list. PR #3808 had already made `brain/contracts/production-readback-v1.json` the canonical source for `productionTruth.verifierOnlyPaths`, so the terminalizer disagreed with the release classifier, source snapshot and supersession resolver.

## Correction

The terminalizer now reads the canonical verifier-only path list from the production-readback contract before classifying the merge delta. Existing governance prefixes remain supported, but verifier-only exact paths have one source of truth.

Runtime-affecting HTML, assets, Netlify functions and shared runtime paths remain fail-closed and still require production deployment/readback.
