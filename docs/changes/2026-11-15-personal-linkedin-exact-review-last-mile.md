# #5913 — Persoonlijk LinkedIn: exact-gecontroleerde ik-verhalen vóór providerpublicatie

Datum: 15 november 2026. Origineel incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5913.

## Vastgestelde afwijking
De oorspronkelijke `linkedin_personal`-post van 15 november kreeg het onderwerp "Pakketbezorger getaserd na foutparkeren in centrum". De bron was een publiek NOS/AT5-bericht, geen door Arthur aangeleverde gebeurtenis. Postregistratie: https://www.linkedin.com/feed/update/urn:li:share:7527762350779662336/.

De originele `powerhouse_channel_decisions` en `content_publication_obligations` bevatten tegelijkertijd `pre_publish_gate=passed`, `published`/`LIVE_PROVEN`, een reviewerstatus `422` en `OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED`; bovendien verschillen `reviewed_text_hash` en `final_text_hash`. Exacte timing van de 422 ten opzichte van het provider-create moet uit onveranderlijke runtimelogs worden vastgesteld. Een 403/Forbidden bij `LINKEDIN_GET_POST_CONTENT` is readback-onzekerheid, geen reden voor herpublicatie; de bestaande URN blijft de idempotente waarheid over het verzendbij-effect. Er is geen bewezen sluitende redactionele goedkeuring voor deze tekst.

## Oorzaak en preventie
De oorspronkelijke orchestrator/reviewer kende een observerende publieke-bronfallback; de gebruikersnorm is strikter: **alleen user-origin, eerstehands persoonlijk ik-verhaal**. De repo bevatte op 15 november al een first-person-source gate, maar daarmee was het exacte laatste transportmoment nog niet zelfstandig beschermd tegen latere wijziging, stale PASS of inconsistente samengevoegde evidence. De concrete historische oorzaak (codeversie, sequence, oorspronkelijke response) is nader te bewijzen en niet automatisch gelijk aan de zichtbare latere 422.

De bestaande `supabase/functions/_shared/personal-first-person-story-gate.mjs` heeft nu ook `personalLastMilePublicationViolations`. De **enige** `powerhouse-social-publisher` roept die vlak vóór `LINKEDIN_CREATE_LINKED_IN_POST` aan: hij herberekent SHA-256 van het daadwerkelijke commentaar en vergelijkt die met exact die van de onafhankelijke reviewer, de oorspronkelijke kandidaat en de bron-evidence. Daarnaast weigert hij publicatie tenzij origineel user-source/revision én de vaste ik-verhaal/source-/zondagregels aantoonbaar PASS zijn. Een HTTP 422, ontbrekend/passend-gemaakte review, gewijzigd commentaar, gewijzigde bron of publieke nieuwsbron leidt tot een pre-provider veto. De bestaande claim, oorspronkelijke eigenaar en correct herstelpad blijven open. Geen tweede scheduler, geen Buffer/Make fallback, geen verzonnen ervaring.

De wijzigingen gelden alleen voor `linkedin_personal`; de bedrijfspagina blijft zijn eigen kanaal, transport en identiteit houden. Er wordt in deze herstelcode geen post geschreven, verwijderd of opnieuw verzonden.

## Tests en productie-eindcontrole
`tests/brain-personal-first-person-voice-and-source-20261115.test.mjs` dekt: valide geverifieerd ik-verhaal PASS, nieuwsincident fallback FAIL, 1Password-observatie FAIL, zakelijke bouwstatus FAIL, zondag FAIL, reviewer HTTP 422 FAIL, stale PASS/hash mismatch FAIL, en source-revision FAIL. Daarnaast verifieert de structurele test dat de laatste veto vóór de directe Composio-create zit.

Acceptatie blijft: exact-head Required/CodeQL + bestaande preview, protected merge, productie-Edge versie en source-parity op de daadwerkelijke main SHA, onafhankelijke negatieve reviewer/transporttest zonder publicatie, en volgende natuurlijke geschikte persoonlijke dag met exact provider-URN, auteur/tekst controle en ONE BRAIN/Heartbeat readback. Tot die bewijsstukken compleet zijn, **geen FULL_GREEN / niet live bewezen**.

## Foutregistratie, eigenaarschap, rollback
- **Owner:** bestaand Powerhouse Daily Publisher / original `powerhouse-social-publisher`; onafhankelijke broncontrole via `bg-pre-publish-review`.
- **Oorspronkelijke IDs:** 2026-11-15; `urn:li:share:7527762350779662336`; incident #5913.
- **Preventieregel:** geen transport bij ontbrekende gelijke actuele tekst-hash, ontbrekende bronbronstatus of bij 422.
- **Agent-skills:** `.agents/skills/personal-linkedin-life-only/SKILL.md` en `.agents/skills/linkedin-composio-publisher/SKILL.md`.
- **Leren:** `brain/learning/2026-11-15-personal-linkedin-exact-review-last-mile-v1.json`.
- **Rollback:** beschermde revert op exact deze transport-helper en aanroep. Behoud historisch post-URN, fouten, evidence en deduplicatie; nooit bestaande posts stilzwijgend vervangen.
