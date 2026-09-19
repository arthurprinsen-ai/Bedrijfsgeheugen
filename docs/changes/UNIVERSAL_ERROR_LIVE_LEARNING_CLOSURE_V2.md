# Universal error + live learning closure v2

Fingerprint: `powerhouse|error-live|semantic-learning-closure|required|v2`.

## Doel

Iedere materiële fout, recovery en live-delivery moet Powerhouse aantoonbaar slimmer maken. Alleen een bestand aanmaken is niet genoeg: de learning moet bruikbare oorzaak-, preventie- en bewijsinformatie bevatten en automatisch naar relevante skills worden geprojecteerd.

## Vóór merge

Required faalt gesloten tenzij dezelfde candidate-lineage bevat:

- canonieke Brain learning;
- append-only activity/development ledger;
- leesbare documentatie;
- semantische root cause;
- prevention/regression;
- test- of evidenceverwijzing;
- failure class en canonicalization replay.

Bekende error-fingerprints worden eerst hergebruikt. Een herhaalde fout zonder sterkere preventie is zelf een learning failure.

## Na live

Een merge of deploy is niet terminal. `LIVE_BEWEZEN` vereist daarna nog:

- production/provider readback;
- outcome evidence;
- duurzame learning;
- groene automatische skill projection wanneer learning/skills veranderden;
- terminal proof bundle;
- released writer lease.

## Machine enforcement

De contracten worden afgedwongen door:

- `scripts/brain/material-writeback-closure-guard.mjs`;
- `.github/workflows/required-test.yml`;
- `.github/workflows/powerhouse-skill-projection.yml`;
- `.github/workflows/obligation-terminal-closure.yml`;
- `tests/brain-material-writeback-closure-guard.test.mjs`.

Waar preventie technisch afdwingbaar is, gaat code/test/constraint/CI/runtime-policy vóór alleen tekst.

## Cross-obligation contamination prevention

Een branchnaam of PR-nummer is geen voldoende lineage-bewijs. Als een andere obligation bestanden aan dezelfde branch toevoegt, moet delivery fail-closed herstellen vanaf de exacte actuele `main`-tree en uitsluitend de expliciet toegestane paden van de huidige obligation opnieuw aanbrengen. Onverwachte extra paden mogen nooit stilzwijgend meeliften naar merge.

## Terminal writer ownership

De laatste reconcile/landing mag niet alleen op branchnaam vertrouwen. Activeer vóór terminale landing een `TERMINAL_DELIVERY` writer lease die obligation, PR-scope, exact head en main-epoch bindt. Andere writers moeten `DEFER` uitvoeren tot terminal closure de lease vrijgeeft.

## Safety-oracle synchronisatie

Regressietests mogen een strengere actuele safety-baseline niet terugtrekken naar een ouder contract. `public-visibility` blijft verplicht voor fast-fix, normal-risk en high-risk previewflows; alleen brede header/menu/browser-sweeps blijven high-risk gescopeerd.

## Stale regression-oracles

Als een canoniek veiligheidscontract strenger wordt, moet de bijbehorende regression-oracle in dezelfde lineage mee veranderen. Een test die nog een permissiever oud contract verwacht is een false-negative delivery defect. Herstel altijd de test naar het strengere actuele contract; verzwak nooit de runtime-gate om de test groen te krijgen.
