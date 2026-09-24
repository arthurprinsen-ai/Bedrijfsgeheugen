# Production pricing/i18n browser gate — 24 September 2026

The canonical Production Release Readback already proved exact Netlify deployment identity and generic route health, but it did not execute the pricing controls that had repeatedly regressed.

This change makes the existing interaction verifier part of the production readback itself.

The production gate now:
- waits for exact Netlify SHA;
- installs Chromium when browser proof applies;
- verifies affected routes;
- clicks the pricing lifecycle stage;
- clicks the plan group tab;
- switches monthly/yearly billing;
- uses the actual NL→EN language control;
- requires navigation to `/en/prijzen`;
- checks visible English copy and absence of the known Dutch pricing heading;
- only then evaluates immutable production truth.

A workflow change to this readback forces `/prijzen` once so the gate proves itself on introduction.
