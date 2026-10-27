# Portal V2 ↔ Powerhouse end-to-end runtime v1

## Doel
Portal V2, Netlify API, Supabase canonical state en Powerhouse Brain vormen één gesloten runtimeketen in plaats van losse scherm-, write- en readbackpaden.

## Canonieke keten
1. Een ingelogde gebruiker wijzigt bedrijfsinformatie in Portal V2.
2. `/api/portal-business-input` schrijft de bronobservatie, Business/CurrentState-records en organism-impact naar de canonieke Brain-authority.
3. De write response levert `sourceRevision`, `brainRecordId` en `currentStateRecordId`.
4. De frontend behoudt dezelfde lineage als `PORTAL_INPUT-<sourceRevision>`.
5. De Powerhouse runtime bridge schrijft alleen bounded interaction-evidence op die lineage en leest vervolgens de canonieke Brain-projectie opnieuw.
6. `portal.runtime` wordt als derived projection in het geheugen geprojecteerd; dit maakt de klantstate niet dirty en veroorzaakt geen terugschrijflus.
7. Besluiten en bestaande Company Cockpit-acties blijven via dezelfde authenticated Brain API lopen.

## Auth en tenant
Alle browsercalls naar `/api/brain-operating-loop` gebruiken de Bearer-token uit dezelfde Netlify Identity-sessie als Portal State. De server bepaalt tenant en autorisatie; de browser kan geen tenant injecteren.

## Geen parallelle waarheid
Supabase/Brain blijft runtime-authority. Portal State blijft klantinput/read-model projectie. De browser krijgt geen eigen durable Brain-store en derived runtime wordt niet teruggeschreven als broninput.

## Refresh
Runtime wordt herladen na een canonieke portal-write, na Brain evidence, na authenticatie en bij terugkeer naar het venster. Een begrensde periodieke refresh houdt lang openstaande sessies synchroon.

## Fail closed
Zonder geldige sessie of Brain-readback worden geen live cijfers verzonnen. Bestaande lege/error states blijven leidend.
