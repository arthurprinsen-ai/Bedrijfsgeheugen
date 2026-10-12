# P0 #4340 — van generieke benadering naar aantoonbaar relevante outreach

## Geobserveerde fout
Twee Gmail-berichten aan dezelfde relatie (5 en 10 oktober) vroegen inhoudelijk hetzelfde: noem één proces dat slimmer kan. Het tweede bericht introduceerde de gratis Frisse Blik, maar geen aantoonbaar nieuwe aanleiding. De ontvanger wees verdere marketing beleefd af op 11 oktober. De providerbevestigde reply, uitkomst en actieve e-mailsuppressie zijn inmiddels teruggelezen uit de bestaande systemen.

## Bestaande architectuur, aangescherpte regels
- ONE BRAIN blijft de eigenaar van doelgroep, koopsignaal, contactdruk en kanaalkeuze. Geen nieuw CRM, nieuwe scheduler of extra providerverbinding.
- De bestaande commerciële composer controleert concrete menselijke broncontext en een verifieerbare relevante bron in plaats van alleen een generieke verkoophypothese.
- Per prospect worden maximaal twaalf eerdere daadwerkelijk uitgevoerde e-mail- en LinkedIn-DM-acties gebruikt om tekstuele herhaling en dezelfde generieke vraag te blokkeren. Ontbrekende eerdere kopie geldt als onbewezen variatie.
- Follow-ups vereisen aantoonbaar nieuw bewijs na de laatst verzonden commerciële actie.
- De Gmail- en LinkedIn-DM-sender toetsen de concrete bron- en variatiebewijzen vóór extern versturen.
- De bestaande reply-loop neemt ook vervolg-e-mails mee, herkent expliciete en beleefde negatieve signalen en schrijft naar de bestaande suppressie-registratie.
- De bestaande database-trigger blokkeert toekomstige commerciële claims bij een actieve afwijzing op e-mail of gekoppelde persoonsidentiteit.

## Operationele randvoorwaarden
De voorschriften in Notion alleen zijn onvoldoende; pas beschermde merge, exacte SQL-/Edge-productiedeploy en onafhankelijke readback bewijzen dat ze werken. Bij ontbrekend bewijs is de actie **overgeslagen**, maar het uitvoersysteem voor overige geschikte contacten blijft actief. Consent, human approval, source truth en idempotency worden niet versoepeld.

## Tests en nog te bewijzen
Regressie: tests/brain-outreach-4340-canonical-quality.test.mjs. Vereist: Required, CodeQL, Supabase Preview, protected merge, deployment exact main revision, veilige readback van source- en suppression-gate, geautoriseerde no-send-canary en terugkoppeling van werkelijk waargenomen uitkomsten. P0 #4198 blijft open tot de grotere commerciële keten zelf is aangetoond.
