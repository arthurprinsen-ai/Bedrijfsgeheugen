# Portal V2 — alle klantwijzigingen verliesvrij naar ONE BRAIN

Datum: 2026-10-08. Obligation: `portal-universal-input-causal-lossless-20261008-v1`. Issue: #4211.

## Hergebruik bewezen architectuur

`createPortalDomainState` is het centrale klantmutatiepunt, `portal-impact-engine` bepaalt getroffen pagina's en herbeoordelingsdomeinen; de bestaande authenticated `/api/portal-business-input` levert het business-inputrecord met `metadata.causalImpacts` aan de canonieke Brain authority. De bestaande Source Universe/Company Intelligence blijft verantwoordelijk voor externe signalen, tijdstempels, herkomst, tenantcontext en bewijs. Geen tweede Brain, Heartbeat, queue of agent.

De mapping van alle geregistreerde Portal V2-pagina's, legacy secties, AI/cloud/CSRD en berekeningen bestond. Deze levering dicht vier concrete gaten in de mutatie-naar-Brain-brug:

1. **Geen weggooien na 50 wijzigingen.** De oudere causalImpacts werden voorheen stilzwijgend afgekapt. Nu blijven alle nog niet bevestigde wijzigingen in de wachtrij tot expliciete Brain-acceptatie.
2. **Geen gegevensverlies tijdens async writes.** Per flush wordt een generatie-snapshot gemaakt. Alleen werkelijk geaccepteerde impactgeneraties verlaten de wachtrij. Wijzigingen tijdens verzending blijven open voor de volgende flush.
3. **Geen onterechte synchronisatie bij wijziging tijdens state-save.** Een state-write die tijdens de bewerking weer `dirty` wordt, geeft geen Brain-bevestiging af. De onopgeslagen wijziging blijft beschikbaar voor de volgende flush.
4. **Native page-scoped input.** `portal.pages.<page>` krijgt een eigen `PortalPageModel` met `statePath` en `modelId=page-<slug>`. De bestaande legacy camelCase-mappings blijven onveranderd.

## Zo werkt de keten

Klant vult een gegeven in of wijzigt het → `domain.set/patch` → kanonieke portaalstatus + causaal impactplan → opgeslagen tenant state bevestigd → modelgebonden BusinessInput met bronpagina en downstream-impact → expliciete `stored:true` Brain-acceptatie → UI-invalidatie/zichtbare herbeoordeling. Hetzelfde principe geldt voor documenten, cijfers, strategie, AI/cloud, CSRD, medewerkers, markt en financiële gegevens **voor zover hun invoer via deze centrale state loopt**.

Buitenwereldgegevens komen niet automatisch als klantfeit binnen: gebruik geauthenticeerde connectors of de bestaande Source Universe met bron, meetmoment, tenant scope, datakwaliteit en expliciete scheiding tussen waarneming, aanname, berekening en uitkomst. Verandert een bronwaarde, dan moet de relevante tenantimpact opnieuw worden berekend en zichtbaar zijn op financiële modellen, adviezen en andere afhankelijke pagina's. Er wordt geen financiële waarde of wettelijke toepasselijkheid gefabriceerd.

## Wat deze wijziging niet bewijst

- Niet alle DOM-formulieren, legacy `portal-next`-paden, standalone services, uploads, externe connectoren en ingesloten tools zijn veld-voor-veld geaudit op gebruik van `createPortalDomainState`.
- Er is geen nieuwe automatische realtime externe bron-inname, connector-autorisatie of universele modelherberekening gedeployed door deze codepatch.
- `affectedPages` betekent herberekenen/herbeoordelen, niet bewijs dat een financieel model, CSRD-classificatie, cloudprovider of externe actie daadwerkelijk is uitgevoerd.
- Een demo-skip is geen klant- of Brain-opslag. Productie heeft bewijs van beschermde merge, Netlify exact-source release en geauthenticeerde tenant- en Brain-readback nodig.

## Verificatie

`node --test portal-v2/tests/portal-causal-propagation.test.mjs portal-v2/tests/domain-state.test.mjs portal-v2/tests/one-brain-impact-contract.test.mjs`

Regressies: >50 mutaties; verschillende `portal.pages.*`; wijziging tijdens state write; wijziging tijdens Brain write; ontkende Brain ACK. Alle klantdata tenant-scoped houden; geen PII in publieke logging.