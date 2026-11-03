# 3 november 2026 — P0 Edge-worker boot 503 door dubbele `const revisionInput`

## Feitelijke productiestoring
Na beschermd gemergede #5378 gaf de oorspronkelijke `powerhouse-content-orchestrator` **ACTIVE v601** op 3 november om 20:47:29Z HTTP503. Exacte originele functie-log: `worker boot error: Uncaught SyntaxError: Identifier 'revisionInput' has already been declared` in de oorspronkelijke `index.ts`. Originele content-loop request #20183 werd HTTP409 RED met 1/4 daadwerkelijk provider LIVE_PROVEN; nested personal orchestrator HTTP503, geen providerpublicatie. Oorzaak is geen OAuth of generieke providerstoring.

## Bronoorzaak
PR #5378 verving de oude afkeuringsprompt door een nieuwe compactere `correctionPrompt` en brongebonden `revisionInput`, maar liet de oude `const revisionInput` nog in hetzelfde lexical block staan. CI en officiële Supabase Preview detecteerden deze opstartfout niet; de preview eindigde zelf bovendien op `SQLSTATE 57P01` door administrator connection termination.

## Gecontroleerde herstelbron
Verwijder uitsluitend de oude dubbele `revisionInput`-declaratie na de bestaande commentaarregel. Behoud de nieuwe brongebonden geverifieerde invoer, originele strikte editor, unieke wereldwijde story-reservering, providerautorisaties, bestaande owner/lease en echte provider-readback. Voeg een test toe die **exact één** declaratie afdwingt en controleert dat deze voorafgaat aan de beperkte `retryIncompleteEditorialDraft`.

## Afsluitbewijs
Eerst exacte bron + test/learning/skill/ledger door beschermde GitHub Required/BRAIN/CodeQL en officiële Supabase Preview. Vervolgens beschermde merge en originele Supabase Edge v>601, twintig bestanden exact/source readback en **werkelijke bootuitvoering** zonder HTTP503. Publicatie pas groen bij provider-ID, onafhankelijke LinkedIn-readback en meting. 1/4 blijft 1/4 zolang die ontbreekt. Geen tweede publisher.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
