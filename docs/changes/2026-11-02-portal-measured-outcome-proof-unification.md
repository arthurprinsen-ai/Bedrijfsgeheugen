# P0 — Eén aantoonbare meetuitkomst voor het originele ondernemersportaal
Datum: 2 november 2026. Eigenaar: originele Portal V2 / Company Intelligence OS / ONE BRAIN. Parent P0 #4198. Status: SOURCE CANDIDATE; GEEN liveclaim.

## Aanleiding en bronoorzaak
Na de uitrol van PR #5247 heeft het oorspronkelijke Portal V2 drie interpretaties van een geverifieerd effect:
- `outcome-feedback.js`: toont "Resultaat onafhankelijk bevestigd" zodra `OUTCOME_VERIFIED` en gezonde bronref aanwezig zijn, zelfs zonder daadwerkelijke waarde/nulmeting.
- `executive-cockpit.js`: los `provenOutcome` op status + gezonde refs; de dagelijkse kaart "Meten" en "Leren" kunnen daardoor eerder groen suggereren dan de geldige meetlat.
- `strategic-advisor.js`: telt brongezonde status-only uitkomsten als "verifiedOutcomes".
De bestaande `customer-value-briefing.js` uit PR #5247 eist terecht wel waarde, eenheid, KPI, nulmeting en periode. Verschillende criteria in één portaal zijn een source-confirmed false-green **risico**. Er is geen specifieke daadwerkelijk benadeelde klant of onterechte euroclaim uit de productie gemeten.

## Betaalroute: echte uitleg, geen foutdiagnose
Live Supabase: 5 `saas_checkout_intents` (2 created, 2 expired met Mollie-payment-ID, 1 completed zonder Mollie-payment-ID). De completed rij is de gratis proef via originele `startTrial()` en hoort bij een `trial/pro/canceled` subscription; de code gebruikt bewust geen Mollie-payment-ID bij deze route. Dit is geen technisch ontbrekende betaaltransactie. Gratis trial = geen betaalde klant of gerealiseerde omzet. De huidige commerciële outcome-registratie bevat 0 positief gerealiseerde euro's. Niet administratief repareren met een verzonnen betaling.

## Correctie binnen één oorspronkelijke keten
Export `verifiedCustomerOutcome` in oorspronkelijke `outcome-feedback.js`. Alleen status `VERIFIED` / `OUTCOME_VERIFIED` / `REALIZED_VERIFIED` én gezond bronbewijs, exact action-ID, eindige daadwerkelijk gemeten waarde (0 is mogelijk), ondersteunde eenheid (EUR/HOURS/COUNT/PERCENT), metric-ID, baseline-ID en periode mogen het label "Gemeten effect onafhankelijk bevestigd" unlocken.
De oorspronkelijke `executive-cockpit.js`, `strategic-advisor.js` en `outcome-feedback.js` consumeren dezelfde read-only predicate; geen tweede telemetry/store/agent/scheduler, geen tenant- of auth-wijziging en geen nieuwe payment/outreach side effect. Leren vereist vervolgens de aparte originele learning_evidence_refs en gekoppelde volgende beslissing. Meetwaarde in EUR is nog geen provider-betaalde order of door Powerhouse veroorzaakte ROI.

## Test en release-acceptatie
Historisch replay: `tests/brain-portal-measured-outcome-proof-unification-20261102.test.mjs` controleert ontbrekende actie, metriek, periode, nulmeting, waarde, unit, stale refs, provider ACK, status-only uitkomst, trial-completed, learning zonder bron en exacte positieve meetwaarde.
Oorspronkelijke tests `tests/brain-entrepreneur-impact-feedback-20261030.test.mjs`, `tests/brain-strategic-advisor-one-loop-20261030.test.mjs` blijven in dezelfde source-evidencelus.

Required/hygiene/lease/Portal/backend/CodeQL/System-Map/Netlify-build moeten slagen op exact head; daarna beschermde merge en productie Netlify commit-ref-readback. Een echte geauthenticeerde tenant/A-B-portaalreadback en klant-effect blijven afzonderlijk vereist. De oorspronkelijke ONE BRAIN fingerprint blijft OBSERVED totdat dit onafhankelijk is geverifieerd. Geen "never again" claim zonder geslaagde replay én toekomstige normale runs. P0 #4198 blijft open voor betaalde orders en klantwinst.
