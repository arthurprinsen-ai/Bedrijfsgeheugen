# Taakgericht gedeeld leren in Brain–Powerhouse–Heartbeat

**23 oktober 2026 · Kandidaat, nog geen productiebevestiging**

## Probleem en bewezen oorzaak
Er bestaan veel preventieregels en skills in het canonieke Brain. De algemene `chat-learning-preflight` gaf de omschrijving van de opdracht (`executionContext.intent`) niet door aan `selectSkillProjection`. Zonder expliciete `deliveryLanes` of fingerprints kreeg de agent alleen de universele verplichte basiskennis.

## Minimale implementatie
De bestaande skillprojectie routeert nu ook op taakintentie en ondersteunt Nederlandse domeintermen zoals `portaal`, `leren` en `ontwikkelstraat`. Verplichte preventieregels en expliciet gevraagde fingerprints blijven voorrang houden. Extra inferentie blijft binnen maximaal 12 geselecteerde skillrecords; een tweede zoekactie blijft nodig wanneer `deferred_count` positief is. Het `retrieval_evidence`-receipt vermeldt passende en niet-geladen kennis. Het receipt is **geen** bewijs dat een agent de learning toepaste of een KPI verbeterde.

## Controle en vervolg
Er zijn regressies toegevoegd aan het bestaande `tests/brain-chat-learning-fast-development-v2.test.mjs` voor relevantieselectie, expliciete prioriteit, Dutch portal intent, begrensd vervolgzoeken en daadwerkelijke doorgegeven intent. Dit pakket moet via verplichte Required/CodeQL, protected merge en exacte productie-/runtime-readback. Pas daarna mag de wijziging technisch LIVE heten. Zakelijke klantwaarde blijft onbewezen tot [#4358](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4358) onafhankelijk slaagt.

Dit is een verbetering binnen bestaande ONE BRAIN, niet een tweede agent, scheduler, database, foutregister of leerregister. De volledige evidence-lus staat in [audit #2750](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/2750#issuecomment-6362817130).

## Gerichte regressie tegen onterechte CI-classificatie
Op de vorige kandidaat bleek dat de losse regex `ci` ook binnen `social` of `financiële` kon matchen. De successor van de actuele `main`-versie herkent voortaan alleen het zelfstandige `CI`, `CI/CD` of `CICD` (naast de overige relevante termen). De bestaande test bevat negatieve social-/financieelgevallen en positieve CI/CD-gevallen. De oorspronkelijke kandidaatrelease is geen productieproof.
