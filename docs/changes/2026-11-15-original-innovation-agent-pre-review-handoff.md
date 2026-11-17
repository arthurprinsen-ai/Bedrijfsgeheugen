# Eén bestaande keten: innovatie na registratie doorzetten — 15 november 2026

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Aangetoond probleem
In de bestaande productie staan 14 geregistreerde originele innovatieopdrachten op PLANNED: 13 Engineering en 1 CRO. Geen heeft een onafhankelijke ontvanger-ACK, implementatie of gemeten effect. De bestaande dagelijkse GitHub-job las uitsluitend de bron terug en gaf een waarschuwing. Daarmee stopte de overdracht na registratie; een geregistreerde operatie is niet hetzelfde als werk dat een agent heeft verwerkt.

## Bestaande keten, echte brongebonden eerste taak
Voeg aan **dezelfde bestaande Powerhouse Daily Self Evolution-job** direct na de exacte bron-audit een bounded pre-review stap toe (geen extra cron/scheduler, tabel, worker of publisher). De stap leest kandidaat, oorspronkelijke ONE BRAIN-verplichting en originele `INNOVATION_INTAKE` met exact-count cursor. Hij toetst exact dezelfde eigenaar, bronrevisie, payload-SHA, voorgestelde actie, veiligheidsklasse en rollback, zonder onbetrouwbare modeltekst tot feit te verheffen.

Alleen veilige voorbereidende informatie wordt door de oorspronkelijke Brain `brain_transition_operation`-RPC met optimistic version CAS in de originele operatie-evidence geschreven, **met de bestaande status PLANNED**: de werkelijke uitvoering is nog niet begonnen en de oorspronkelijke watchdog mag niet verkeerd 'worker lost' aannemen. Bij identieke herhaling: geen nieuwe operatie of side effect; bij bronconflict/onzeker readback: fail closed. Voordat een pre-review als gedaan telt, wordt het oorspronkelijke record onafhankelijk opnieuw opgehaald. Geen ruwe kandidaatgegevens in publieke GitHub CI-artifacts.

## De vijf verplichte schakels
1. SOURCE_REGISTERED: oorspronkelijke bron, owner, SHA, bronrevisie en idempotency.
2. ORIGINAL_AGENT_PRE_REVIEW: originele agenttaak toetst bron/actie/rollback en schrijft alleen auditbewijs.
3. PROTECTED_IMPLEMENTATION: oorspronkelijke agent bouwt en levert een veilig, omkeerbaar voorstel via GitHub Required/CodeQL.
4. INDEPENDENT_PROVIDER_OUTCOME: productie-identiteit en resultaat door de provider teruggelezen, geen code-green als surrogaat.
5. ONE_BRAIN_CONSUMED_AND_LEARNING: juiste oorspronkelijke consument PROCESSED, Heartbeat-effect en aantoonbaar toegepast leren.

De eerste twee stappen kunnen na de release objectief aantoonbaar worden; de overige worden niet op groen gezet zolang ze niet echt uitgevoerd en gemeten zijn. Er wordt geen consumer_ack_verified, remote_ref of status VERIFIED gefabriceerd. De review_required grens blijft gelden. 

## Tests en terugval
`tests/brain-innovation-original-agent-pre-review-20261115.test.mjs` toont source-binding, rollback-poort, native version CAS, onafhankelijk get/readback, no-false-ACK, bounded idempotente replay en hetzelfde dagelijkse rooster. Bron ontbreekt of een operation is al begonnen: geen wijziging. Na groen beschermd mergen controleert de bestaande natuurlijke job de daadwerkelijke voortgang, daarna blijft de originele bron OPEN tot werkelijk resultaat.
