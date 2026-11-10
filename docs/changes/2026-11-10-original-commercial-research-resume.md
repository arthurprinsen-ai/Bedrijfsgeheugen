# 10 november 2026 — P0 één commerciële lus: verifieerbaar onderzoek opnieuw naar de originele composer

## Productiebewijs en oorzaak
Live Supabase read-only, 10 november ~10:52–11:00 CET:
- 23.295 connecties, circa 18.000 vandaag verrijkt; 605 met bekend e-mailadres. Verrijking is geen verzendconsent.
- 12 oorspronkelijke `autonomous_email` acties in laatste 7 dagen; 5 research DONE, 1 door kwaliteit geconsumeerd, 11 gebroken/onbewezen overdrachten, 0 provider-bevestigde mail in scorecard.
- Exact **één** bestaande `waiting` actie met `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`, eerder geslaagde composerkwaliteit, afgerond gekoppeld research, en exact onafhankelijk gecontroleerd actueel nieuwsbronbewijs.
- De oorspronkelijke `powerhouse_commercial_message_candidates_v1` en de filter in `powerhouse-commercial-message-composer` sluiten een `quality_passed` concept uit, ook als brongebrek later door nieuw gecontroleerd research bewijs opgelost wordt. Resultaat: brononderzoek komt wel binnen, maar de consument pakt het niet op.

## Gerichte oorspronkelijke reparatie
- SQL versie `20261110140500_original_commercial_verified_research_resume_v1.sql`: dezelfde oorspronkelijke kandidaten-RPC accepteert opnieuw `waiting/SOURCE_SPECIFIC_EVIDENCE_REQUIRED` met gekoppeld `research_enrichment=done`, identiteit/person/company/source match, gecontroleerde `bg_bedrijfsnieuws`, 14-dagen research en 30-dagen actuele news-ophaalvenster. Geen andere rij opgewaardeerd.
- De bestaande composer behandelt zulke heropende kandidaten opnieuw, **ook** bij eerder geslaagde conceptkwaliteit. Iedere broncheck, feitcheck, semantic novelty en copy quality draait opnieuw. Alleen de oorspronkelijke composer kan `prepared` zetten. Geen rechtstreeks herstel naar `done`, geen provider-call door SQL.
- Originele `powerhouse-autonomous-outreach` verifieert menselijke/relatie-toestemming, suppressions/opt-out, atomische claim, provider-ID, onafhankelijke Gmail SENT en ontvanger-readback. Onzekere send outcomes blijven claimed; nooit automatisch opnieuw versturen.
- Originele `powerhouse-commercial-learning-v1`, ONE BRAIN en Heartbeat blijven op dezelfde scheduler. Geen tweede cron, queue, provider/CRM, fallback, uitwijkpublicatie of valse omzet/experimenteffecten.

## Acceptatie als bewijs, niet als belofte
1. Required, CodeQL en Supabase Hosted Preview voor **dezelfde PR-head** slagen; protected merge en GitOps-exacte provider/source migratie-readback.
2. Originele composer Edge is bijgewerkt en op hash/version herleidbaar. De eerstvolgende natuurlijke tick behandelt de bestaande gededupliceerde actie en schrijft een nieuwe bron-/kwaliteitshandshake.
3. Zonder nieuw correct bewijs blijft die actie `waiting`. Met bewijs en geslaagde nieuwe copyquality wordt zij alleen `prepared`. Provider-uitvoering volgt afzonderlijk met toestemming en onafhankelijke readback.
4. Echte uitkomsten worden gekoppeld aan exact action ID, behandeld/controle experimenten bereiken hun vereiste sample en bewezen learning verandert een volgende natuurlijke actie.
5. Pas na volledige provider/outcome/experiment/readback mag totale lus groen. Afwezig bewijs, open consent of tokenschade blijven zichtbaar; uitvoerders blijven actief.

Regressie: `tests/brain-original-commercial-held-resume-20261110.test.mjs`.
Canonieke open incidenten: [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215), [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
