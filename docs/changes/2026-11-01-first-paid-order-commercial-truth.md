# P0 2026-11-01 — waarom geen eerste betaalde klant (productie-evidence)

**Bestaande eigenaar:** Growth & Revenue OS / ONE BRAIN / Heartbeat, P0 #4198, Growth #4900. **Status:** oorzaakanalyse bewezen; commerciële keten niet opgelost; geen productie-uitrol of extern bericht door dit document.

## Geobserveerde bronwaarheid
- `powerhouse_opportunities`: 938 totaal, 718 open opportunity, 219 open signal, 1 deferred signal.
- `powerhouse_sales_actions`: 10.772 totaal; expired 8.631, waarvan 7.425 `research_enrichment`. Niet opvatten als 8.631 mislukte verkoopberichten. Externe kanalen `internal` en `internal_research` uitgesloten: expired 1.206, skipped 821, done 38, suggested/prepared/waiting 161.
- `powerhouse_email_learning_stats`: sent 27, replies 2, positive replies 0, meetings 0, proposals 0, orders 0, revenue_eur 0. Dit is de gedocumenteerde _email projection_, geen onafhankelijke inbox- of betaalprovider-audit.
- `saas_checkout_intents`: expired 2, created 2, completed 1; `saas_subscriptions`: precies één trial/pro/canceled. Completed checkout-intent mag niet als betalende SaaS-klant worden geteld.
- `scan_inzendingen`: 58 totaal, 56 unverified en 2 demo. `commercial_leads` en `offerte_inzendingen`: beide leeg; `offertes` leeg.
- Laatste 30 dagen `growth_events`: page_view 31.113 waarvan is_robot=true 23.592; overige pageviews 7.521 (niet noodzakelijk uniek / geverifieerd mens). `primary_cta_click` 15; `scan_completed` 47. Zet ontbrekende GA4-validatie niet stilzwijgend om in bewezen menselijk bezoek.

- `powerhouse_revenue_command_center_snapshot_v1` (laatste refresh 2026-11-01 11:55 UTC): 938 rijen, **768 aanbevolen LinkedIn-comments** en **170 interne research**; **0 directe meeting/offerte/e-mail als aanbevolen kanaal**. CTA: 775 keer `ask_one_contextual_question` en 163 keer `gather_more_evidence`; 519 missen bewijs en 168 hebben een identiteitsconflict. Dit is de harde routebreuk: het command center stopt grotendeels vóór een bewezen verkoopgesprek. De opdracht is niet veiligheidscontroles omzeilen, maar in de bestaande decision owner een geldige route vanaf provider-bevestigde interesse/reply naar afspraak, aanbod, offerte en betaalbewijs afdwingen; ontbrekend autoriteit/bewijs blijft onderzoek of stop.

## Concrete uitvoeringsblokkade
Drie nieuwe, human-approved `autonomous_email` acties van 1 november staan `prepared`, `provider_attempted=false`, `reason=SOURCE_SPECIFIC_EVIDENCE_REQUIRED` en missen `human_readable_context` en `source_trigger_relevance` (bij één ook `specific_source_context`). Relevante research-routes zijn gecreëerd met dezelfde `relationship-research:outreach-source:<original-action-id>` lineage; twee onderzoekstaken zijn `done`, één `waiting`.

Een van de onderzoekstaken accepteerde een bron op een buitenlandse vacaturewebsite met een oudere observatie en een generieke bedrijfsnaammatch. De titel/samenvatting bewijst geen kooptrigger bij deze specifieke Nederlandse prospect. De tweede toont een recenter extern AI-investeringsbericht, maar ook daar is nog geen onafhankelijk gevalideerde commerciële relevantie/recipient-hypothese. Onderzoeksstatus `done` is **niet** voldoende om de oorspronkelijke Gmail-gate te passeren; herstel moet bronvalidatie verbeteren, niet de composer omzeilen. De bronkandidaat blijft uitdrukkelijk `UNVERIFIED_SOURCE_CANDIDATE` totdat actuele pagina, bedrijfsmatch en commerciële context onafhankelijk zijn bevestigd.

## Productpositionering / CRO discrepantie
De actuele `/prijzen` geeft:
- gratis Frisse Blik: 30 minuten;
- Directie & AI Workshop: €1.950 eenmalig;
- Bedrijfsgeheugen Scan: €2.950 eenmalig.

Oudere blogs refereren aan een **betaalde** Frisse Blik van €2.900 en de bestaande acquisitieskill vermeldde een scan van €2.900. Dat is prijs-/CTA-drift. De skill wordt in deze PR gecorrigeerd. De CMS/website-owner moet verouderde publieke blogs canoniek reviseren, met revisie, CMS-goedkeuring, tests, protected deployment en live readback; dit document verandert geen publieke prijzen en creëert geen nieuw CMS-systeem.

## P0 uitvoering en acceptatie
1. Hergebruik huidige triggers, contact-, opportunity- en research-lineage. Segmenteer de 938 open/signaalrecords naar verifieerbaar buyer fit, recent bedrijfsprobleem, contact authority, juiste beslisser en daadwerkelijk bestaand instapaanbod. Geen bulkmailquota.
2. Heropen niet automatisch afgesloten research als extern contact; alleen onzekere bronmatch -> nieuwe scoped bronevaluatie door bestaande research owner; geen mail zonder originele copy/gate/provider readback.
3. Kies als eerste hypothese de Directie & AI Workshop (€1.950), niet een grote suite. Test met maximaal 30 geldige, warme, brononderbouwde reviewkandidaten in 14 dagen. Meet geselecteerd, eligible, provider-proven verzonden, reply, kwalificatie, afspraak, offerte, betaald. **14 dagen is experimentvenster, geen omzetgarantie.**
4. Bij relevante positieve reactie: concrete persoonlijke vervolgstap; gebruik oorspronkelijke Gmail/LinkedIn/Calendly/offerte/checkout-authority met consent/dedupe; meet afspraak pas bij onafhankelijke bevestiging.
5. Eerst geldige betalingen onafhankelijke provider/bank-readback en exact tenant/order-ID voordat een klant, omzet of GREEN gemeld wordt. De status wordt niet groen op content, pageviews, provider ACK alleen, of `research done`.
6. Brein leert van afwijzing (incl. te generiek, niet relevant, timing, contactdruk), checkoutuitval, prijsverwarring, bronproblemen en gebrek aan conversie; fingerprint -> oorzaak -> fix -> tests -> provider readback -> menselijk docs/skills/portal. Hergebruik bestaande P0 #4198 en #4900; geen nieuwe scheduler/CRM/parallelle agent.

## Acceptatie na beschermde release
Regressie: interne research mag niet als outbound contact worden geteld; `completed` checkout zonder betaalde subscription blijft 0; geslaagde research zonder independently verified trigger blijft SEND_BLOCKED; oude prijsterm `paid scan (€2.900)` niet langer in acquisition skill; daadwerkelijke betaalde order vereist provider-verificatie. Required/CodeQL/SkillOps en exact main/production readback zijn verplicht voordat runtime- of live-status wijzigt.
