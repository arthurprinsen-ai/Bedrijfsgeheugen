# Production visibility viewport concurrency — 25 september 2026

## Incident
Canonical brand shell production readback found the exact Netlify production commit and passed shell/SEO contracts, but the full public visibility sweep exhausted its 480s global budget at /security on the phone viewport.

## Root cause
Route checks already used bounded concurrency, but phone, tablet and desktop sweeps were still sequential. One slow viewport could consume the entire global budget before the others started.

## Fix
Phone, tablet and desktop sweeps now run in bounded parallel viewport batches. Route concurrency, navigation timeouts, font timeouts, cleanup timeouts, visibility, occlusion, content and CLS assertions remain unchanged.

This reduces wall-clock duration without weakening production proof.
