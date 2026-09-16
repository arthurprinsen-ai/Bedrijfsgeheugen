# Powerhouse Parallel Engineering Fabric v1

Fingerprint: `powerhouse-parallel-engineering-fabric-v1`

## Waarom
Powerhouse had al onafhankelijke delivery lanes, exact-candidate identity en protected production promotion, maar parallel werk kon nog onnodig vertragen door brede retests, stale branches en reconciliation na beweging van `main`. De fabric maakt de bestaande regels uitvoerbaar als één deterministische planner.

## Wat nu canoniek is
`config/powerhouse-parallel-engineering-fabric.json` is de policylaag. `scripts/brain/parallel-engineering-fabric.mjs` is de pure planner. Ze vervangen niets: `config/brain-delivery-system.json` blijft delivery authority, `config/powerhouse-engineering-os.json` blijft Engineering OS en BG169 blijft productieautoriteit.

Een work package bevat minimaal een unieke id, changed paths, exact base SHA en exact candidate SHA. Optioneel bevat het dependencies. De planner resolveert lanes, conflict contracts, testprofielen en cache identity uit bestaande policy.

## Parallel bouwen
Pakketten mogen in dezelfde wave als er geen changed-path overlap, conflict-contract overlap of dependency-edge bestaat. De planner sorteert lexicaal op id, zodat dezelfde input steeds hetzelfde plan oplevert. Missing dependencies, cycles en ontbrekende candidate identities blokkeren fail-closed.

## Slimmer testen
De affected-test selector gebruikt de bestaande lane- en conflict-contractcatalogus. Bekende niet-uitvoerbare documentatie krijgt alleen de docs-contracttest. Backend, portal, website en automation krijgen hun eigen profielen. Delivery-control-plane wijzigingen krijgen engineering/delivery/security tests. Onbekende materiële scope valt terug op `required` en wordt fail-closed gemarkeerd.

Dit is een versnelling van feedback, geen verzwakking van release gates. Required CI, security, preview, protected merge en productie-readback blijven verplicht.

## Cache
De cache identity is SHA-256 over base SHA, candidate SHA, gesorteerde changed paths, affected contracts, geselecteerde tests en policyversie. Alleen exact gelijke input mag een eerder resultaat hergebruiken. Cache mag nooit productie-readback overslaan.

## Speculative integration
De planner kan conflictvrije combinaties uit dezelfde ready wave vooraf aanwijzen. Dat is alleen planningsinformatie: speculative combinations hebben geen promote-recht en moeten nog steeds door protected CI en BG169.

## Flow
`shared context -> work packages -> dependency/conflict resolution -> parallel waves -> affected tests -> speculative integration -> protected Required/BRAIN/security gates -> protected merge -> BG169 production -> exact production readback -> learning/writeback`.

## Operationele regel voor chats en agents
Gebruik bestaande BRAIN-DELIVERY-v2 lanes en deze fabric voor parallelisering. Maak geen eigen scheduler, queue, work registry, test brain of parallel delivery authority. Als een package conflicteert, serializeer alleen de betrokken packages; onafhankelijke packages blijven doorlopen.

## Evidence contract
De executable regressie staat in `tests/brain-parallel-engineering-fabric.test.mjs` en is rechtstreeks in `.github/workflows/required-test.yml` opgenomen. De protected delivery lineage voor de eerste activatie is PR #1803. Alleen de uiteindelijk gemergde `main` SHA plus post-merge productie/readback geldt als live evidence.
