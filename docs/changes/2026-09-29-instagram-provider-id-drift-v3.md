# Instagram provider identity drift v3 — 29 september 2026

De publisher gebruikte eerder een historische numerieke Instagram provider-ID. Live provider-readback bewijst nu twee verschillende identifiers voor dezelfde canonical verbinding: Composio/provider node `id=28537384955950341` en Instagram Graph publication `user_id=17841446582493753`, met username `bedrijfsgeheugen.nl` en account type `BUSINESS`.

Structureel: `INSTAGRAM_GET_USER_INFO(me)` vóór iedere provider-write; lees `id` en `user_id` afzonderlijk; valideer een live niet-lege Graph `user_id` + juiste username + BUSINESS/CREATOR; bind identity-check → create → publish → readback aan dezelfde canonical connection en dezelfde live `user_id`. Numerieke IDs zijn observatie/evidence, geen compile-time authority. Bij drift hervat exact dezelfde ongepubliceerde claim.

Live closure: media-id `18105956765257858`, readback op `bedrijfsgeheugen.nl`, permalink `https://www.instagram.com/reel/Dd4MOdTEarq/`.

## Terminal live closure
- protected main: `8288b2ab5c6d7caa75a0e199d0273386776a66c2`;
- Supabase Edge Function `powerhouse-social-publisher`: v84;
- direct provider readback: media `18105956765257858`, username `bedrijfsgeheugen.nl`, product type `REELS`;
- permalink: https://www.instagram.com/reel/Dd4MOdTEarq/;
- `republish_forbidden=true`; future handling is reconcile/outcome learning only.
