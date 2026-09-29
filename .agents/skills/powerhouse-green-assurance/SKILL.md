---
name: powerhouse-green-assurance
description: Use for end-to-end Powerhouse health assurance, red/amber recovery, evidence freshness, provider failover, content-loop closure, and truthful green-state verification.
---

# Powerhouse Green Assurance

Fingerprint: `powerhouse|green-assurance|truthful-closed-loop|v1`.

## Doel

Maak Powerhouse niet cosmetisch groen. Herstel de onderliggende loop totdat actuele externe evidence bewijst dat de vereiste capability werkelijk werkt.

## Canonieke regel

`signal -> decision -> action -> evidence -> outcome -> measurement -> learning -> guard`

Een status mag alleen GREEN/LIVE_BEWEZEN worden wanneer de relevante keten aantoonbaar gesloten is. Een succesvolle trigger, workflow, API-call, commit, provider-ACK of deploy is op zichzelf nooit voldoende.

## Verplichte assurance-loop

1. Lees actuele runtime health, terminal control-plane health, evidence-source coverage en open obligations.
2. Herstel stale/missing required evidence met echte readback; nooit met gesynthetiseerde success-evidence.
3. Onderscheid provider-capability van één leverancier. Een niet-essentiële provider mag geen single point of failure voor de hele Brain zijn wanneer een governance-goedgekeurde provider-neutrale route bestaat.
4. Retired/legacy tooling mag telemetry leveren maar nooit de actuele groene gate blokkeren.
5. Herstel structurele lineage-gaten in de bestaande forecast/action/outcome/learning lineage; maak geen parallelle waarheid.
6. Sluit content/publication obligations via de canonieke identities en duplicate-gates. Een reeds gepubliceerde provider-side-effect met `republish_forbidden` wordt nooit opnieuw gepubliceerd.
7. Instagram blijft Mira-only en vereist exact media proof plus start/middle/end continuity evidence voordat publicatie groen wordt.
8. Alleen actuele read-after-write/readback mag een rode of oranje status promoveren.
9. Schrijf iedere materiële assurance-fix terug naar Brain learning, ledger/docs, relevante skills/agent-contracts en System Map.
10. Herbereken daarna de centrale health; meld groen alleen wanneer de onderliggende bronnen en obligations groen zijn.

## Truth boundaries

- `unknown != green`
- `stale != green`
- `provider ACK != external outcome`
- `technical success != business outcome`
- `optional provider failure != whole-brain failure`
- `legacy telemetry != required authority`
- `generated asset != published/read-back asset`
- `published once + readback-limited != permission to republish`

## Provider-neutral intelligence

External intelligence is governed as a capability, not as a single-vendor dependency. Provider-specific health remains visible, but the whole Brain is blocked only when the required provider-neutral capability has no fresh approved source.

## User-facing gedrag

Geen interne PR/SHA/queue/blocker-detail als eindhandoff. De node blijft eigenaar tot:
- `LIVE_BEWEZEN`, of
- `ROLLED_BACK_GREEN`, of
- een echte `BLOCKED_HARD_BOUNDARY` die menselijke/provider-autorisatie vereist.

## Canonieke verwijzingen

- `config/powerhouse-truth-status-contract.json`
- `brain/policies/powerhouse-agent-continuity-v1.json`
- `platform/system-map/canonical-system-map.mjs`
- `.agents/skills/powerhouse-continuity/SKILL.md`
- `public.powerhouse_one_brain_runtime_health_v1`
- `public.powerhouse_terminal_control_plane_health_v1`
- `public.powerhouse_evidence_operating_health_v3`
- `public.powerhouse_evidence_source_coverage_v1`

## Permanente learning 2026-09-29

De assurance-run bewees dat een systeem tegelijk volledig bedraad kan zijn en toch niet groen: 32/32 intelligence-lagen en 18/18 required jobs waren actief terwijl content/evidence/lineage nog rood waren. De juiste herstelstrategie is daarom evidence-first, provider-neutral en fail-closed, niet dashboard-first.


## Final build integrity ordering

Fingerprint: `pricing|final-normalizer|post-restore-runtime-strip|2026-09-29-v1`.

Voor publieke surfaces met post-build feature restoration geldt:
- destructieve/globale UI-normalisatie draait vóór feature-integrity restore;
- feature-integrity restore draait vóór i18n/localized-route projection;
- een verifier volgt de actuele canonieke UI-authority, niet een historische selector;
- exacte deploy zonder functionele browser-readback blijft non-green.

Specifiek voor pricing:
`normaliseer-site-ui → pricing restore → Bedrijfslek restore → apply-i18n → localized routes`.

De productie-gate moet lifecycle, plan, billing en NL→EN→NL daadwerkelijk bedienen.


## Same-route locale authority

Fingerprint: `i18n|mobile-switcher|same-route-authority|2026-09-29-v1`.

Voor publieke NL/EN-switching geldt permanent: taal wisselen verandert alleen de locale, niet de functionele route. Dus `/x ↔ /en/x`; alleen de homepage gebruikt `/ ↔ /en/`. Build-time injectors moeten route-aware zijn en bestaande stale switchers herschrijven. Production green vereist een echte NL→EN→NL browser-roundtrip.


### Runtime guard voor locale-links

Naast build-time route-aware injectie normaliseert de publieke runtime elke taal-link opnieuw naar de equivalente actuele route. Daarmee blijven NL/EN-switches correct wanneer oude DOM-fragmenten of gecachte markup aanwezig zijn. De injector zelf moet vóór promotie syntactisch uitvoerbaar zijn.

### Route-aware shell hash normalisatie

Canonieke shell-integriteit vergelijkt structuur en inhoud, maar routegebonden locale-state is geen shell-drift. Bij hashing van gedeelde shellcomponenten moeten uitsluitend de href-waarden van `data-bg-language-option="nl|en"` en hun route-afhankelijke `aria-current` worden genormaliseerd. Andere links, labels, classes, volgorde en markup blijven hash-bepalend. Zo kan `/prijzen ↔ /en/prijzen` correct route-aware zijn zonder een vals mobile-menu drift-alarm te veroorzaken.



## Canonical CMS/i18n assurance

Fingerprint: `powerhouse|public-cms-i18n|shared-shell-same-route|v1`.

Green assurance voor publieke websitewijzigingen moet expliciet controleren dat de centrale shell header/footer/megamenu/navigatie én locale-controls bezit; dat NL/EN dezelfde route behoudt; dat i18n-assets versiegebonden zijn; dat exacte main gelijk is aan de productie-deploy; en dat live browser-readback NL→EN→NL op ten minste een money page en een gewone publieke route slaagt. Een groene PR of preview is niet terminal.


## Live Assurance governance closure — 2026-09-29
Fingerprint: `powerhouse|live-assurance-writeback|2026-09-29-v1`.

Na iedere materiële live recovery:
- schrijf exacte production identity terug naar Brain learning, ledger, menselijke docs en System Map;
- update relevante skills en AGENTS/chat-contract;
- voer read-after-write uit op die governance-projections;
- behandel een exact ready deploy uitsluitend als deploymentbewijs;
- houd functionele subketens zoals pricing, NL↔EN, content-publicatie en connector-readback onafhankelijk gated;
- hergebruik nooit historische LIVE/GREEN als actuele health zonder verse provider/runtime readback.


## Live promotion governance closure

Fingerprint: `powerhouse|live-promotion|governance-closure|2026-09-29-v1`.

Voor iedere materiële live-promotie geldt voortaan één verplichte closure-lijn:
`protected merge/main → exact productie/provider side effect → actuele readback → outcome-truth → Brain learning → skill/agent/chat projection → ledger/docs → System Map → read-after-write`.

Belangrijk:
- een ready deploy is uitsluitend deploymentbewijs;
- capability-specifieke uitkomsten blijven onafhankelijk gated;
- de governance-writeback hoort bij dezelfde obligation en mag niet als los vervolgwerk blijven liggen;
- toekomstige chats/agents voeren deze writeback standaard uit zonder dat de gebruiker opnieuw “borg / leg vast / documenteer” hoeft te zeggen.


## Live-ready versus functional green

Fingerprint: `production|live-ready-vs-functional-green|2026-09-29-v1`.

Powerhouse houdt deployment truth en capability truth altijd gescheiden:

- `DEPLOYMENT_READY/LIVE`: exacte actuele main is door de provider als productie gepubliceerd en teruggelezen.
- `FUNCTIONAL_GREEN`: de relevante capability is daarna ook functioneel via actuele readback/outcome bewezen.

Verboden:
- Netlify `ready/current` gebruiken als bewijs voor pricing, NL↔EN, connectors, social, content of business outcome.
- Een merge, provider-ACK of deploy promoveren naar whole-system GREEN.
- De governance-writeback uitstellen tot de gebruiker opnieuw vraagt om borging.

Iedere materiële live-promotie schrijft in dezelfde obligation-lineage terug naar Brain learning, relevante skills, AGENTS/chat-contract, ledger/docs en System Map.
