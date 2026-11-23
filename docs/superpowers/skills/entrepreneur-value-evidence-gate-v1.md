# Agent skill — Ondernemerswaarde met bewijs (v1)

Canonieke scope: bestaande Bedrijfsgeheugen website, Portal V2, ONE BRAIN/Powerhouse/Heartbeat. Geen parallelle schrijver of executor.

**Trigger:** wijziging aan homepage, productbelofte, ondernemerscockpit, scan, conversie of een AI-advies.

**Invoer:** de bestaande geauthenticeerde klantstatus en bron-ID's. Publieke en demostatus expliciet apart houden; geen niet-geautoriseerde tenantvelden kopiëren.

**Verplicht controlepad:**
1. Beschrijf de ondernemersvraag in gewone taal: omzet, winst, kosten, tijd, klanten of bedrijfsrisico.
2. Toon eerst de eerstvolgende uitvoerbare beslissing met eigenaar en bewijsstatus; toon AI/architectuur pas als ondersteunende uitleg.
3. Label consequent `DEMO`, `ZELFGERAPPORTEERD`, `VOORSTEL`, `VOORSPELLING`, `UITGEVOERD` en `BRONGEVERIFIEERD`. Ontbrekende gegevens zijn onbekend, nooit nul.
4. Schrijf een aanbeveling nooit als uitgevoerd; een afgeronde actie nooit als gerealiseerde waarde zonder onafhankelijke outcome-readback. Gebruik bestaande canonieke uitkomstbewijzen en vermijd dubbele telling.
5. Veranderingen in de klantomgeving mogen alleen via de oorspronkelijke autorisatie, domeinstaat, Brain ACK, logging en toegestane approvals. Deze UX-skill schrijft geen operationele staat.
6. Test NL/EN, responsief, keyboard, identiteitswissel, nuldata, vertraagde data, bewijsstatus en duplicate-build; behoud bestaande CMS-integratie.
7. Leg herhaalde fouten vast met signatuur, oorzaak, herstelcommit, tests, eigenaar en onafhankelijk productie-readback. Leidend is de oorspronkelijke ONE BRAIN-incident- en leerregistratie; deze skill is geen alternatief register.
8. Verifieer commerciële waarde met geldige acquisitie- en betaalbronnen en consistente perioden, niet met likes, klikken of voorbeeld-ROI alleen.

**Release:** featurebranch → PR → bestaande protected checks → merge → Netlify exact-SHA browser/readback → onafhankelijke commerciële meting. Nooit groen op alleen een geslaagde git-write.
