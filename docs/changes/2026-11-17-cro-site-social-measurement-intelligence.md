# Website-, post- en e-mailmetingen voor CRO — 17 november 2026

## Doel en bestaand eigenaarschap
Dit zijn beveiligde bronprojecties binnen de bestaande ONE BRAIN → Powerhouse CRO → Heartbeat-keten. De bestaande eventverzamelaar `bg-interactie`, growth queue en social provider-collectors blijven de enige schrijvers. Deze wijziging voegt geen tracking, scheduler, publisher, CRM, events, klantprofielen of betalingsregistratie toe.

## Productieobservaties vóór wijziging (7 dagen)
- 35.173 website-eventregels; 33.574 als robot gemarkeerd en 1.599 zonder robotvlag. Robotclassificatie is een heuristiek; niet-robot is geen gegarandeerd uniek persoon.
- 151 niet-robot klik-events maar geen CTA-telling in `growth_page_daily`. Dit is een te onderzoeken attributie- of instrumentatieverschil, géén bewezen 0%-conversie.
- Van de niet-robot `pagina`-events hadden slechts 34 `toestemming=true`; funnelpercentages niet berekenen alsof alle bezoekers consent gaven.
- Officiële GA4-sync `partial` en nul aan posts toegeschreven metingen; ontbrekende koppeling is geen bewijs van nul verkeer.
- Snapshotkwaliteitslabels verschillen: LinkedIn persoonlijk is deels reactions-only; LinkedIn bedrijf biedt impressies en klikken; Instagram biedt bereik en views. Niet onderling gelijkstellen.

## Verandering
1. `public.powerhouse_cro_site_signal_v1`: per websitepad 7-daagse event-/robot-/toestemmings-/ACK-overzichten, waarschuwingen voor laag consented sample of CTA-mapping, bron-leeftijd en voorgestelde gecontroleerde vervolgstap.
2. `public.powerhouse_cro_post_signal_v1`: laatst ontvangen provider-snapshot per exacte bestaande gepubliceerde post, kanaalscope, tijd, geldige teller en diagnostiek. Geen pseudo-impressies voor persoonlijke LinkedIn of causale conclusies.
3. De SQL-views met `security_invoker=true`; lezen alleen via service_role. PUBLIC, anon, authenticated zijn expliciet uitgesloten. Bestaande AVG-retentie, consent en tenant/source ownership blijven ongewijzigd.

## Aanvulling e-maildata: afzonderlijke waarneming, dezelfde eigenaar
- `powerhouse_email_learning_stats` bevat elf historische rijen met 27 gerapporteerde verzendingen en twee reacties; de laatste aggregatie is van 28 oktober 2026. Dit is geen actueel bewijs van provider-geverifieerde verzending.
- `powerhouse_sales_actions` bevat 32 uitgevoerde geregistreerde e-mailacties; geen binnen de laatste zeven dagen. Historische uitvoeringen en `sent`-outcomes mogen niet zomaar als onafhankelijk geverifieerd succes worden behandeld.
- In de laatste zeven dagen zijn nul e-mailacties vastgesteld met **zowel** `provider_send_ack_verified=true` **als** `provider_readback_verified=true`. Eerdere bronregels blijven bewaard.
- `public.powerhouse_cro_email_signal_v1`: privacyarme diagnostische projectie per bestaande overtuigingsstrategie; telt alleen de oorspronkelijke send+readback-bewijzen als `verified_send_readbacks_7d`, scheidt deze van verouderde historische statistieken, toont de suppressievoorraad uitsluitend als telling en onderdrukt een reactieratio bij onvolledige versheid of onvoldoende steekproef.
- De SQL is in een werkelijke Supabase-transactie `BEGIN/SELECT/ROLLBACK` getest: vier strategieën kregen `NO_RECENT_VERIFIED_EMAIL_SEND`. De test heeft **geen** view blijvend geïnstalleerd.

## Verplicht vervolg bij dezelfde oorspronkelijke eigenaar
Eerst bronversheid en kwaliteit, dan één hypothese, bestaande experiment-policy en treatment/control, een veilige reversibele wijziging binnen de beschermde PR-route, en uiteindelijk een echte onafhankelijke uitkomst plus toepassen van de leerregel in de volgende natuurlijke run. Websitefrictie, engagement en intentie worden nooit geboekt als betaalde omzet.

## Releasebewijs
De eerste website/social SQL is op het werkelijk aanwezige productieschema met `BEGIN; SELECT; ROLLBACK;` gevalideerd; de postprojectie retourneerde in de tijdelijke transactie 40 rijen; ook de e-mailview is afzonderlijk gecompileerd met vier diagnostische rijen. Dit is een **compile/read test**, geen bewijs dat de views al in productie bestaan. Beslissende poorten zijn Required, CodeQL, migratie-lock, beschermde merge, Supabase service-role readback en originele Heartbeat/Brain-consumer. Geen groen vóór die checks.

Zie https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5141 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4900.
