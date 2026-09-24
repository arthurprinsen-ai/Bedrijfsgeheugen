# Mobiele lifecycle-tabs direct aanklikbaar — 24 september 2026

## Probleem
De production-browsercheck op 390×844 vond de knop **Verlies & herstel**, maar een echte click time-outte. De lifecycle-keuzes stonden in één horizontaal scrollbare rij; latere fases lagen buiten het initiële mobiele viewport.

## Fix
Onder 760px wrappen de lifecycle-tabs voortaan over meerdere regels en is horizontale overflow niet langer nodig. Alle fases blijven direct zichtbaar en aanklikbaar.

## Bewijsregel
De productiecheck blijft een echte browserclick uitvoeren. DOM-aanwezigheid, JS-ready markers of kunstmatige `dispatchEvent` gelden niet als vervanging voor functioneel bewijs.
