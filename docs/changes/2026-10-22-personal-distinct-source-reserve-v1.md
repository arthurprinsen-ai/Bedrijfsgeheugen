# 2026-10-22 — bestaande BRAIN-orchestrator geeft unieke founderbronnen een reserve

Root cause: slechts één geverifieerde persoonlijke LinkedIn-kandidaat per dag; de unieke verhaalcontrole blokkeert terecht tekst gelijk aan 15 oktober, maar krijgt geen brongebonden tweede optie.

De bestaande orchestrator hergebruikt de canonieke v2-bronregistratie en materialiseert maximaal drie idempotente alternatieven in dezelfde recommendationtabel. Iedere suggestie vereist een werkelijk vastgelegd voortgangs-event, fout-/leerevent of toegestaan extern ondernemerssignaal met expliciete provenance. Ontbrekende bron betekent geen alternatief. Externe context of machinegebeurtenissen zijn geen verzonnen persoonlijke ervaringen of gerealiseerde klantresultaten.

Geen nieuwe SQL-migratie, previewbranch, cron, externe verzender of aparte waarheid. De twee bestaande Supabase-previewbranches voor PR #4558 en #4573 blijven onaangetast. De independent prepublish, personal identity, global duplicate, authority-consumption, OAuth, external ID en readback-gates blijven volledig gelden. Dit verandert kandidaten, niet publicatiebewijzen.

Acceptance: gerichte regressies, Brain learning historisch/schaduw, Required/CodeQL/backend, exacte beschermde merge, deployed Edge-source parity, werkelijke providerpublicatie zonder duplicaat en zeven dagen correcte uitkomsten.