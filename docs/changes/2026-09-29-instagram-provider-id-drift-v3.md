# Instagram provider identity drift v3 — 29 september 2026

De publisher gebruikte eerder een historische numerieke Instagram provider-ID. Live provider-readback bewijst nu twee verschillende identifiers voor dezelfde canonical verbinding: Composio/provider node `id=28537384955950341` en Instagram Graph publication `user_id=17841446582493753`, met username `bedrijfsgeheugen.nl` en account type `BUSINESS`.

Structureel: `INSTAGRAM_GET_USER_INFO(me)` vóór iedere provider-write; lees `id` en `user_id` afzonderlijk; valideer Graph `user_id=17841446582493753` + juiste username + BUSINESS/CREATOR; bind identity-check → create → publish → readback aan dezelfde canonical connection. Bij drift hervat exact dezelfde ongepubliceerde claim.

Live closure: media-id `18105956765257858`, readback op `bedrijfsgeheugen.nl`, permalink `https://www.instagram.com/reel/Dd4MOdTEarq/`.
