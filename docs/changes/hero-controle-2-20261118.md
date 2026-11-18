# Hero-controle 2: kop vrij van de header, secundaire regels leesbaar

Live meting na `hero-controle-20261118`: een te brede reparatie (padding-top 0) schoof de kop onder de header. Teruggezet: alleen `margin-top:-64px` op de hero-tekst (desktop). Daarnaast gevonden: de regel "Download gratis het werkboek" en de tekst onder de knop waren wit op papier (onleesbaar); nu inkt en zacht grijs, link onderstreept. Onderpadding in de hero zodat de logo-strook niet over de tekst valt (desktop).
Gemeten tegen live met ingevoegde CSS: kicker zichtbaar onder de header, knop 660–713 (banner vanaf 739), werkboek-link leesbaar, geen overlap. Cache-bust CSS `?v=20261118f`.
Niet bewezen: live-readback tot na merge; mobiel is in dit werk niet verder aangepast; klikeffect.
