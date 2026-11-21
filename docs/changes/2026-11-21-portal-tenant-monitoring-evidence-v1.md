# Portal V2 — aantoonbare tenantgebonden Heartbeat-controles

Datum: 2026-11-21
Fingerprint: `portal-v2-tenant-signal-readback-original-heartbeat-v1`
Eigenaar: originele Portal V2 → BusinessInput/ONE BRAIN → bestaande Powerhouse/Heartbeat

## Opgeleverd in de releasekandidaat

1. De **oorspronkelijke vijfminuten-Heartbeat** kan een geconfigureerde tenantregel toetsen, en slaat maximaal één scanbewijs per tenant/UTC-uur/bronsrevisie op. Zo blijft een controle zichtbaar als er geen afwijking was. Geen nieuw schema, cron, database, provider of uitvoerende agent. Batches zijn bewust begrensd tot 20 tenant-scans en 15 afwijkingen per run; grotere dekking blijft expliciet `coverageTruncated`, niet 'groen'.
2. De bestaande EU Edge API `portal-state-eu` heeft een **alleen-lezen** action `signal_observations`; op de bestaande service-token-protected gateway worden eventbron, contract, tenant-fingerprint en actor gecontroleerd. Er worden alleen gehasht-tenantereferenties uit originele `powerhouse_runtime_events` opgevraagd.
3. De bestaande Netlify Identity bepaalt de echte tenant voor `/api/portal-signal-status`; een door browser opgegeven tenant wordt genegeerd. Geen anonieme toegang, geen write-route, geen client-databasecredentials, `private,no-store`.
4. De portaal-dialoog toont de laatste originele Heartbeat, de **laatste eigen tenantcontrole**, afwijking en waarnemingsmoment. Ontbrekende klantregels of ontvangstbewijzen worden zichtbaar `niet bevestigd`, niet als actuele bron of verzonden bericht geïnterpreteerd. Bevragen gebeurt bij openen of expliciete refresh, niet via browsercron.
5. Eén introductieknop maakt een *voorstel* voor ontbrekende omzetdata, nooit een fictieve bron of stilzwijgende bewakingsinstelling. Opslaan en kanaal-opt-in blijven expliciete acties. De bestaande dictatie-achterdeur voor niet-toegestane velden gebruikt nu dezelfde strikte allowlist en wordt gereset na accountwissel.

## Nog open, geen verzonnen uitkomst

- De gecontroleerde productieopslag had op 2026-11-21 één laag en **nul** ingestelde tenant-alertregels. Er zijn dus geen gemeten klantalerts. Een echte gebruiker moet zelf per metric kiezen wat te monitoren is en de regel veilig opslaan; geen automatische opt-in.
- Echt gemeten KPI-actualiteit en bronrevision dienen als hard bewijs. Een regel op handmatig ingevoerde data is geen real-time industriemeetwaarde.
- Verzending en ontvangen van e-mail/push blijven uitgeschakeld totdat geautoriseerde identiteit, expliciete ontvangervoorkeur, wettelijke toestemming, suppressie, bestaande provider, provider-ID en delivery-readback bestaan. Geen commerciële Gmail-lane hergebruiken als transactional mail zonder bewijs.
- Autonome, reversibele acties vereisen original Powerhouse agent-fabric risicobeoordeling, expliciete toestemming, idempotent execution-ID en onafhankelijk Heartbeat-effect. Risicovolle acties nooit bypass.
- Alleen na beschermd Required+CodeQL+Netlify, werkelijke Supabase Edge readback, 2-tenant + mobiel browserproces en natuurlijke tenant-scan mag de specifieke capability production-green zijn.

## Beveiligings- en kwaliteitstests

`tests/brain-portal-signal-tenant-evidence-v1.test.mjs`
`portal-v2/tests/voice-signals.test.mjs`

Fallback bij fout: toon geen bewijs en laat originele commerciële Heartbeat onverstoord. Geen parallelle scheduler of side-effect.
