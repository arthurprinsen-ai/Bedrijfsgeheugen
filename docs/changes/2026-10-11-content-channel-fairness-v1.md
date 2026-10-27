# P0 #4198 — geblokkeerde contentgenerator ontkoppelen per kanaal

Datum: 11 oktober 2026. Beveiligde wijziging: PR #4316.

## Incident
De commerciële dagrun was DEGRADED. De generator bleef op één persoonlijke LinkedIn-tekst vastlopen. Er waren vanaf 07:04 UTC herhaalde Anthropic-400-antwoorden wegens te weinig credit. Om 08:04 en 08:09 UTC kwam een poging verder maar faalde de tekst op de Notion-redactiegrens van 130–200 woorden. Omdat de generator strikt het hoogste prioriteitsitem koos (één rij), werden bedrijfspagina en blog niet gegenereerd.

## Correctie
Op één bestaande uitvoerder houdt elke mislukte **generatie** een individuele cooldown: 20 minuten op tekstfouten, 2 uur op betalingsfouten. De niet-uitvoerbare kandidaat blijft beschikbaar voor latere retry; de volgende conforme kandidaat mag doorgaan. Geen verlaging van copy-, bron-, publicatie- of identiteitsgate en geen nieuwe scheduler of derde partij. Bestaande publicaties worden niet opnieuw verstuurd.

## Validatie
Node-regressies dekken doorstroming na persoonlijke tekstfout, uitdoven/hernemen cooldown, creditlimiet en niet-aanraken van publicaties. Beveiligde Required, CodeQL en Supabase-preview zijn verplicht vóór merge en productie-uitrol. Daarna één lease-beschermde live run met echte provider IDs, readback en leerregistratie. Opstellen van deze wijziging bewijst nog geen publicatie of omzet.

## Afhankelijkheden buiten deze PR
Anthropic-billing moet voldoende credit hebben, of een toegestane fallback moet kwalitatief leveren. Instagram vereist aantoonbaar de exacte Mira-media. SalesRobot heeft drie mislukte eerste DM-stappen bij niet-bevestigde eerstegraads connecties; zonder kwalificatie niet opnieuw zenden. Dagelijkse mail-newsletter heeft geen geautoriseerde executor. P0 blijft OPEN tot alle vereiste provider-bewijzen en commerciële uitkomsten aanwezig zijn.
