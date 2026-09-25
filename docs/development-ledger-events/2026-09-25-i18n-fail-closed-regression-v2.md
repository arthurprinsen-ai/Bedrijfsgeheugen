# 2026-09-25 — i18n fail-closed regression recovery

Observed live: current production main was healthy at deploy level but `/en/prijzen` remained Dutch.

Cause: production static translation had regressed from fail-closed back to provider fallback + untranslated output.

Recovery lineage restores the production throw/required guards, strengthens tests and skills, and refreshes Production Source Snapshot so merge triggers exact Netlify deployment plus production browser interaction proof.

Terminal closure requires: protected CI green → protected merge → Netlify exact main SHA ready → `/en/prijzen` visibly English → pricing interaction browser proof green.
