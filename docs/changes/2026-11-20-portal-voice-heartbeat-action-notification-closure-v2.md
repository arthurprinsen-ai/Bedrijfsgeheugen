# Portal V2 — stemdekking, server-side Heartbeat-observaties en notificatie-/actiegrenzen

Datum: 20 november 2026
Fingerprint: `portal-v2-voice-heartbeat-closure-v2`
Owner: originele Portal V2 → Portal State/BusinessInput → ONE BRAIN → Powerhouse → Heartbeat
Ouder: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
Basisrelease: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6082

## Concrete softwarewijzigingen

1. **Spraak naar gewone UI-bedieningen.** `portal-v2/voice-control-policy.js` maakt alle momenteel zichtbare, native benoemde knoppen, links, velden en keuzelijsten vindbaar via Nederlandse spraak of tekst. Het kiest alleen ondubbelzinnige labels; velden worden lokaal ingevuld maar nooit automatisch opgeslagen. Knoppen krijgen focus, maar een echte bevestigingsklik blijft bij de bevoegde mens. Wachtwoorden, geheimen, betaalgegevens, toestemming, verwijderen en andere bevoorrechte acties zijn uitgesloten. Geen claims dat deze voorlopige generieke adapter ieder niet-native canvas of elke custom module volledig uitvoert.
2. **Opt-in.** Voor nieuwe regels kan de ondernemer `monitoring:true` aanvinken en aparte gewenste e-mail- en pushkanalen aanvragen. Alle keuzes bewaren uitsluitend via het bestaande `portal.signalering.rules`-pad, met dezelfde tenant-/DomainState-/Brain-readback. De UI toont wensen nooit als afleverbevestiging.
3. **Herhaalde server-side toetsing.** De reeds bestaande vijfminutenfunctie `supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts` krijgt een aparte, begrensde evaluatieroute voor `portal_state_layers` met geautoriseerd opgeslagen regels. Geen nieuwe cron, Edge endpoint, database of verzender. Per tenant/regel/bronrevisie wordt een gehashte identiteits- en idempotency-key aangemaakt; maximaal 200 bronrijen en 35 eventwrites per run, met zichtbare `coverageTruncated` voor overschrijding. De oorspronkelijke commerciële workflow blijft doorgaan bij een fout in de portaalobserver.
4. **Alleen feiten registreren.** Indien de ingestelde grensoverschrijding aantoonbaar in ingevoerde state staat, wordt uitsluitend een `powerhouse_runtime_events`-observatie geschreven met `OBSERVED`, nooit `VERIFIED` voor versheid, externe aflevering of financiële uitkomst. De origin Heartbeat leest na de databasecommit dezelfde dedupe-key onafhankelijk terug.
5. **Meldingen en vervolgacties.** `planNotificationSafety` vereist werkelijke meetversheid, afzonderlijke ontvangerstoestemming/suppressie en de originele geautoriseerde provider/readback voordat er ooit een kanaalactie kan worden aangeboden. Deze versie voert **geen** externe e-mail/push uit. Laag-risicoanalyse en menselijke vervolgtaak blijven mogelijk; risicovolle providerwrites vereisen bestaande approval en eigen uitvoering-ID.

## Structurele borging

Bestaande Portal Living Interface/Company Intelligence skills en de integratie-, betrouwbaarheid-, UX-, datakwaliteits- en security-agents dragen deze eisen. Negatieve bron-/tenant-/spraak-/kanaaltests zijn expliciet onderdeel van de bestaande Required/CodeQL/Netlify-release. Het oorspronkelijke monitoring-incident wordt pas administratief gesloten wanneer een natuurlijk Heartbeat-moment op echte tenantdata en de exacte bronrevisie met readback is vastgelegd.

## Nog OPEN / niet als geleverd claimen

- Geauthenticeerde end-to-end spraakopdrachten op alle maatwerkcontrols, iOS/Android en toegankelijkheid: echte browser- en 2-tenanttests open.
- 24/7 werkt alleen voor werkelijk opgeslagen, expliciet aangezette tenantregels, met natuurlijke vijfminutenruns en source-revision-readback; er is geen bewijs van verse gemeten KPI-bronnen en volledige dekking voor >200 rijen.
- Outbound e-mail en push: afzonderlijke tenant/recipient consent en suppression, provider, provider-message-ID en live ontvangstbewijs ontbreken. Een checkbox vormt uitsluitend gebruikerswens.
- Autonome vervolgacties met werkelijk effect: originele Powerhouse Agent Fabric moet een risicoklasse, bevoegdheid, uitvoeringslog, provider-/consumer-ack en onafhankelijke Heartbeat-effectmeting leveren. Een `powerhouse_runtime_events`-event is geen opdracht of uitgevoerde handeling.
- Exact protected merge, geautoriseerde Supabase Edge-functionversie, werkelijke scheduler-readback, laatste Netlify productie-SHA en beide tenant-browserproeven ontbreken totdat onafhankelijk gecontroleerd.

Geen dubbele agent of scheduler, geen fictieve GREEN-status en geen wachtende blocker verzwijgen.
