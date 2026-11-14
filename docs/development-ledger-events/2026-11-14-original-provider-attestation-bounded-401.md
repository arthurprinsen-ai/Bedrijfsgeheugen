# 2026-11-14 — originele Supabase read-only release-attestatie, eenmalige 401

- Incident eigenaar: bestaande Security / Supabase Edge Production Authority; P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232; commerciële afhankelijke #4198.
- Bewijs: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43607583476; bij eerste poging drie provider-downloads succesvol, vierde 401 Invalid access token; orig. fail; zelfde workflow één keer herstart en daarna success.
- Onafhankelijke productiereadback originele content-loop v874, 9 van 9 runtime files byte-voor-byte identiek met GitHub main; geen Meta post of nieuwe Gmail-mail uit dit bewijs afleiden.
- Oorzaak: een geïsoleerde 401 werd als blijvend verlopen token geïnterpreteerd zonder hercontrole. Exacte 401-herkomst niet bewezen.
- Herstel: beperkte 3x read-only hercontrole op **dezelfde** Supabase functie bij alleen 401, daarna permanent ongeldig -> exit 78 / eigenaar; non401 behoudt originele bounded convergence; credential geheimen niet gelezen, geldige auth onmisbaar.
- Regressie: `tests/brain-original-supabase-provider-401-recheck-20261114.test.mjs` (goed / transient / permanent / 503). Agent: `platform/agents/agent-team.mjs`; skill: `.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md`; permanente regels: `AGENTS.md`; leerrecord `brain/learning/2026-11-14-supabase-provider-401-bounded-recheck-v1.json`.
- Volgende controles: protected checks, main merge, handmatig exact 1 bestaande function slug als read-only attestation op original workflow, Supabase-provider-vs-main bewijs; commerciële post-/send-outcomes apart OPEN tot externe readback. Geen tweede scheduler of parallel uitvoerder.
