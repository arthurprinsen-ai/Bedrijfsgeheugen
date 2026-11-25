# Powerhouse: geen beslissingen op basis van verouderd CI-bewijs

**Canonieke eigenaar:** [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). De bestaande Janitor is de enige waarnemingsbron. Geen extra scheduler, provider API-request, issue of writer.

## Reproduceerbare tekortkoming
`routeObservedCiHotspots` controleerde uitvoerstatus, 20 werkelijk uitgevoerde jobs uit 5 onafhankelijke workflowpogingen, SHA/ID en fouten, maar niet de leeftijd van `observed_at`. Een oud gekopieerd Janitor-artefact kon nog steeds als `EVIDENCE_BACKED_INVESTIGATION_ONLY` worden gepresenteerd. Dat is een broncode-invariant-risico, **geen bewezen incident bij klanten**. De eerdere echte run #39926363163 noteerde 353 seconden voor zijn langzaamste job; één observatie bewijst geen persistente oorzaak.

## Aanpassing
Dezelfde read-only advisor eist nu een ondubbelzinnige `YYYY-MM-DDTHH:mm:ss.sssZ`-tijd en maximaal twee uur ouderdom (uurlijkse bestaande Janitor plus één herstelvenster). Onbekende, ongeldige en toekomstgedateerde snapshots worden `WITHHELD_STALE_OR_UNDATED_OBSERVATION`. Geen gesuggereerde lane, actie, dispatch of promotie. Dit wijzigt geen CI-setup, Required, CodeQL, RLS, veiligheidscontrole, provider-preview of productierelease.

Herhaaltests controleren exact twee uur versus ouder dan twee uur, onvolledige ISO-tijden, offsets, toekomsttijd, ontbrekende tijd en ongeldige klokwaarden. De bestaande collector geeft `observed_at` automatisch mee; deze wijziging raakt uitsluitend de bestaande pure advisor en zijn canonical replay.

## Verificatie en beperkingen
`node --test tests/brain-ci-agent-prioritization-v1.test.mjs`, verplichte Required, CodeQL en beschermde merge. Daarna de echte bron op main en de eerstvolgende bestaande Janitor-run met tijdig advies of expliciete withholding controleren. De agents blijven uitsluitend adviserend; verbetering van gemeten CI-doorlooptijd en klantresultaat vereist herhaalde productie-/providerreadback. Het bredere incident #4661 en providerincident #4655 blijven onafhankelijk open.
