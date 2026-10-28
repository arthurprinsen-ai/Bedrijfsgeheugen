# Wijzigingen: oud versus nieuw in het Control Center (2026-10-28)

## Probleem
- Het portaal liet niet zien wat agents hebben verbeterd, wanneer, en wat het verschil was. Het klantscherm toont alleen activiteit en bewijsstatus, zonder oude en nieuwe waarde.

## Wijziging
- Alleen-lezen databasefunctie `public.bg_experiment_wijzigingen_overzicht` (service_role) die gestarte experimenten met pagina als tabelrijen teruggeeft.
- `powerhouse-observability` (beheerders-API) levert die rijen mee, pas ná de beheerderscontrole.
- Nieuw tabblad "Wijzigingen: oud vs nieuw" in het Powerhouse Control Center: Gebied · Wijziging · Toegepast op · Oude waarde (doorgestreept) · Nieuwe waarde · Verschil · Zekerheid.
- Zekerheid is bewust streng: "Te vroeg om te zeggen" onder de minimale steekproef, "Bewezen" alleen bij COMPLETE en p<0,10.

## Bewust niet gedaan
- Niet in het klantscherm: dat bevat geen interne ontwikkeladministratie.
- Geen schrijfacties en geen nieuw register.

## Open
- De migratie is niet op productie toegepast; tot dan toont het tabblad "bron niet beschikbaar".
- Het register heeft nu 0 rijen met pagina. Het tabblad is daardoor leeg tot een agent een uitgevoerde wijziging registreert (beleid uit #5023).
- Aparte SEO-meting (28 dagen voor/na via `bg_zoekprestaties`) is nog niet in deze tabel opgenomen.
