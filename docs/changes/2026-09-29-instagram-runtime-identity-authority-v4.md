# Instagram runtime identity authority v4 — 29 september 2026

## Root cause
De publisher had de historische numerieke Graph-ID als literal verwijderd, maar twee runtimevergelijkingen verwezen nog naar de verwijderde variabele `INSTAGRAM_CANONICAL_USER_ID`. Daardoor kon een volgende publish-run op een ReferenceError vallen.

## Definitieve regel
Provider node `id` en Graph publication `user_id` worden iedere run live gelezen via `INSTAGRAM_GET_USER_INFO(me)`. Authority is:
- username `bedrijfsgeheugen.nl`;
- BUSINESS/CREATOR;
- live `user_id` van exact dezelfde geselecteerde canonical connection;
- dezelfde `user_id` voor create → publish → readback.

De waargenomen numerieke IDs worden alleen als evidence opgeslagen, niet als runtime-authority.

## Live evidence
De huidige provider-readback bevestigt BUSINESS `bedrijfsgeheugen.nl`, node-id `28537384955950341`, Graph user-id `17841446582493753` en live Reel `18105956765257858`.
