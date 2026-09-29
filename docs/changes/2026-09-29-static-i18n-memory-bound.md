# Static i18n production memory fix — 29 september 2026

## Aanleiding
De productiebuild van de Bedrijfslek growth-loop werd door Netlify afgebroken tijdens de statische NL/EN-opbouw. De localization-builder hield meer dan honderd complete parse5 DOM-bomen tegelijk in geheugen.

## Oplossing
De discovery-pass bewaart voortaan alleen unieke vertaalstrings. Een DOM-boom wordt na het uitlezen niet meer vastgehouden. De output-pass blijft route voor route werken.

Daarnaast is de Engelse productiecache aangevuld met de nieuwe Bedrijfslek teamchallenge-, Mini- en kennisborgingsteksten.

## Verificatie
De volledige production-parity build draait met Node 22.12 en dezelfde productieflags als Netlify naar exit 0:
- 111 publieke routes;
- 8.411 unieke vertaalstrings;
- 111 volledig vertaalde Engelse routes;
- 0 ontbrekende vertaalreferenties;
- geldige release-evidence.
