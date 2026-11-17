# Website- en postmetingen voor CRO — 17 november 2026

## Doel en bestaand eigenaarschap
Dit is een beveiligde bronprojectie binnen de bestaande ONE BRAIN → Powerhouse CRO → Heartbeat-keten. De bestaande eventverzamelaar `bg-interactie`, growth queue en social provider-collectors blijven de enige schrijvers. Deze wijziging voegt geen tracking, scheduler, publisher, CRM, events, klantprofielen of betalingsregistratie toe.

## Productieobservaties vóór wijziging (7 dagen)
- 35.173 website-eventregels; 33.574 als robot gemarkeerd en 1.599 zonder robotvlag. Robotclassificatie is een heuristiek; niet-robot is geen gegarandeerd uniek persoon.
- 151 niet-robot klik-events maar geen CTA-telling in `growth_page_daily`. Dit is een te onderzoeken attributie- of instrumentatieverschil, géén bewezen 0%-conversie.
- Van de niet-robot `pagina`-events hadden slechts 34 `toestemming=true`; funnelpercentages niet berekenen alsof alle bezoekers consent gaven.
- Officiële GA4-sync `partial` en nul aan posts toegeschreven metingen; ontbrekende koppeling is geen bewijs van nul verkeer.
- Snapshotkwaliteitslabels verschillen: LinkedIn persoonlijk is deels reactions-only; LinkedIn bedrijf biedt impressies en klikken; Instagram biedt bereik en views. Niet onderling gelijkstellen.

## Verandering
1. `public.powerhouse_cro_site_signal_v1`: per websitepad 7-daagse event-/robot-/toestemmings-/ACK-overzichten, waarschuwingen voor laag consented sample of CTA-mapping, bron-leeftijd en voorgestelde gecontroleerde vervolgstap.
2. `public.powerhouse_cro_post_signal_v1`: laatst ontvangen provider-snapshot per exacte bestaande gepubliceerde post, kanaalscope, tijd, geldige teller en diagnostiek. Geen pseudo-impressies voor persoonlijke LinkedIn of causale conclusies.
3. Beide SQL-views met `security_invoker=true`; lezen alleen via service_role. PUBLIC, anon, authenticated zijn expliciet uitgesloten. Bestaande AVG-retentie, consent en tenant/source ownership blijven ongewijzigd.

## Verplicht vervolg bij dezelfde oorspronkelijke eigenaar
Eerst bronversheid en kwaliteit, dan één hypothese, bestaande experiment-policy en treatment/control, een veilige reversibele wijziging binnen de beschermde PR-route, en uiteindelijk een echte onafhankelijke uitkomst plus toepassen van de leerregel in de volgende natuurlijke run. Websitefrictie, engagement en intentie worden nooit geboekt als betaalde omzet.

## Releasebewijs
SQL is op het werkelijk aanwezige productieschema met `BEGIN; SELECT; ROLLBACK;` gevalideerd; de postprojectie retourneerde in de tijdelijke transactie 40 rijen. Dit is een **compile/read test**, geen bewijs dat de views al in productie bestaan. Beslissende poorten zijn Required, CodeQL, migratie-lock, beschermde merge, Supabase service-role readback en originele Heartbeat/Brain-consumer. Geen groen vóór die checks.

Zie https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5141 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4900.
