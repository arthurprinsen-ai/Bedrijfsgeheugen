# Originele innovatie-agent: volledige bewijsbundel vóór code-PR

Datum: 15 november 2026. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Aanleiding
De eerste echte autonome engineeringrun https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43754864334 bouwde een brongebonden correctie en opende PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908. Dit is voor het eerst daadwerkelijk uitgevoerde agent-code, maar nog geen productiebewijs of gemeten effect.

De beveiligde Required workflow wees de PR eerst terecht af op `LEARNING_EVALUATION_TESTS_REQUIRED:canary` (run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43755019133): het leerrecord had alleen historische regressie. Daarna wees Required opnieuw af op `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,human_documentation` (run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43755513741). De eerste generatieprompt noemde beide documenttypen ten onrechte optioneel.

## Gerichte verbetering
Binnen exact dezelfde `.github/workflows/powerhouse-daily-self-evolution.yml` verplicht de bestaande engineering-agent voortaan broncode, nieuwe regressie, één leerrecord, één menselijke wijzigingsbeschrijving en één ontwikkellog. De deterministische validator accepteert geen halve bundel en leidt de verplichte `historical_replay`, `shadow` en `canary` automatisch af uit de **bestaande** centrale `compileLearningEvaluationPlan` en `validateEvaluationContract`. De tests draaien vóór GitHub-PR-publicatie in hun vereiste modus.

Er komt géén nieuwe scheduler, queue, agent, testbeleid, database of externe sender bij. Originele bronidentiteit, tenant-isolatie, SHA/versiebeveiliging, rollback, Required/CodeQL, beschermde GitHub-merge en onafhankelijke Netlify/ONE BRAIN/Heartbeat-controlegegevens blijven verplicht.

## Correcte conclusie
Deze foutpreventie maakt de oorspronkelijke softwareleveringsketen betrouwbaarder, maar is pas bewezen live na geslaagde beschermde release en een nieuwe oorspronkelijke uitvoeringsrun. De 14 oorspronkelijke innovatieverplichtingen zijn niet automatisch afgerond; een PR of geslaagde regressie alleen bewijst geen businessresultaat.

Rollback: een beschermde revert van de generatorcontrole, zonder oorspronkelijke ONE BRAIN-verplichtingen, geschiedenis of leerbewijzen te verwijderen.
