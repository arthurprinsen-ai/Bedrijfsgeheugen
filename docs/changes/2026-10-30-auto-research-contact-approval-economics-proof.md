# P0 #4215 — contacttoestemming ≠ menselijke research-uitvoering (30 oktober 2026)

**Oorspronkelijke eigenaar:** de bestaande interne research-executor en economics-backfill onder Powerhouse runtime scheduler mux #171. **Incident-fingerprint:** `economics|internal-autoresearch|contact-approved-but-autonomous-proof-excluded|20261030-v1`.

## Productiebewijs

De reeds beschermde `powerhouse_backfill_internal_research_economics_v1` accepteert automatisch onderzoek uitsluitend als `human_approved=false`. Van de afgeronde acties zonder economics missen er 17 `research_enrichment`-registraties met `channel=internal`, `human_approved=true`, `evidence_only=true`. Een brononderzoek naar `powerhouse_materialize_command_center_actions_v1` bevestigt dat `human_approved` wordt overgenomen uit **contact_extra**: dit is contact-/outreachtoestemming, geen geregistreerde menselijke researchminuten.

De oorspronkelijke `powerhouse_execute_relationship_research_v1` voerde deze research automatisch uit zonder externe verzending. Elk van de 17 ontbrekende acties heeft een afzonderlijke exacte originele runtime-eventreceipt `relationship_public_research_evidence` van dezelfde actie en timestamp, met `vendor_used=false`, `evidence_only=true`, `external_side_effects=false`. Deze dubbele onafhankelijke bron is gecontroleerd voordat de beperkte uitzondering is ontworpen. **De zeven andere ontbrekende economics-rijen betreffen 5 LinkedIn-DM-acties en 2 reply-followups; daarvoor ontbreekt deze research-uitvoeringsreceipts en geldt deze reparatie uitdrukkelijk niet.**

## Correctie in bestaande functie

De nieuwe beschermde SQL-migratie behoudt functie, public schema, SECURITY DEFINER, server-only toegangsrechten, scheduler, dedupe, selectiestatus, 50-record-batch, bestaande no-contact-approval-gate en onbekende kosten als `NULL` + `UNOBSERVED`. Alleen voor `human_approved=true` mag de economische vastlegging doorgaan wanneer hetzelfde oorspronkelijke event met exact actie-ID, tijd, contract, oorspronkelijke agent en nul externe side effects onafhankelijk bewezen is. Contacttoestemming wordt als **ander begrip dan menselijke werktijd** verklaard; automatische research heeft 0 menselijke uitvoeringsminuten. Providerkosten en externe kosten worden nooit zonder bewijs nul.

De wijziging wijzigt geen uitgevoerde acties of contacttoestemming en verstuurt niets. Ze creëert geen planner, crontaak, kopie van ONE BRAIN of concurrerende writer.

## Acceptatie (nog open)

Beschermde PR met Required/BRAIN/CodeQL en originele migratiehistorie; veilige bestaande Supabase-productiemigratie via exclusieve route; `pg_get_functiondef`, server-only privilege-check, exact 17 receipt-gedekte acties in oorspronkelijke schedulerpass, economische rijverificatie met onbekende kosten, nog altijd 7 aparte outreach/DM-gaten. Eén groen SQL-testresultaat is geen uitgevoerde productiebackfill of leereffect. Menselijk handboek, ONE BRAIN learning, agents/skills en bestaande portaal-observability dienen alleen brongebonden te projecteren.