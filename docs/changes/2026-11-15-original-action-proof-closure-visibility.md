# 15 november 2026 — Uitgevoerde aanbevelingen zichtbaar tot werkelijke actieafsluiting

Oorspronkelijke P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Feitelijke oorzaak
De bestaande directiecockpit toonde vooral de eerstvolgende actie. De customer-value briefing filterde DONE/COMPLETED weg. De executive projection liet vijf aanbevolen acties toe en had geen actiehistorie. Daardoor was na uitvoering geen stabiel tijdlijnzicht op provider-ontvangst, concrete meting, financiële netto-uitkomst, learning en daadwerkelijke originele ONE BRAIN-afsluiting. Onafhankelijke productiecontrole: 829 done action-value entries, geen bewezen netto bedrag. Dit is geen reden om DONE te herinterpreteren als besparing.

## Herstel binnen dezelfde portaalbron
De originele geauthenticeerde executive projectie accepteert nu optioneel een originele `source.action_history` en verwerkt deze met dezelfde tenant-`normalizeEvidenceEnvelope` en bewijsstatus; ontbrekende of onveilige rijen worden niet als bewijs weergegeven. Voor bestaande `next_best_actions` met historische status geldt dezelfde actiecontrole; brongebonden actie-ID’s worden uniek weergegeven. Geen nieuwe tabel, scheduler, CRM, modelbron, actie-writer of providerkoppeling.

De dagelijkse briefing toont daarnaast een compacte originele actielus:
1. wat als actiestatus is geregistreerd, inclusief DONE, BLOCKED of SENT, expliciet als registratie;
2. of de uitvoering onafhankelijk bewezen is met exact actie-ID, tenant, baseline, providerbewijs;
3. wat is gemeten (getypeerde KPI, baseline, periode), of waarom het bewijs ontbreekt;
4. bewezen bruto/netto besparing of expliciet onbekende kosten/besparingen;
5. of echte learning/volgende beslissing aanwezig is;
6. **review-ready** of **closed** uitsluitend op basis van oorspronkelijke ONE BRAIN-bewijsreadback.

Voor niet-financiële metingen mag de oorspronkelijke eigenaar de afronding beoordelen na geverifieerde uitvoering, meting en learning. Voor `NET_SAVINGS_EUR` zijn onafhankelijke kostprijs, referentiescenario en bruto-minus-kosten-controle extra verplicht. Een actie wordt NIET via HTML afgesloten. De bestaande actiepagina is de enige navigatieroute; provider-/ONE BRAIN-afsluiting vereist de bestaande geautoriseerde serverzijde.

## Aanvullende oorspronkelijke producer-consumer-overdracht
De originele executive tenant data owner moet bewezen `action_history` aanleveren met bron, timestamp, tenant en actor. De huidige globale commerciële actie- en outcome-views zijn geen rechtmatige rechtstreekse klant-frontendbron: eerst de bestaande serverautoriteit en RLS afdwingen. Original action/measurement owner moet provider- en kostendata verzenden naar originele Outcome Memory en de geauthenticeerde executive bron vullen; nog geen geverifieerde echte besparing. Een vraag om afsluiting moet via originele ONE BRAIN-authority worden uitgevoerd en onafhankelijk teruggelezen. Deze productie-inhoudelijke acceptatie blijft open in P0 #4198, ook als code tests en deploy slagen.

## Regressie en uitrol
`tests/brain-original-action-proof-closure-visibility-20261115.test.mjs` toetst DONE zonder receipt, uitvoering + non-EUR outcome, strict closure receipt, cross-tenant mismatch, duplicaten, XSS en geen directe provider-write. Bestaande financial model/forecast regressies blijven; exact-head Required/CodeQL, generatorpariteit, beschermd merge, exact Netlify release en geauthenticeerde tenant- en business-readback afzonderlijk verifiëren.
