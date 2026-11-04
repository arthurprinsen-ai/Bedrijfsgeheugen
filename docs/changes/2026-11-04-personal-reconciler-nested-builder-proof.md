# 4 november 2026 — ONE BRAIN persoonlijke LinkedIn-bron onterecht geblokkeerd

## Oorzaak met productie-evidence
Bij de controle rond 06:14 Nederlandse tijd bestaat de echte `identity_gate_evidence` in `powerhouse_channel_decisions` van 4 november met een geldige `ai_native_builder_story_verified=true`, `build_event_verified=true`, `arthur_anchor_verified=true`, `source_backed=true`, `business_topic=true`, correcte identiteit en dertien bronreferenties. De originele `powerhouse_reconcile_content_outcomes_v1` leest deze vlaggen echter alleen op het bovenste niveau van `delivery_evidence`. Het bovenste niveau bevat ze niet; de onafhankelijke gepubliceerde broncontrole zit genest. De functie produceerde daarom opnieuw `PERSONAL_SOURCE_UNVERIFIED` en het originele dagkanaal bleef `BLOCKED` ondanks goedgekeurde redactie.

## Bronvast herstel, geen afgezwakte controle
Deze PR wijzigt alleen de oorspronkelijke PostgreSQL-reconciler. Hij behoudt persoonlijkheids- en observatiecontrole en accepteert de geneste AI-native-builderevidence uitsluitend met álle oorspronkelijke bron-, privacy-, organisatie-stem-, identiteit- en afstammingsvoorwaarden. In deze PR wordt geen publicatie, toestemming of status als LIVE_PROVEN verzonnen. Ook de oorspronkelijke providercheck, internationale LinkedIn-deduplicatie, media-eis Mira >=0,940 en afzonderlijke blogreview blijven intact. De geplande posts staan voor 4 november 07:00 UTC; hun echte status kan pas na de eigenaaruitvoering en onafhankelijke teruglezing worden afgesloten.

## Borging
Regressie `tests/brain-personal-reconciler-nested-builder-proof-20261104.test.mjs` met historische replay, schaduwcontrole en canary. Machinelearning `brain/learning/2026-11-04-personal-reconciler-nested-builder-proof-v1.json`, bestaande agent-skill en volledig ontwikkellog. Alleen protected GitHub Required/CodeQL/BRAIN plus echte Supabase migratie en daaropvolgende productiereadback sluiten dit specifieke technische incident af. Onbewezen publicaties en overige 23 actieve blokkades blijven expliciet open.

- Centrale registratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
