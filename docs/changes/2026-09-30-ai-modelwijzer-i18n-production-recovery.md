# AI Modelwijzer static-English production recovery — 30 september 2026

## Root cause
De exacte Netlify build stopte fail-closed omdat vier nieuwe Modelwijzer-teksten nog niet in de deterministische Engelse cache stonden.

## Fix
De vier ontbrekende vertalingen zijn toegevoegd aan de bestaande AI Modelwijzer v2 cache. De productiepromotie blijft geblokkeerd totdat build-parity, merge, Netlify exact-main en publieke readback groen zijn.

## Geen workaround
De cache-eis is niet versoepeld en netwerkvertaling is niet aangezet. De build blijft fail-closed.
