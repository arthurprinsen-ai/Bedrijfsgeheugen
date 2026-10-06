# One Brain cross-system authority v1 — 5 oktober 2026

## Doel
Powerhouse functioneert als één hart/brein over vier projecties van dezelfde lineage: GitHub is code/contract authority, Supabase runtime truth/state/learning authority, Netlify production execution authority en Notion knowledge/handoff authority. Geen laag is een zelfstandig brein.

## Gevonden drift
De Netlify-functie `buffer-social-collect` had nog een autonome zesuurs-schedule terwijl Buffer retired hoort te zijn. De GitHub compatibility-workflow droeg nog Buffer-first semantiek en testte de schedule. Daarnaast riep sales closed-loop v6 de compound-learning producer opnieuw aan terwijl die al een eigen cron-owner heeft.

## Structurele reparatie
Buffer blijft alleen historische/manual telemetry; de Netlify schedule is verwijderd en de compatibility-workflow vereist hem niet meer. De retired Netlify surface is expliciet geregistreerd. In Supabase is `powerhouse-daily-compound-learning-v1` de enige scheduled producer en sales v6 consumeert uitsluitend de canonieke materialized learning evidence. De runtime authority gate faalt bij dubbele owner, retired scheduler of dubbele action/outcome dedupe-groepen.

## Terminale waarheid
Deze wijziging is pas terminal wanneer protected GitHub merge, exact-main Netlify production readback, Supabase runtime gate en Notion Canonical System Map dezelfde authority aantonen. Een PR, deploy-start of runtime-only groen is niet voldoende.
