# 2026-10-23 — CodeQL-specifieke adviesrouting, canoniek #4661

- Provenance: exact Janitor [#39928058144](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39928058144), artefact ID `12489814292`; CodeQL JS/TS 199000ms/job 120328545101, Netlify parity 106000ms/job 120328733393.
- Causale routeringsfout: de bestaande Powerhouse-adviesactie zegt Required preflight onderzoeken terwijl het langzaamste bewezen providerjobobject `CodeQL javascript-typescript` heet. Tijdmeting en jobidentiteit zijn bewezen; oorzaak van de 199 seconden **niet** bewezen.
- Herstel: kleine zuivere herkenning in dezelfde `ci-agent-priority.mjs` kiest CodeQL-specifiek onderzoek zonder CodeQL te omzeilen; de bestaande Required-preflight-actie en alle deny gates blijven hetzelfde.
- Leerborging: één fingerprint in #4661, bestaand skill-target, replay/shadow/canary op het bestaande canonieke Brain-testbestand, geen nieuwe scheduler/writer/queue/incident. Verwachte vervolgobservatie blijft readonly; productie-live nooit aannemen vóór providerreadback.
