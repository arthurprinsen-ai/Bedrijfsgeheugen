# 2026-09-30 — Publieke taalkeuze blijft actief bij navigatie

## Aanleiding
De taalwissel werkte op de huidige pagina, maar gewone menu- en paginalinks konden daarna terugvallen naar Nederlandse routes.

## Oplossing
De publieke i18n-runtime behandelt locale nu als sitebrede navigatiestatus: English blijft onder `/en/*`, Nederlands gebruikt de onprefixte canonieke route, query/hash blijven behouden en dynamisch ingevoegde navigatie wordt eveneens genormaliseerd.

## Borging
De regel is vastgelegd in AGENTS, continuity skill, NL/EN delivery skill, System Map governance, canonieke System Map, Brain learning, chat checkpoint en development ledger.

## Terminal bewijs
Productie moet cross-page taalpersistentie bewijzen: taal kiezen → andere publieke pagina openen → taal blijft gelijk → terugschakelen → opnieuw navigeren.
