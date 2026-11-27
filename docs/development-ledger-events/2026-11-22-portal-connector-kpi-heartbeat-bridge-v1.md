# Ledger: gekoppelde KPI naar originele Heartbeat

Date: 2026-11-22
Obligation: portal-original-connector-kpi-bridge-v1
Lane: portal/connector original
Parent issues: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
State: SOURCE_CANDIDATE; production proof due

Root cause: Koppeling Studio bood alleen configuratie/safe-tests en de Portal V2 Heartbeat las uitsluitend hardcoded numerieke portaalvelden. Daardoor was een reeds ingestelde koppeling geen aantoonbare KPI-bron. Ook een ander portaalgetal mocht niet als fallback voor een connectorregel dienen.

Fix: klant kiest per regel expliciet tenant-bound connector/veld; originele backend leest alleen live-geverifieerde uitvoerings- en opgeslagen bronrecords op exacte tenant, definitieversie, bronveld en provider-revisie. Gehasht Heartbeat proof en same-tenant readback; geen provider write, geen nieuwe cron, geen fake sampledata. Consumer met vendor-authorized actual ingestion nog apart OPEN.

Verification: Required (admission, historical/shadow/canary), CodeQL, Portal, backend, Supabase preview, Netlify production SHA en original Edge get-function source/readback. A native browser with 2 authenticated tenants and real authorized AFAS/Exact/Salesforce ingestion remains outstanding until actual client account consent and provider proofs exist.
