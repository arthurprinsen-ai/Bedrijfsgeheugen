# ONE BRAIN — gemengde bronhistorie mag harde providergrens niet omzeilen

15 november 2026. Bestaande P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Geverifieerde eerdere productieoplossing
Beschermde PR #5835 is al op main `ee7d13b347163eef345fee154cb7f56eb1fe14e7` gemerged en Netlify heeft de exacte SHA op 2026-11-15T10:00:27Z als READY gepubliceerd. Dat is de **enige** originele historische backfill-ontdubbeling: originele kandidaten blijven zichtbaar, er komt één stabiel hervattingssignaal per geregistreerde verplichting, niet per historische record. Het is geen bewijs van gerealiseerde provideracties of afgehandelde historische werkvoorraad. De overlappende PR #5837 wordt daarom niet als tweede fanoutimplementatie gemerged.

## Afzonderlijke fail-closed fout en minimaal herstel binnen hetzelfde PR
In de live originele `activeDispatches` werd `WAIT_EXTERNAL` op bronrij-niveau vóór de groepering overgeslagen. Als één bron bewezen externe autorisatie vereist maar een andere bron dezelfde `obligationId` heeft, kan die tweede bron nog steeds een nieuwe hervattingsopdracht aanmaken. Dit is een *codebewezen veiligheidslek*, niet onafhankelijk bewijs van een ongeoorloofde provideractie. De originele code verzamelt nu eerst alle geregistreerde `obligationId`-groepen met een `WAIT_EXTERNAL`-bron en verhindert een wakeup voor die hele groep. Geen mutatie van bestaande bronrecords, geen andere agent, geen nieuwe scheduler, queue, migratie, token of customer-send. Bronidentiteiten en oorspronkelijke statussen blijven auditbaar in `report.candidates`.

## Regressie / overdracht
Aan de bestaande `tests/brain-completion-supervisor-backfill.test.mjs` is een mixed-source regressie toegevoegd: één oorspronkelijke OPEN-bron en één bron met onafhankelijk bewezen ontbrekende providerautorisatie, in beide bronvolgordes. Er mag **nul** nieuwe backfill-dispatch ontstaan, terwijl beide bronidentiteiten in de oorspronkelijke historie blijven. De reeds bestaande Reliability/Data Quality-eigenaren en originele Powerhouse-continuity-skill zijn de enige uitvoeringsroute. Per-case terminale provider/consumer-ACK, Heartbeat-uitkomst en leren blijven vereist. De historische P0-achterstand wordt niet kunstmatig groen gemeld.

## Vrijgave
Exact-head protected Required+CodeQL inclusief historische, shadow en security-canary, beschermde main-merge en onafhankelijke Netlify READY op exact productie-SHA. Daarna pas oorspronkelijke natuurlijke backfill-run met bronmanifest en werkelijke provider-consumer readback. P0 #4198 blijft OPEN zolang die bewijsreeks ontbreekt.
