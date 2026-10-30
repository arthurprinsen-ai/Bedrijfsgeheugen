# Development ledger — ondernemer ziet verwacht vs. werkelijk (30 oktober 2026)

Fingerprint: portal|entrepreneur-experience|prediction-action-outcome-feedback|20261030-v1
Status: Candidate on protected PR; actual production, tenant user experience and business effect NOT YET VERIFIED.

## Probleem / oorzaak
De Executive Cockpit toonde afzonderlijk 'Meten' en 'Leren', maar de ondernemer kon op dezelfde plaats niet begrijpelijk vergelijken wat AI vóór een beslissing voorspelde met het onafhankelijk gemeten effect. Daarmee is de terugkoppeling nog te abstract en blijft ROI/invloed op de volgende beslissing moeilijk navolgbaar.

## Hergebruik / herstel
- Hergebruik dezelfde Executive Projection en ONE BRAIN outcome-evidence; geen extra database, scheduler of analyticscollector.
- Nieuwe read-only kaart bij de dagstart, zonder de bestaande navigatie of rechten te wijzigen.
- Comparability gate: ondersteunde en identieke eenheden; geen delta voor ontbrekende waarde of eenheden.
- Realization gate: expliciete outcome-verificatiestatus plus gezonde bron en source_refs.
- Learning gate: afzonderlijk learning_verified, learning_evidence_refs en gekoppelde volgende beslissing.
- Escaping, disclosure, responsive CSS en focusring voor mobiele en keyboard-UX.
- Menselijke ontwerp- en evolutieregels in docs en bestaande Company Intelligence-agent skill.

## Gecontroleerde kandidaten (geen productieclaims)
- Tests: tests/brain-entrepreneur-impact-feedback-20261030.test.mjs.
- Lokale pure-parser/formatteerchecks door code-review, 9/9 gecontroleerde gevallen geslaagd (connectorcode); dit is geen volledige Required/CodeQL/DOM/Browser-evaluatie.
- Geen mutatie van klantdata; geen afgeleid financieel resultaat als gerealiseerde omzet geboekt.
- Geen nieuwe UX/GA4-events totdat bronautoriteit, consent en bestaande instrumentatie passend zijn.

## Openstaande evidence / volgende route
1. PR Required/BRAIN/CodeQL en bestaande frontend-regressies controleren.
2. Preview/production browserreadback op mobiel/desktop en keyboard; tenant isolatie.
3. main SHA == deployment SHA en exacte eigen productie-tenant correctheid.
4. Effectonderzoek: taakvoltooiing, begrijpend gebruik, time-to-decision, bewijsdekking en onafhankelijke bedrijfseffecten over vergelijkbare perioden.
5. Bij bewezen verbetering pas als vaardigheid promoveren en in ONE BRAIN outcome memory/agent routine toepassen.

Protect last-known-good. RED or unverified is an open obligation, not green by convention.

## Integratie: strategische advieskwaliteit en CRO-waarheid

- Nieuw bestand: `portal-v2/operating-system/strategic-advisor.js` (read-only, fail-closed).
- Directie en besluiten: bestaande `executive-cockpit.js` en `operating-system-ui.js`.
- Tests: `tests/brain-strategic-advisor-one-loop-20261030.test.mjs`, inclusief ongefundeerde uitkomsten/ROI, brongezondheid, XSS, onjuiste action-ID en lege tenant.
- Standaard: strategieadvies met diagnose, alternatieven, expected-value/consent grens, actie en onafhankelijk gemeten resultaat. Geen fictieve McKinsey/BCG-affiliatie.
- Observatie: 9.202 growth-events (7 dagen) maar 0 persistent primary CTA en 0 growth outcomes, onafhankelijk omzetbewijs voor deze keten ontbreekt. Dit is een meetgat/hypothese, geen bewezen 0 engagement.
- PR #5211 eerste CI admission faalde met ontbrekende vier machine-metadata-velden, bronrun 41105463495. Exacte metadata is bijgewerkt in dezelfde PR; opnieuw verifiëren alvorens Required groen te claimen.
- Supabase ONE BRAIN: `delivery|hygiene|pr5211-missing-candidate-metadata|20261030-v1` OBSERVED, occurrence 1, providerbron/run vastgelegd. CAS-promotie van oorzaak/preventie is nog niet gelukt; niet als afgerond presenteren. Repositorydoc en agent-skill bewaren de oorzaak en preventie.
- Status blijft CANDIDATE tot protected checks, exacte main→Netlify en browser/tenant-readback; zakelijk succes bovendien vereist eigen bron-/provider- en gecontroleerd CRO-bewijs.
