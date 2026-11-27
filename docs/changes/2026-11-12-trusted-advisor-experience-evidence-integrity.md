# Trusted Advisor — bewijs boven uitstraling (12 november 2026)

## Aanleiding en bronnen
De openbare website presenteert Bedrijfsgeheugen terecht als mensgericht advies, met toegankelijke contactgegevens, bronnen en privacybeleid, maar er zijn controleerbare inconsistenties en een semantische fout in het bestaande Portal V2-assurancecomponent.

- De publieke contactpagina beloofde bij de gratis zelfscan een e-mailrapport binnen twee minuten, terwijl de werkelijke gratis `/zelfscan` twaalf vragen, ongeveer drie minuten en een direct resultaat zonder e-mailverplichting beschrijft.
- De verborgen verouderde `#s-klaar`-sectie in de scan-HTML herhaalde de onbewezen automatische mailbelofte en werd door indexeerbare tekst zichtbaar.
- `buildPageAssurance` rekende bronnen met onbekende `healthy`-status ten onrechte als gezond, en verhief een verwerking met `status=ok` op de pagina Uitkomsten & bewijs tot `verified`, ook zonder onafhankelijke provider-readback.
- In de zichtbare portaalcomponent stond het zelf toegekende label "Trusted Advisor" op de voorgrond, in plaats van de eigenlijke bronnen, aannames en beperkingen.
- Voorbeelden met waarden zoals 72/100 op `/portal-v2/` moeten vóór de cijfers expliciet als demo herkenbaar blijven totdat de geautoriseerde tenant/runtime-state gevalideerd is. Dit is een afzonderlijk verificatiepunt, niet impliciet opgelost door deze kandidaat.

Externe normatieve referenties:
- Maister/Green/Galford, Trust Equation: https://trustedadvisor.com/build-trust/trust-equation
- Stanford Web Credibility Guidelines: https://credibility.stanford.edu/guidelines/
- Nielsen Norman Group usability heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- Yale usability: https://usability.yale.edu/ux/best-practices/provide-a-status

## Correctie in de bestaande canonieke autoriteit
1. `portal-v2/trusted-advisor-assurance.js`: onbekende bronstatus niet groen; `ok`-transportstatus niet gelijk aan onafhankelijk bewezen outcome. Alleen expliciet geverifieerde *alle* getoonde uitkomsten met een bewijsreferentie mogen de outcome-pagina `verified` maken. Onderbouwing krijgt de gewone zichtbare naam "Bronnen en zekerheid".
2. `contact.html` en `zelfscan.html`: transparante en consistente zelfscanbelofte (12 vragen, ongeveer 3 minuten, resultaat direct, geen verplichte e-mail).
3. `brain/policies/trusted-advisor-assurance-v1.json`: breidt het al bestaande beleid uit voor publieke website, CMS, prijzen, zelfscan en klantgerichte no-hype/bron-first UX.
4. `.agents/skills/powerhouse-cms-editorial/SKILL.md`: dezelfde kwaliteitscriteria ingebed in de bestaande redactie-/CMS-skill, zonder tweede schrijver of executor.
5. `tests/brain-trusted-advisor-assurance-v1.test.mjs`: regressie voor onbekende health, generiek `ok`, en per-uitkomst bewijsreferenties.

## Overdrachts- en bewijslus
Deze wijziging gebruikt dezelfde bestaande site/portal/CMS-code, geen nieuwe executor, datasilo of agent. Bij daadwerkelijke tenantinformatie hoort de verwerking bij de originele Portal V2 → tenant BusinessInput → ONE BRAIN → Powerhouse/Heartbeat → advies/actie → providerbewijs → meting → leren-handshake. Zonder expliciete bronrevisie, tenant, herleidbare consumer-ACK en verificatie blijft de state onbewezen.

## Te bewijzen voor live groen
- Node-syntax en relevante regressietests op exact head SHA. Required, CodeQL, BRAIN en bestaande branchprotectie moeten geslaagd zijn.
- Beschermde merge, originele Netlify productie-SHA en echte webreadback van `/contact`, `/zelfscan` en `/portal-v2/`; geen nieuw deploypad.
- Browser/device-test van de portaalwaarschuwingsstaat en alle demo-/live-metrieken, inclusief geautoriseerde tenant en lege gegevens. Ook desktop- en mobiele toetsenbord- en clickpaden.
- Verifieer dat elke publiek zichtbare case een prototype óf echte rechtmatig getoonde klantcase is, en harmoniseer doorlooptijd/prijs, homepage-beloften, alle navigatie- en contactvarianten in een onafhankelijke vervolg-audit.
- Effectmeting per consent-geschikt 7/14/28-daags cohort: contact- en scanvoltooiing, klachten over misleidende beloften, kwalitatieve reacties, conversie. Geen vertrouwenstoename claimen zonder echte uitkomsten.

Status bij het aanmaken van dit document: CODE-CANDIDATE. Geen claim dat CI, live deploy, ontdubbelde klantstate of klantvertrouwen is bewezen. Originele eigenaar en gedeelde incidentlineage moeten open blijven tot onafhankelijk bewijs.

## Delivery-hygiene incident: eerste toelating
Eerste PR #5678 Required-run `43282763517` sloot terecht af met `PR_MACHINE_METADATA_INVALID` doordat bij het openen de verplichte `Obligation-ID`, `Delivery-Lane`, `Candidate-Type` en immutable `Base-SHA` nog niet in de PR-body stonden. Oorzaak: onvolledig broncontract bij PR-opening. Herstel: dezelfde PR-body volgens de originele canonieke metadata aangevuld; een nieuwe exact-head run moet dat opnieuw onafhankelijk controleren. Leerregel: alle verplichte machinevelden en exact `Change-Scope` vóór PR-opening vastleggen. Een oude rode run wordt niet hernoemd naar groen.
