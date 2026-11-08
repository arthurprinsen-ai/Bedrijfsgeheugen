# 2026-11-08 — Mira: 15 dagen zonder gepubliceerde Instagram-Reel

Status: OBSERVED. Alleen onderzoek en vastlegging; er is niets gerepareerd, gegenereerd of gepubliceerd en er zijn geen credits uitgegeven.

## Wat is gemeten

In `content_publication_obligations` (kanaal instagram, 25 okt t/m 8 nov) staat geen enkele rij met een extern ID. Zeven dagen eindigden op `MEDIA_ASSET_REQUIRED`, vier op `VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH` (gezichtsscore 0,90-0,92, drempel 0,940), drie op `SILENT_PUBLICATION_FAILURE` en vandaag staat de rij op PLANNED.

De dagwinnaar bestond van 1 t/m 7 november. Voor 8 november is er geen winnaar: de radar gaf op 7 november 20:02 UTC `NO_FRESH_PUBLIC_PROBLEM_SIGNAL`.

## Oorzaak

De bronschaarste van vandaag is een symptoom. Op de dagen mét winnaar werd de mediajob niet geclaimd en werd er geen nieuwe video gegenereerd. Daarnaast liet de bronselectie irrelevante bronnen toe (Texas-schoolartikel op 4 nov, google.com-redirect op 6 nov).

## Borging

- Learning: `brain/learning/2026-11-08-mira-fifteen-days-zero-reels-v1.json`.
- ONE BRAIN: fingerprint `powerhouse|mira|fifteen-days-zero-published-reels-producer-unclaimed|20261108-v1`, geschreven via `public.brain_observe_failure`.
- Gerelateerd bestaand incident: #5232 en `powerhouse|mira|no-new-unique-source-backed-daily-winner|20261108-v1`.

## Nog open (vergt beslissing of code)

1. Claimt de producer de mediajob dagelijks automatisch? Nu draait er geen vaste producer; alleen een geplande routine.
2. Bronkwaliteitsfilter op domein en taal.
3. Beslissing van Arthur: Instagram pauzeren of doorgaan.

Niet gedaan in deze wijziging: geen System Map-, ledger- of skillprojectiewijziging. Die horen bij een echte codefix.
