# 10 november 2026 — originele social-learning evaluatie → ontvangst-ACK

**Bronincident**: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
**Fingerprint**: `powerhouse|social-learning|original-hourly-evaluation-to-obligation-ack|20261110-v1`.

## Productieonderzoek, zonder bewijs te verzinnen
Oorspronkelijk `social_learning_obligations`: 189 OPEN, waarvan 182 `MISSED_OBLIGATION` / `UNVERIFIED_OR_PARTIAL_WINDOW` bij 24/48/72 uur. Van deze 182 hebben 13 een bestaande oorspronkelijke evaluatie met een numerieke providermaat; 12 hebben een providerbronwaarneming binnen ±6 uur (de verzamelingen hoeven niet identiek te zijn). Voor veel oudere historische vensters ontbreekt die bron in het eigen geheugen, of is de enige bron `OBSERVED_PARTIAL_SCOPE`, die niet als vergelijkbare volledige postmeting mag tellen. Een geslaagd uurlijks cronproces schrijft wel een ontbrekend venster, maar de oorspronkelijke keten bevestigt diezelfde verplichting niet bij het later verwerken van echt meetbewijs. Een herhaalde `record_obligation` schrijft opnieuw OPEN.

## Herstel in de bestaande keten
`netlify/functions/social-learning-evaluate.mjs` blijft de enige uurlijkse eigenaar, alle bestaande tenants blijven geïsoleerd. Na oorspronkelijke verwerking roept hij via dezelfde `_social-learning-store.mjs` de reeds bestaande Supabase `social-learning-store` aan om eerder geëvalueerde verplichtingen op te halen en te bevestigen. De extra operatie is een **actie van dezelfde executor**, geen cron, provider-reader of nieuwe bron. De nieuwe pure `social-learning-window-ack.mjs` controleert exact tenant/post/24-48-72h/evaluation-ID/provider-source-event/tijd ±6 uur en overeenkomende niet-negatieve numerieke maten. Alleen werkelijk oorspronkelijke `OBSERVED` en `PROVIDER_OBSERVED` bronnen zijn kandidaat. De originele obligation-rij krijgt alleen `MEASUREMENT_VERIFIED` (niet LEARNED, geen causaliteit/omzet) met bewijs in payload. Een duplicate `record_obligation` gebruikt nu insert-ignore-duplicate in plaats van heropening. De keten blijft beschermd door het oorspronkelijke service token; geen extra rechten of publiek endpoint.

## Agents en skills, hetzelfde origineel
Gewijzigd: `platform/agents/agent-team.mjs`, `AGENTS.md`, `.agents/skills/powerhouse-social-cro-funnel/SKILL.md`, `.agents/skills/powerhouse-self-improvement-layer/SKILL.md`. Uitvoering en echt producer→consumer bewijs gaan vóór een passief rapport. Bounded herstel en verifieerbare historische replay blijven fail-closed. Oude Buffer-snapshots zijn alleen read-only bestaande historische metingen, geen fallback-publisher.

## Verplichte kwaliteits- en productiebewijzen
`tests/brain-social-obligation-evidence-ack-20261110.test.mjs` voert echte eerdere bronformaten en vervalsingsgevallen na, inclusief één oorspronkelijke hourly-tenantrun. Gate: originele beschermde Required/CodeQL, merge via bestaande release, Supabase Edge bundle + Netlify productie-SHA readback, één natuurlijke echte scheduleruitvoering, en echte latere post met toegepast learning-ID en gemeten uitkomst. Tot deze individuele bewijzen geleverd zijn mag geen technische succes-ACK worden omgezet in experimentwinst.

Status bij vastleggen: **source candidate**, geen voorafgaande liveclaim.
