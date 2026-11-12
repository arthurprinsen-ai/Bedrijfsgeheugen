# Trusted Advisor customer truth — source-evidence development event — 2026-11-12

- **Fingerprint:** `powerhouse|trust|unsupported-claims-and-outcome-status|20261112-v1`
- **Original obligation:** `portal|trusted-advisor-evidence-integrity|20261112-v1`; original Portal V2 assurance + CMS/website editorial owner
- **Original incident state:** source observations verified in main branch; proposed repair CANDIDATE; not an independently verified live customer result
- **Learning:** `brain/learning/2026-11-12-trusted-advisor-customer-truth-v1.json`
- **Human-readable documentation:** `docs/changes/2026-11-12-trusted-advisor-customer-truth.md`
- **PR:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5678
- **Scope:** existing portal assurance, primary site pages, existing mobile menu, original editorial skill + policy, tests/docs; no second scheduler or provider

## Evidence and root cause
The existing navigation promised a seven-question free scan whereas the actual scan page says twelve questions and three minutes. Contact/hidden finish messages promised emailed reports despite the anonymous on-screen result. Four main website pages asserted general deployment within two weeks. More critically, the Portal V2 trust UI had allowed `healthy !== false` and `status=ok` to imply a healthy source or independently verified outcome. These are direct source-code observations, not measured user harm.

## Repair / prevention
Retain original application and its writer lease. Align copy with the actual free scan, differentiate paid Frisse Blik, remove unconditional universal delivery promise and reduce self-appointed badges. Require explicit source health and individual outcome proof references before verified status. Carry the invariants in the original policy/skill; regression coverage checks both source failure and site/customer journey copy drift.

## Evidence due
- GitHub Required + BRAIN + CodeQL exact-head checks
- protected merge and Netlify exact-SHA production readback
- browser-level check on actual website and authenticated Portal V2 tenant
- actual independent proof metadata, not a generic process-success flag
- original ONE BRAIN consumer processed ACK and consent-safe subsequent conversion measurements

**Release and measured trust status: NOT_PROVEN.** Do not close on a candidate commit or claim conversion/retention uplift without actual outcomes.
