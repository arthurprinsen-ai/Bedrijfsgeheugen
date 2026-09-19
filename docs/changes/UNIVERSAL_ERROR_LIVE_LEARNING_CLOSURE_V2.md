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

Regressietests mogen de actuele safety-baseline niet zelf uitvinden. Lees vóór een oracle-wijziging altijd de exacte kandidaatversie van de canonieke runtime/config-bron en workflow. Voor de huidige website-lane geldt: `public-visibility` is verplicht voor fast-fix en high-risk; normal-risk gebruikt bewust begrensde targeted checks zonder sitewide `public-visibility` sweep.

## Stale regression-oracles

Als een canoniek veiligheidscontract verandert, moet de bijbehorende regression-oracle in dezelfde lineage mee veranderen. Maar een falende test is op zichzelf geen bewijs dat het runtimecontract gewijzigd is. De bronvolgorde is: exact-head canonieke config/runtime/workflow → afgeleide oracle → CI-resultaat. Bij verschil wordt eerst de bronwaarheid vastgesteld; pas daarna wordt de test of runtime aangepast. Verzwak nooit een runtime-gate uitsluitend om CI groen te krijgen.

## Config ↔ runtime ↔ oracle convergence

Een veiligheidsregel is pas consistent als workflow/runtime, declaratieve configuratie en regression-oracle dezelfde strengste waarheid uitdrukken. Als de runtime strenger is geworden, moeten config en tests in dezelfde lineage worden bijgewerkt. De runtime-gate wordt nooit verzwakt om een oude test of configuratie passend te maken.

## Isolated terminal successor

Als een gedeelde branch ondanks een actieve terminal writer lease blijft muteren, wordt niet eindeloos opnieuw gerebind. Powerhouse maakt dan precies één geïsoleerde recovery successor voor dezelfde obligation vanaf actuele `main`, neemt uitsluitend de goedgekeurde delta mee, zet `Supersedes` naar de vervuilde voorganger en sluit die voorganger. Daarmee wordt head-thrash technisch beëindigd zonder learning of werk te verliezen.
