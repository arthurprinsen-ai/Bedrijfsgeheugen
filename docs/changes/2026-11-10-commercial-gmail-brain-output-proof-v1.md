# 10 november 2026 — één oorspronkelijke Gmail → Heartbeat → BRAIN overdracht

## Exacte waarneming

De originele Gmail-outreachactie `c749e43b-a335-49d6-bf01-42383930347f` heeft één onafhankelijk verifieerbaar bericht `1a1c4b1f339a051f` met juiste ontvanger en SENT-label. In de oorspronkelijke Powerhouse-tabellen bestaat precies één identiek `sent`-resultaat. De bestaande commerciële overdrachts-scorecard telt daarom 1 bewezen mail. De oorspronkelijke `powerhouse_commercial_output_assurance_v1` telt echter alleen top-level velden van `powerhouse_sales_actions.evidence` en meldt `provider_proven_email=0`. De oorspronkelijke sender bewaart correct onder `evidence.autonomous_outbound` — dit is een consumer-schema-afwijking, geen nieuwe te verzenden e-mail.

## Gerichte reparatie

De originele dagassurance-functie en originele dagelijkse `brain_obligations` blijven de enige autoriteit. De migratie `supabase/migrations/20261110131500_original_commercial_nested_gmail_provider_outcome_assurance_v1.sql` laat bestaande top-level e-mailbewijzen volledig intact en voegt voor de bestaande native Composio Gmail-sender uitsluitend een strikte gekoppelde variant toe: dezelfde originele DONE actie binnen dezelfde lokale dag, ACK/readback true, no-resend, exact provider-message/thread, en een onafhankelijke `sent`-outcome met identieke originele action-ID, dedupe, person, company, provider, bericht-ID en thread-ID. `EXISTS` voorkomt vermenigvuldiging. Sociale kanalen, SalesRobot-inbox-bewijzen en originele gepubliceerde content blijven onveranderd. Geen extra scheduler, queue, afzender, prospectbenadering of experiment.

## Testen en productiegrens

`tests/brain-original-commercial-gmail-nested-brain-proof-20261110.test.mjs` controleert de relatie tussen native provider- en outcome-bewijs en behoud van de oorspronkelijke BRAIN-belofte. Groene broncode is geen productie-bewijs: nodig zijn beschermde Required/CodeQL/preview, native migratie en onafhankelijke dagassurance/Brain/Heartbeat-readback. Verlopen researchacties worden niet blind heropend, verzonden, als groen gelabeld of retroactief A/B-getest.

Canoniek probleem: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
