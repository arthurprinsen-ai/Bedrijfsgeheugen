# Bedrijfsgeheugen — dagelijkse ondernemingssturing

**Productbelofte:** Dation automatiseert de dagelijkse rijschool; Bedrijfsgeheugen automatiseert de dagelijkse ondernemingssturing. Het moet voor de ondernemer zo vanzelfsprekend worden als boekhouding en agenda.

## Eén product, geen extra modules

De bestaande Portal V2 directiecockpit is de eerste dagelijkse gebruikersingang. Intelligence, Strategy DNA, Impact Engine, Next Best Actions, Execution, Outcome Memory en Heartbeat blijven **capaciteiten van dezelfde ONE BRAIN**, niet concurrerende producten, schedulers of waarheidstores.

Elke ochtend ervaart de ondernemer één logische lus:
1. **Weten:** wat is veranderd binnen bedrijf, personeel, commercie, geldstromen en relevante externe context? Toon alleen tenant-scoped en herleidbare feiten; hypothesen krijgen dat label.
2. **Beslissen:** welke 1–3 onderwerpen hebben vandaag voorrang? Laat impact, eigenaarschap, onderbouwing, vervaldatum, afhankelijkheid en risico zien.
3. **Doen:** leg goedkeuring of afwijzing vast via de bestaande `/api/company-decision`-route en voer toegestane taken uit via de bestaande action/obligation authority. Geen parallelle takenlijst, CRM of handmatige dubbele invoer.
4. **Meten:** koppel het werkelijk waargenomen outcome aan de actie en immutable provider/operationele bewijsreferenties. Uitgevoerd, gepubliceerd, geschat en gerealiseerd zijn gescheiden statussen.
5. **Leren:** pas pas na geverifieerd outcome en leerbewijs de volgende prioriteit, score, guard of aanbeveling aan; toon de volgende beslissing.

**Ontwerpregel:** maximaal vijf dagelijkse schermstappen en maximaal drie concrete prioriteiten op de hoofdroute. Alle andere modules zijn verdieping achter dezelfde context en actie-ID. Geen nieuwe module om een ontbrekende verbindingspijl te maskeren.

## Hergebruikte implementatiepaden

| Gebruikersdoel | Canonieke bestaande route |
| --- | --- |
| Eén directiestart | `portal-v2/operating-system/executive-cockpit.js` |
| Geprioriteerde uitvoering | `portal-v2/company-cockpit-ui.js`, `portal-v2/operating-system/decision-model.js` |
| Risico's en context van de klant | `portal-v2/contextual-action-cards.js`, `portal-v2/operating-system/executive-projection.js` |
| Klantautorisatie | `/api/company-decision` en bestaande Brain Operating Loop |
| Bron-/uitkomstbewijs | `portal-v2/operating-system/contracts.js`, `portal-v2/operating-system/company-intelligence-context.js` |
| Runtime en de waarde-lus | Supabase canonieke `powerhouse_daily_runs`, `powerhouse_action_business_value_v1`, `powerhouse_outcome_funnel_v1`, outcome/evidence/learning |
| Bedrijf, risico, finance en scenario | Bestaande `portal-v2/operating-system/`-onderdelen |
| Autonome cadans | Bestaande Heartbeat en één scheduler, geen tweede cron |

## Readback en acceptatie

- Iedere klant krijgt tenant-scoped gegevens en veilige RLS; onbekend is niet nul en een voorstel is geen wettelijke of financiële vaststelling.
- Elke waarde heeft `expected / realized / evidence / as_of / lineage` waar beschikbaar.
- Geen succesvolle dagelijkse lus op basis van een workflow-ACK, demo, draft, gegenereerde aanbeveling of alleen een verzonden bericht.
- Realisatie heeft een geverifieerde outcome-status, actuele source refs en broncontrole nodig; de leerstap daarnaast leerbewijs en een concrete gekoppelde volgende beslissing.
- Dagstatus publicatie, outbound, verificatie, conversie en learning blijft afzonderlijk zichtbaar. Geen cosmetische FULL_GREEN-status.
- Geen duplicaten, geen bypass van autorisatie/consent, geen tweede uitvoerder of Brain.
- Sluiting vraagt een geauthenticeerde klanttest op desktop en mobiel, een echte actie, outcome/readback en aantoonbare volgende beslissing; een PR op zichzelf is niet live.

## Huidige evidence, 9 oktober 2026

De bestaande dagrun `2026-10-09` staat in Supabase op **degraded**, met 15 acties en 16 aanbevelingen. De bestaande business-value-view bevat 3.729 acties maar de uitgevoerde controle leverde geen rijen met de exact gefilterde status `REALIZED_VERIFIED`; dit is **geen** bewijs dat er nooit waarde is gerealiseerd. Bovenliggende P0 #4198 blijft open totdat de juiste end-to-end productieresultaten zijn bewezen.

Deze wijziging **maakt de vijf dagelijkse stappen zichtbaar en bewaakt de scheiding tussen gerealiseerd en onbewezen**, maar claimt niet dat de totale commerciële of klantlus daarmee al live is.
