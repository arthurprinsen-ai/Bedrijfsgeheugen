# Eén canonieke Supervisor: geconsolideerde herstel- en leermetingen

## Waarom
PR #4793 is beschermd gemerged en is de canonieke Janitor-waarnemer; #4792 is gesloten zonder merge. Het historische werk van #4792 bevatte echte niet-geannoteerde \`PR#N SHA MAIN_DRIFT_RECOVERY\`-regels en een precieze ontbrekende-writer-lease waarschuwing. De primaire collector herkende die vormen eerder niet. Daardoor konden herhaalde drift en ontbrekende leases onderschat worden.

## Wat gewijzigd is
- Bestaande \`recovery-supervisor-telemetry.mjs\` herkent uitsluitend daadwerkelijk getimestampte runtime-annotaties en exact gevormde driftmarkers, geen echo van workflowbron.
- Leaserejecties krijgen een eigen categorie \`WRITER_LEASE_MISSING\`; herstelde PR's tellen niet automatisch als nieuwe drift.
- Onvolledige providerlogs zetten herhaalde drift op \`null\`, niet op nul.
- Het bestaande uurlijkse Janitor-artifact bevat voortaan een dagprojectie met echte supervisor-run-ID's, CI-duur en classificaties; geen tweede scheduler of polling.
- De al bestaande Janitor PR-snapshot geeft een *voorlopige* inventaris van botsende \`Change-Scope\`-claims. Dit is geen formeel lock: actuele GitHub-diffs, exacte writer lease, native CAS en branch protection blijven doorslaggevend.
- Onafhankelijke productie-evaluatie vereist ten minste 20 exact gekoppelde releases per cohort (Required/CodeQL op PR-head, beschermde merge en productie-provider op merge-SHA), externe regressiecontrole, rollback en geen kwaliteits- of doorlooptijdregressie. Dit verleent hoogstens schaduwevaluatie, nooit automatische promotie.

## Reeds werkende veiligheidsgrens
De Recovery Supervisor draait op één vijfminutencron buiten minuut nul, met één PR per cyclus en maximaal twee main-driftverversingen onder een exacte terminale writer-lease en GitHub \`expected_head_sha\`. De nieuwe code wijzigt die workflow niet. Na iedere nieuwe head zijn Required en CodeQL opnieuw vereist vóór een beschermde merge. De status van Netlify/portaalproductie wordt niet afgeleid uit groene GitHub-jobs.

## Open bewijs
De PR moet op zijn actuele head Required en CodeQL doorlopen en beschermd gemerged worden. Daarna moeten het actuele main-bestand, een werkelijke geplande Janitor-run met artifact en onafhankelijk gekoppelde productie-uitrollen worden geverifieerd. \`time_to_successful_production\` en onnodige CI-herhalingen blijven \`null\` waar provenance ontbreekt; er is geen geclaimde snelheidswinst.

## Dubbele source owners
#4795 en #4797 zijn tijdelijk Draft met gedocumenteerde ownership-hold omdat beide de al canonieke Janitor YAML claimen; #4795 claimt ook de inmiddels in #4791 gemergede Supervisor YAML. Unieke negatieve tests moeten later via één eigenaar worden gereconcilieerd, niet via concurrerende schrijvers.
