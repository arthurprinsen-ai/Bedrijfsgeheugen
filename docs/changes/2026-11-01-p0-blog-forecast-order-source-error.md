# P0 #5232 — the original AI blog regeneration repeated a false deadline forecast

**1 Nov 2026; source candidate, NOT a published article.** The original daily blob still lacks an external/public readback. RVO https://www.rvo.nl/subsidies-financiering/cpnl reports the actual 2026 CPNL close **6 October**.

## Verified recurrence
The original secured source-repair release PR #5239 merged to main eedc3f8 and deployed original blog queue v300, export v296, content orchestrator v507 and content-loop v477, all independently ACTIVE and exact source-parity. Original authorized same-date blog repair through original channel `pg_net 18292` returned HTTP200 `generated:true` and persisted new headline/body at 2026-11-01T13:12Z. New body **“Onze forecast verwacht dat de Circular Plastics NL-subsidie op 6 oktober 2026 opengaat”** is STILL FALSE on 1 November. Original `blog_quality_repair.rejection_codes` showed `BLOG_RUN_DATE_INVALID` because original Postgres date object was stringified rather than ISO YYYY-MM-DD. Shared guard had only matched opener BEFORE date, not inverted date-before-opener.

## New source-level prevention
Original single shared `blog-official-date-truth.mjs` must detect a future forecast/open claim on already-closed **6 October 2026** for CPNL even when date appears before “opengaat”; scope by CPNL, claim and clause rather than global arbitrary date. Preserve actual historically true closure and unrelated SOPV open periods. Original blog reader-ready must safely normalize native Postgres dates before calling same shared guard, not hide root cause behind generic invalid date. Original queue/export continue consuming exactly that shared guard. Read-only/approved content recovery from the same original CAS claim, never publish inaccurate text, auto-approval or invented revised scheme.

## Required independent proof
Protected Required+CodeQL+preview; exact original Supabase 3 function runtime source-parity and JWT; real original source-safe model output with truthful title/body, CMS editorial/Required PR, original GitHub protected daily-blog writer→main→Netlify, public exact article URL readback and 7 natural no-recurrence runs. Keep ONE BRAIN incident VALIDATED but PROVEN false until demonstrated, the one original scheduler active, and no parallel writer.
