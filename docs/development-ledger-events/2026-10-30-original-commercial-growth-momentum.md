# Development ledger — commerciële trendlus in bestaande Powerhouse
**30 oktober 2026.** Originele eigenaar: Powerhouse CRO Control Center / ONE BRAIN / Heartbeat, bestaande Portal V2. Geen nieuwe scheduler, losse writer, tweede dataregister of provider.

**Bronproblemen:** `powerhouse_cro_conversion_evidence_v1`: 4.401 niet-bot-gemarkeerde pageviews/7d, 0 CTA-events, 0 form-submit-intents, 0 gekoppelde gekwalificeerde leads/30d, 0 betaalde orders met onafhankelijk providerbewijs. `growth_page_daily` heeft pageviewregels van 25–30 oktober; de voorafgaande week heeft onvoldoende vergelijkbare activiteit. Top /over-ons telt circa 2.377 niet-bot-gemarkeerde paginaweergaven, zonder zelfstandige human verificatie. CRO-experiment: treatment 1, holdout 0. Social snapshots per provider zijn deels ouder of partial scope; LinkedIn persoonlijk heeft geen views. Geen legitieme winnaar en geen garantie op stijging.

**Wijziging op candidate-branch (NIET live op dit moment):**
- `tools/content-growth/original-commercial-momentum.mjs`: bestaande datasets puur lezend met twee volledige afgesloten 7d perioden en source sufficiency; correct `null` bij onbetrouwbare CTA-/mail-/betaaluitkomsten; prioriteit bij nul CTA ondanks gemeten verkeer.
- `netlify/functions/powerhouse-cro-other-data.mjs`: dezelfde original admin-only API projecteert de nieuwe analyse; bestaande 15 lussen, social, CRO proof en outreach worden hergebruikt en niet herschreven.
- `portal-v2/modules/andere-data.js`: dezelfde ‘Andere data’-tab geeft de concrete trend, anomalie, eigenaar, onbekende e-mailantwoorden en onafhankelijke orderstatus. Originele admin JWT blijft ongewijzigd.
- `tests/brain-original-commercial-momentum-20261030.test.mjs`: historische 4401/0-anomalie, Amsterdam volledige 7d-kalenderdagen, nulbasislijn niet stijgend claimen, email ≠ replies/orders, regres op bestaande originele auth/portaal.
- `.agents/skills/powerhouse-social-cro-funnel/SKILL.md`, `brain/learning/2026-10-30-original-commercial-momentum-evidence-v1.json` en menselijke documentatie leiden uitvoeringsbesluiten terug naar de bestaande eigenaar.

**Vereiste gates:** protected PR-admission, Required/BRAIN/CodeQL, Netlify parity, native main merge, immutable deploy plus admin-only production readback en natuurlijke CRO/ONE BRAIN-skilltoepassing. Alleen daarna mag de code LIVE gemeld worden, maar bedrijfsresultaat pas bij echte beweging over meerdere vergelijkbare periodes met onafhankelijk providerbewijs. Geen gefingeerde omzet, kliks, replies of dubbele publicatie.
