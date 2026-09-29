# Instagram current-user identity preflight v1 — 29 september 2026

De Mira Reel was volledig vision/continuity-gevalideerd, maar de canonical publisher viel vóór provider-write uit op `INSTAGRAM_GET_USER_INFO`. De oorzaak was dat de Instagram Login-verbinding een connection node `id` en een aparte Graph `user_id` levert.

De publisher gebruikt voortaan `ig_user_id='me'`, leest zowel `id` als `user_id`, valideert `user_id=17841446582493753`, `username=bedrijfsgeheugen.nl` en `account_type=BUSINESS`, en gebruikt daarna dezelfde canonical Composio-verbinding voor create, publish en readback.

Live closure: Reel media-id `18105956765257858`, provider-readback op `bedrijfsgeheugen.nl`, permalink `https://www.instagram.com/reel/Dd4MOdTEarq/`.
