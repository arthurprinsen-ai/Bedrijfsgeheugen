# Eén organisme: aantoonbaar resultaat vóór autonome verbetering

**Eigenaar:** canonieke commerciële closed loop [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), gekoppeld aan de ondernemersreis [#4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585). Geen nieuwe scheduler, klantdatabase, publicatieservice, Brain-register of agent.

## Reproduceerbaar probleem
De bestaande `prioritizeByBusinessValue` in `scripts/brain/continuous-improvement/autonomous-runtime.mjs` kon een kandidaat met een numerieke `realized_value`, `confidence` en `observed_at` prioriteren zonder door een klanttenant, bron of provider bevestigde uitkomst. Een voorgestelde omzet of kunstmatig miljoen kon zo boven een echte maar kleinere uitkomst verschijnen. Dit betekent **niet** dat die hypothetische fout ooit werkelijk klantomzet heeft gegenereerd.

## Bestaande runtime, strengere contracten
`assessVerifiedGrowthLoop` gebruikt alleen bestaande, tenantgebonden Brain-/uitkomstbewijzen. `value_known=true` vereist dezelfde tenant, doel-ID, beslissing, bewezen uitgevoerde actie, unieke uitkomst-ID, geverifieerde bronstatus met geldige referentie, en een waarnemingsdatum die niet in de toekomst ligt. Voor blog, social of outbound moet een bestaande, daadwerkelijk door de provider bevestigde publicatie-/afleveringsreceipt worden gekoppeld. Duplicaten van hetzelfde tenant-uitkomst-ID tellen slechts eenmaal.

Een uitkomst kan **geverifieerd zijn zonder dat het systeem al iets aantoonbaar heeft geleerd**. `CLOSED_LOOP_VERIFIED` vereist daarnaast leerbewijs en de ID van de volgende beslissing. De validator neemt nooit causaliteit aan; de read-only Brain-projectie kan geen bericht posten, toestemming verlenen, extern model activeren of productiegegevens wijzigen.

## Gaten blijven zichtbaar
Een afwezige bron, niet-relevante tenant, verouderd bewijs, ontbrekend provider-ID of een ongedocumenteerde volgende beslissing wordt `UNVERIFIED` of `OUTCOME_VERIFIED_LEARNING_PENDING`. De echte Powerhouse-productietoestand was bij observatie nog AMBER, met achterstallige persoons-/bedrijfsvoorspellingen en niet-bewezen commerciële rendementen. Het bestaande publicatiepad [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439) blijft de enige eigenaar van daadwerkelijke Instagram/LinkedIn/blog-uitvoering.

## Release-evidence
Regressies in `tests/brain-autonomous-improvement-runtime.test.mjs` omvatten positieve blog-loop en negatieve numerieke schatting, verkeerde tenant, stale bron, ontbrekend providerbewijs, toekomstige datum, onuitgevoerde actie, ontbrekende leerstap en dubbel resultaat. Daarna blijven exact-head Required, CodeQL, protected merge en code-readback verplicht. Geen claims van werkelijk extra omzet totdat actuele provider- en tenant-evidence dat bewijzen.
