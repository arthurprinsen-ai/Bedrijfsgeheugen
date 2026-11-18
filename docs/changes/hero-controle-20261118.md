# Hero-controle: hoofdactie vrij van cookiebanner en pil, rustiger mobiel

Live gemeten (Playwright, 1440x900 en 390x844): tekst NL en EN correct, geen scrollfout, knop blauw #2742D6. Gevonden en gerepareerd:
- Desktop: de cookiebanner (links onder) lag over de hoofdknop (knop 724–776, banner vanaf 739). Hero-inhoud 56 px hoger: knop 578–631, banner vanaf 739.
- De zwevende "Neem je moment"-pil lag over de microtekst onder de knop en stond dubbel met de ademlink in de hero. De pil verschijnt nu pas na ruim een schermhoogte scrollen (alleen op pagina's mét ademlink in de hero).
- Mobiel: beeld 300 → 210 px en tekst 56 px omhoog: kop eerder in beeld, knop van 1030 naar 884 (nog onder de vouw: de lead is lang).
Cache-bust CSS `?v=20261118d`, JS `?v=20261118e`; systeemkaart opnieuw gegenereerd.
Niet bewezen: live-readback tot na merge; effect op klikgedrag (meten via bg_interacties).
