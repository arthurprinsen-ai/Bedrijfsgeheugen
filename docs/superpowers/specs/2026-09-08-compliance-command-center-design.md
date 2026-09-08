# Compliance Command Center — Design

## Doel
Bouw één evidence-first compliancebesturingslaag in het Bedrijfsgeheugen klantenportaal die tegelijk laat zien:
1. hoe Bedrijfsgeheugen zelf aantoonbaar omgaat met EU AI Act en NIS2/Cyberbeveiligingswet;
2. hoe ver een klantorganisatie is op basis van ingevulde portaaldata;
3. welke ontbrekende informatie of controls het grootste risico veroorzaken;
4. waarom vervolgstappen nodig zijn;
5. welk bewijs nodig is voordat een status groen mag worden;
6. hoe een audit/accountant/toezichthouder één controleerbaar overzicht kan krijgen.

## Juridische tijdsbasis
- EU AI Act is de actuele EU AI-regelgeving; toepasselijkheid en verplichtingen worden per AI-use-case bepaald.
- Transparantieverplichtingen zoals artikel 50 zijn sinds 2 augustus 2026 relevant waar toepasselijk.
- Voor Nederland wordt NIS2 geïmplementeerd via de Cyberbeveiligingswet (Cbw), in werking sinds 15 augustus 2026.
- NIS/Wbni wordt alleen als legacy/mapping getoond; het is geen parallel actueel Nederlands compliancekader.
- AVG/GDPR wordt als cross-cutting datalaag gekoppeld waar persoonsgegevens, verwerking, bewaartermijnen, subprocessors en doorgifte relevant zijn.

## Kernprincipe
Geen complianceclaim zonder bewijs. `GREEN` betekent dat een toepasselijke verplichting een control, actuele evidence en verificatie heeft. Ontbrekende of niet-verifieerbare gegevens worden `UNKNOWN`, `MISSING`, `IN_PROGRESS`, `EVIDENCE_MISSING` of `VERIFIED`.

## Twee perspectieven
### Bedrijfsgeheugen
Toont de eigen compliancepositie op basis van technische/configuratie-evidence, policies, AI-register, subprocessors, dataflows, security-controls en auditbewijzen. Onbewezen onderdelen blijven expliciet onbekend of rood.

### Klantorganisatie
Gebruikt ingevulde portaldata als input. De engine vertaalt antwoorden en ontbrekende antwoorden naar controlstatus, bewijsdekking, risicoprioriteit en eerstvolgende actie. Een niet-ingevuld antwoord wordt nooit automatisch als non-compliant bestempeld wanneer toepasselijkheid nog niet is vastgesteld; status wordt dan `UNKNOWN` met een scope- of evidenceactie.

## Information architecture
De nieuwe route heet `Compliance Command Center` en valt onder `Trust & Governance` in Business OS.

Bovenaan:
- Total Compliance Pulse
- EU AI Act
- NIS2 / Cbw
- Data & privacy
- Open critical risks
- Controls zonder bewijs
- Audit readiness
- Laatste verificatie

Daaronder vijf werkvlakken:
1. **Executive Pulse** — bestuurlijke samenvatting, trend, top 5 risico's, belangrijkste vervolgstap.
2. **Compliance Constellation** — interactieve visualisatie waarin regelgeving, controls, evidence, risico's en acties als gekoppelde nodes zichtbaar zijn.
3. **Control Matrix** — wet/eis → applicability → control → evidence → owner → status → risk → next action.
4. **Remediation Flightplan** — geprioriteerde route op basis van severity, dependency, evidence gap en impact; toont waarom deze stap nu eerst moet.
5. **Audit Room** — audit/accountant/toezichthouder-modus met snapshotdatum, scope, controlstatus, evidence-index, open afwijkingen en print/PDF-ready view.

## Data model
`portal-next/compliance-engine.js` bevat pure functies en canonical statuslogica.

Control record:
```js
{
  id,
  framework,
  requirement,
  applicability,
  control,
  evidence,
  status,
  severity,
  owner,
  reason,
  nextAction,
  sourceKeys,
  verifiedAt
}
```

Statuses:
- `NOT_ASSESSED`
- `NOT_APPLICABLE`
- `UNKNOWN`
- `MISSING`
- `IN_PROGRESS`
- `EVIDENCE_MISSING`
- `VERIFIED`

`VERIFIED` vereist minimaal `applicability === 'applicable'`, control aanwezig, evidence aanwezig en een geldige `verifiedAt`.

## Risicomodel
Prioriteit is deterministisch en uitlegbaar:
- critical/high/medium/low severity;
- toepasselijkheid;
- ontbrekende control versus alleen ontbrekend bewijs;
- afhankelijkheden;
- recency van evidence;
- aantal gekoppelde verplichtingen.

De UI toont altijd de reden achter prioriteit, bijvoorbeeld: "Eerst MFA aantonen, omdat deze control meerdere Cbw-toegangs- en continuïteitseisen afdekt en momenteel geen evidence heeft."

## Portalintegratie
- Business OS-navigation krijgt `Compliance Command Center` onder `Trust & Governance`.
- `portal-content-map.js` mapt de route naar het nieuwe workspace/component.
- Nieuwe UI wordt modulair in `portal-next/compliance-command-center.js` en `portal-next/compliance-command-center.css` gebouwd.
- De legacy `klantportaal.html` blijft inhoudelijk intact; de nieuwe module gebruikt de bestaande portal-next workspace/embed-benadering.
- Waar bestaande AI Act-, privacy-, data-soevereiniteit-, connector-readiness- of governance-data bestaat, wordt die als bron gekoppeld; niet-geverifieerde productiefeiten worden niet hardcoded als compliant.

## Audit/export
Audit Room biedt:
- print/PDF-ready layout via browser print;
- snapshot metadata;
- geselecteerde scope (Bedrijfsgeheugen / klant);
- frameworkstatus;
- open findings;
- evidence-index;
- datum laatste verificatie;
- disclaimer dat het dashboard een evidence-/controlmanagementlaag is en geen formeel juridisch oordeel vervangt.

## UX
Out-of-the-box maar zakelijk bruikbaar:
- donkere/lichte compliance constellation met bewegende evidence-lijnen alleen voor daadwerkelijk gekoppelde evidence;
- risk heatmap/radar;
- "Waarom nu?"-explainers;
- drill-down cards zonder pagina te verlaten;
- touch-first mobiel;
- geen decoratieve animaties die status suggereren zonder evidence.

## Fail-closed invarianten
- geen fictieve groenstatus;
- geen compliancepercentage op onbeoordeelde verplichtingen alsof ze geslaagd zijn;
- onbekend is zichtbaar onbekend;
- legacy NIS wordt gemapt naar NIS2/Cbw, niet dubbel geteld;
- audit snapshot vermeldt scope en tijdstip;
- ontbrekende klantinput genereert een eerstvolgende actie;
- evidence die ouder/ongeldig is kan een eerder groene control terugzetten naar `EVIDENCE_MISSING`.

## Testcontract
Minimaal geautomatiseerd testen:
1. `VERIFIED` kan niet zonder evidence + verifiedAt;
2. legacy NIS telt niet dubbel naast NIS2/Cbw;
3. unknown applicability resulteert niet in een false non-compliance claim;
4. risk ranking zet critical/high gaps vóór lage evidence gaps;
5. ontbrekende klantinput levert reason + nextAction;
6. audit snapshot bevat scope, timestamp, frameworkstatus, findings en evidence index;
7. navigation bevat Compliance Command Center;
8. UI bevat executive, control, remediation en audit views.

## Completion
Feature is pas klaar als exact dezelfde kandidaat-SHA alle relevante portal/Required/BRAIN-delivery gates groen doorloopt en de productie-readback exact die gepromoveerde SHA bevestigt.