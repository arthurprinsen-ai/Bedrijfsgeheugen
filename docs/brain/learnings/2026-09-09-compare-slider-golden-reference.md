# Compare slider — golden reference lesson

Status: canonical learning
Datum: 2026-09-09
Scope: alle before/after- en vergelijk-sliders op Bedrijfsgeheugen

## Wat fout ging

Een reeks sliderreparaties leek in CI en browserchecks correct, maar bleef op een echte iPhone rond ongeveer 60% stoppen. De fout werd te lang gezocht in caching, WebKit-rangegedrag en alternatieve gesture-lagen, terwijl op dezelfde iPhone en dezelfde site al een andere slider volledig van links naar rechts werkte.

De beslissende observatie was dus niet een synthetische test, maar een werkende component in dezelfde productieomgeving.

Daarnaast bleek in de V18-vergelijker een expliciete functionele begrenzing aanwezig te zijn: `minPanePx`/`minPct` beperkte de scheidslijn om beide tekstpanelen leesbaar te houden. Daardoor kon de greep fysiek nooit 0% of 100% bereiken. Dit was exact het zichtbare symptoom.

## Canonieke regel

**Gebruik bij een defecte interactie eerst een bewezen werkende component op dezelfde site, browser en device als golden reference. Kopieer of hergebruik het bewezen interactiemechanisme voordat nieuwe gesture-architectuur wordt bedacht.**

Voor compare sliders geldt aanvullend:

1. De fysieke linkerrand van de component is exact 0%.
2. De fysieke rechterrand van de component is exact 100%.
3. Geen verborgen functionele clamps zoals 6–94, 35–65, 40–60 of dynamische `minPanePx`/`minPct`-grenzen.
4. Tekstleesbaarheid mag nooit worden opgelost door het bereik van de slider te beperken. Houd tekstlayout vast en laat alleen masker/clip/scheidingslijn bewegen.
5. `Home` moet exact 0 zetten; `End` exact 100.
6. `aria-valuemin="0"` en `aria-valuemax="100"` zijn verplicht.
7. Programmeerbare 0/100-settests zijn onvoldoende bewijs voor touchgedrag. Waar relevant moet de browsertest fysieke pointer/touch-coördinaten op de linker- en rechterrand simuleren.
8. Een werkende productiecomponent op hetzelfde device heeft hogere diagnostische waarde dan een hypothese over browser-, cache- of WebKit-beperkingen.
9. Bij een user-reported physical-device failure geldt het device als autoritatieve empirische observatie; CI mag die observatie niet wegredeneren.
10. Site-wide sliderwijzigingen moeten worden geïnventariseerd zodat er geen concurrerende interaction owners of afwijkende clamps achterblijven.

## Bewezen correctie

PR #1316 verwijderde de dynamische `minPanePx`/`minPct`-begrenzing uit de V18-vergelijker en maakte de range exact 0–100. De tekstlaag gebruikt voortaan vaste layout; alleen het masker beweegt. Required, canonical contract en full build waren groen vóór merge.

Productiemerge: `37257c74a645d87563d766865f2114a14f747748`.

## Release-gate voor toekomstige sliderwijzigingen

Een sliderrelease is pas correct als:

- geen bereikbeperkende clamp in de interaction code zit;
- 0 en 100 via pointer/touch-coördinaten aan de fysieke randen aantoonbaar bereikbaar zijn;
- keyboard Home/End 0/100 oplevert;
- visual divider en clip exact dezelfde genormaliseerde waarde volgen;
- de site-wide inventory geen tweede afwijkende slider-engine of legacy clamp vindt;
- Required en relevante browsercontracten groen zijn;
- productie exact de bedoelde merge-SHA of een aantoonbare descendant serveert;
- bij een eerder device-specifiek incident de gebruiker de echte device-interactie opnieuw heeft gevalideerd voordat het incident als fysiek opgelost wordt beschouwd.

## Anti-patterns

Niet opnieuw doen:

- een probleem blijven oplossen binnen dezelfde foutieve architectuur zonder eerst een werkende control-component te vergelijken;
- een visuele leesbaarheidswens implementeren door het interactieve bereik te verkleinen;
- een synthetische `range.value = 0/100` test verwarren met fysieke touch-eindpuntvalidatie;
- caching als hoofdoorzaak aannemen zonder bewijs als een andere component op hetzelfde device wel correct werkt;
- meerdere onafhankelijke slider owners tegelijk laten bestaan.
