# 3 november 2026 — Mira-afkeuring duurzaam terug naar oorspronkelijke eigenaar

## Oorspronkelijke productiebevinding
Een nieuw OpenArt-videobestand was technisch geschikt: 1080×1920, acht seconden, zonder geluid. De onafhankelijke oorspronkelijke Mira-router heeft het eerste beeld vervolgens afgekeurd met `VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH`, confidence **0,900**, minimaal **0,940**. De originele submit-aanroep leverde HTTP 422. Er was géén media-PASS, Meta-provider-ID of Instagram-publicatie.

De extra handoff-fout: de providercreatie was gestart vóór een exclusieve claim op de originele mediajob. De originele CAS-functie schrijft dan terecht geen afkeuringsresultaat naar een nog lege `WAITING_ASSET`-job. Daardoor kon de gebruiker een herstelbare maar onvolledige status zien.

## Gerealiseerd herstel in dezelfde lineage
De echte providerafkeuring werd onder de bestaande Mira-failure fingerprint in origineel ONE BRAIN vastgelegd. Met één afgeschermde CAS is het exacte afgekeurde historie-ID verbonden aan de bestaande en nog niet gepubliceerde job. De bestaande `powerhouse-instagram-media-router` `preflight` heeft vervolgens onafhankelijk teruggelezen en dezelfde job naar `WAITING_PROOF` overgezet: echte aanvraag **20034, HTTP 200**, met het oorspronkelijke bewijs `face=0.900`. Aantal geplaatste posts bleef nul.

Er is geen provider- of identiteitscontrole afgezwakt, geen nieuwe cron, writer, Make/Buffer-fallback, vervalsing van goedkeuring of tweede video gegenereerd. Het oorspronkelijke DAG-verhaal en de OpenArt-projecteigenaar zijn behouden.

## Preventie en release
De oorspronkelijke media-producer mag pas OpenArt-credits uitgeven ná een originele, exclusieve jobclaim en controle van de bevroren winnaar; de technische generatiepreflight is op zichzelf onvoldoende. Bewijsvelden van een werkelijke afkeuring zijn `openart_history_id`, exacte dag, oorspronkelijke job, `face_identity_confidence`, `frame_position` en immutable Brain-occurrence. Het bestaande herstelpad mag uitsluitend die originele job corrigeren. Een afgekeurd mediabestand mag nooit een nieuwe providerpublicatie bereiken.

Bronbestendige regressie: `tests/brain-mira-unclaimed-rejection-proof-20261103.test.mjs`. Agentregel: `.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md`. Machineleerregel: `brain/learning/2026-11-03-mira-original-rejection-cas-recovery-v1.json`. Beveiligde Required, BRAIN, CodeQL en merge-readback vereist vóór GitOps-implementatiestatus groen.

De publicatieketen blijft afzonderlijk RED totdat een verse daadwerkelijk goedgekeurde Mira-video drie frames ≥0,940, temporeel bewijs, exacte media-SHA, originele Meta-publicatie-ID en onafhankelijke URL-readback heeft. Geen omzet claimen zonder betaalbewijs.
