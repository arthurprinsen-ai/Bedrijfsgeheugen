# 2 november 2026 — oorspronkelijke LinkedIn-brontest mag duplicaten niet terugbrengen

## Oorzaak en bewijs
De oorspronkelijke volledige BRAIN-run [41414521650](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41414521650), backend-job 125175284475, voerde 5.367 tests uit (5.339 geslaagd, 26 mislukt). Twee regressies eisten letterlijk terugval naar `|| eligiblePersonal[0] || null` bij LinkedIn persoonlijk. De oorspronkelijke generator selecteert aantoonbaar eerst een niet-afgekeurde, niet-verouderde bronsituatie met `eligiblePersonal.find((s:any)=>!isStalePersonalSource(s,recentPersonalTypes)) || null`. De oude terugval kan precies dezelfde afgekeurde verhaalfamilie opnieuw gebruiken en zou de bestaande reparatie van [PR #5175](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5175) ongedaan maken.

## Gerichte reparatie
Beide originele testbestanden behouden hun positieve eisen voor getoetste bronnen, leverancierbevestiging en uitsluiting van afgekeurde recommendation_id. Ze eisen nu expliciet de actuele veilige selectie en verwerpen elk `eligiblePersonal[0]`-fallbackcontract. Niets aan de oorspronkelijke provider, orchestrator, publisher, auteuridentiteit, toestemming, redactiereview of duplicaatpoort wijzigt. Een ontbrekende verse bron is een blokkade voor juist die publicatie, geen aanleiding om de dagelijkse executor te stoppen.

## Eén lerende en bewijsbare keten
Fingerprint `powerhouse|brain|stale-personal-duplicate-test-fallback|20261102-v1`. De oorspronkelijke sociale herstelagent, centrale AGENTS, ONE BRAIN machine learning met replay/shadow/canary, menselijke documentatie en append-only ledger blijven in dezelfde beveiligde PR. Geslaagde gerichte tests zijn niet voldoende voor een claim 'allemaal groen': oorspronkelijke Required, CodeQL, exacte volledige backend-BRAIN, terminalafsluiting en onafhankelijke provider-readback zijn verplicht. Verzend-ID, echte klantreactie, gekwalificeerde lead en betaalde order worden niet verzonnen.

## Preventieregel
Bij elke duplicate-reject eerst bronfamilie, laatste publicaties, afgekeurde recommendation_id en echte providerbron controleren. Selecteer uitsluitend een onafhankelijk verse familie, anders expliciet BLOCKED met herstelverplichting in dezelfde lineage; nooit stilzwijgend de eerder afgekeurde bron opnieuw publiceren.
