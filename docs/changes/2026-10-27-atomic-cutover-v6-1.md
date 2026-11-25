# Atomic cutover V6.1 — growth learning-store

## Wat verandert
- `makeGrowthLearningEngine(store)` start alleen met een store die `get` en `insertIfAbsentWithCutoverFence` levert.
- Een uitkomst `VERIFIED_PAID` wordt alleen vastgelegd na `verifyPayment` bij de provider; een vlag in de uitkomst telt niet.
- Elk antwoord van de transactie moet scope, sleutel, legacy-sleutel, epoch en `transactionVerified: true` terugsturen, anders volgt `ATOMIC_CUTOVER_ACK_REQUIRED`.
- Bij een duplicaat is een onafhankelijke leesactie met inhoudsvergelijking verplicht.

## Wat niet verandert
- Geen migratie en geen nieuwe tabel. De module wordt in de repo nergens aangeroepen, dus er verandert niets in productie.

## Nog nodig vóór inschakeling
1. Adapter in de bestaande Brain-opslag als één transactie (autorisatie, epoch, legacy- en v2-sleutel).
2. Dezelfde epoch-regel op alle oude schrijfpaden.
3. Test met twee databasesessies, inclusief het intrekken van de epoch tijdens een lopende schrijfactie.
4. Betaalrecords alleen na verificatie bij Mollie.
