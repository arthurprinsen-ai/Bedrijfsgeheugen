# Bedrijfsprofiel uit de eigen website (bg-bedrijfsprofiel)

De dagelijkse verrijking van de connecties telt alleen interne tabellen; er gebeurt geen externe opzoeking. De enige externe bron, bg-bedrijfsnieuws, controleert 15 tot 20 van 17.035 bedrijven per dag en vond sinds 15 oktober 0 treffers per dag. Kleine mkb-bedrijven staan zelden in het nieuws.

Deze wijziging voegt een profiel per bedrijf toe, gehaald uit de eigen website van het bedrijf: samenvatting, sector, diensten, genoemde systemen, of er vacatures worden genoemd, en een algemeen bedrijfsadres of -nummer zoals de site dat zelf publiceert, met bron-URL per profiel.

## Wat er verandert

- Migratie: tabel `bg_bedrijfsprofiel` (service-only, RLS aan, geen beleid voor anon of authenticated) en functie `bg_bedrijven_voor_profiel` (warme bedrijven eerst, maximaal 40 per aanroep).
- Edge function `bg-bedrijfsprofiel`: governance-poort, zoeken van de eigen website, lezen van de homepage en over-ons-pagina, gestructureerde extractie, validatie, opslaan.
- Test `tests/brain-bedrijfsprofiel-20261028.test.mjs`.

## Grenzen

- Alleen zakelijke gegevens. Een e-mailadres wordt alleen bewaard als het een algemene mailbox is (info@, contact@ en vergelijkbaar), op het eigen domein van het bedrijf staat en letterlijk op de pagina voorkomt.
- Eenmanszaken en zzp worden niet verder verwerkt. Paginatekst wordt behandeld als onbetrouwbare invoer.
- Tijdbudget van 120 seconden per run; een run zonder enig profiel bij 8 of meer controles wordt als rood gemeld (ZERO_YIELD).
- Geen cron in deze wijziging. Eerst een handmatige run, nalezen, dan inplannen.

## Validatie

`node --test tests/brain-bedrijfsprofiel-20261028.test.mjs`. De kwaliteit van de extractie is pas bewezen na de eerste run op echte bedrijven.

## Wat dit niet doet

Geen privegegevens van personen, geen automatisch verzenden, geen wijziging in de outreach-keten. Het profiel is invoer voor de bestaande dagselectie en kwaliteitspoort.
