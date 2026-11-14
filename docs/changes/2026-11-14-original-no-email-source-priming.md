# Eén origineel onderzoek: 2 bronnen zonder adres + 3 bestaande contactbronnen

Datum: 14 november 2026. Parent P0 #4198. Deze wijziging is een vervolg op de productie-commit die het verlies van `email_authority` repareerde en vervangt de niet-gemergede, inmiddels verouderde PR #5760. De bestaande productiebronquery uit migratie 20261114091500 wordt inhoudelijk gerespecteerd en niet met de oude 09:00-variant overschreven.

## Onafhankelijke productiediagnose
- Canonieke `bg_connecties`: 23.295 connecties, 605 met adres, 22.690 zonder adres.
- `extra.human_approved=true`: 123 contacten; **0 zonder e-mailadres**. Daardoor werden er vóór deze wijziging werkelijk nul researchacties voor ontbrekende adressen gecreëerd.
- De originele bronpriming van #116 creëerde op 14 november vijf `approved-source` onderzoeksacties, allemaal voor reeds van e-mail voorziene contacten. De bestaande bron-Edge en CRM leerden dus geen nieuwe adreskandidaten.
- Read-only simulatie met de beschermde warm-business-, bestaand-gesprek-, privacy- en cooldowncondities geeft **4.782** zakelijke connecties zonder adres die in beginsel brononderzoekbaar zijn. Dit is geen data-acquisitie of send-permission.

## Correctie in de oorspronkelijke bronfunctie
Dezelfde `public.powerhouse_prime_approved_connection_research_v1(date)` wordt via een nieuwe, toegepaste versie vervangen op de bestaande #116 stage. Geen tweede cron, aparte contactqueue, public privileges, verzender of betaald bedrijf. De oorspronkelijke limiet blijft **vijf source-only researchacties per Amsterdam-dag**: maximaal twee professionele warme connecties zonder e-mail en maximaal drie oorspronkelijke approved-with-email bronnen. Naam, bedrijf, rol, bestaande LinkedIn-relatie, minimumprioriteit 75, suppressies, negatieve uitkomsten, recente verzenddruk en exacte oorspronkelijke idempotente sleutel worden getoetst. Onderzoeksstatus `public_work_email_source` is alleen een verzoek om bronbewijs, nooit verzendtoestemming.

De opvolgende oorspronkelijke research-Edge (kandidaat PR #5787) moet de echte zakelijke bronpagina lezen en een expliciet persoonsgebonden `mailto:` met originele source/action sleutel uitsluitend als `extra.public_work_email_candidate` parkeren. Verkeerd adres of onvolledige toestemming wordt NO_SEND. De geldige originele ONE BRAIN/Heartbeat-consument moet de werkelijke bronrevisie verwerken en `PROCESSED` afgeven; een `INGEST_ACK` is niet voldoende. Originele Gmail-provider-ID, uitkomst en learning blijven afzonderlijke gates.

## Acceptatie
Beschermde Required / BRAIN / CodeQL / Supabase Preview tests, exact source-admission, protected merge, native provider-migratie en daadwerkelijke productie-`pg_get_functiondef` readback. Op de volgende natuurlijke #116-run moet de oorspronkelijke vijf-dagbudgetlimiet intact zijn; verwacht geen nieuwe researchacties op dezelfde datum wanneer de vijf slots al zijn benut. Daarna bronvragen daadwerkelijk door de Edge en onafhankelijke consumer-ACK bewijzen. PR-merge, green cron of 2/3-codeselectie is geen nieuwe zakelijke e-mail of omzet.
