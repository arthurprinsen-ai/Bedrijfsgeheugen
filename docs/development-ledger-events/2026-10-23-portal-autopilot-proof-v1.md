# Portal V2 — bewijsvaste autonome ondernemersreis, 23 oktober 2026

Canonical owner: [#4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585). Fingerprint: `portal|entrepreneur-autopilot|verified-learning-chain|20261023-v1`.

## Echte observatie en hergebruik
De bestaande `entrepreneur-journey-model.js` toont reeds de nulmeting, doelen, geauthenticeerde Powerhouse-signalen, een beslisvoorstel en eventuele brongeverifieerde uitkomsten, maar nog niet een afzonderlijk leesbare eigenaar-projectie van de leerlus. De bestaande `owner-operating-model.js`, `action-policy.js` en `entrepreneur-journey-view.js` blijven eigenaar van respectievelijk tenantbewijs, uitvoeringsveiligheid en klantervaring. Er wordt geen nieuwe agent, planner, database, secrethouder of scheduler gecreëerd.

## Begrensde verbetering
`buildAutopilotEvidence` toont aantallen voorstellen, vragen om besluit, brongeverifieerde uitkomsten en bewezen leercycli. Voor resultaten zijn identiteit, gezonde bronnen en onafhankelijke uitkomstverificatie verplicht; dezelfde uitkomst-ID telt één keer. Een leercyclus vereist aanvullend expliciet leerbewijs en de gekoppelde volgende beslissing. Het bovenliggende Heartbeat-signaal blijft UNKNOWN als actuele klantgebonden Brain-observatie ontbreekt. Gebruikers kunnen bestaande acties en bewijsregels openen. Zonder aantoonbare, onafhankelijk geverifieerde execution receipts meldt het scherm niet dat acties autonoom zijn uitgevoerd.

## Regression / release
`tests/brain-portal-autopilot-proof-v1.test.mjs` legt tenantgrenzen, unknown-status, incidentcorrelatie, evidence en deduplicatie vast. Geschikte entrypointtests: `tests/brain-portal-entrepreneur-goal-home-v1.test.mjs` en `tests/brain-trusted-advisor-assurance-v1.test.mjs`. Full required PR pipeline, CodeQL, beveiligde merge, provider-accurate production SHA readback en echte tenant A/B journey blijven harde acceptatievoorwaarden. Deze bronregistratie is nog geen livebewijs.

## Datagedreven dagelijkse verbetering
Herbruik de huidige Brain-learning/evals/Heartbeat en het bestaande foutregister om gemiste bronbewijzen, verkeerde causaliteitsclaims, duplicaten en ongerechtvaardigde autonomie per bestaande fingerprint te leren. Meet als kwaliteitsindicator de fractie afzonderlijk bewezen leercycli ten opzichte van bewezen uitkomsten **alleen** bij actuele tenant- en bronscope; een indicator bewijst geen causaliteit of financieel voordeel. Er mag geen tweede leerregister, fictieve ROI of vervangende scheduler ontstaan.
