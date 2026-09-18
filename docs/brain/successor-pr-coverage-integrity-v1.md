# Successor PR coverage integrity v1

Fingerprint: `delivery|successor-pr|coverage-integrity|v1`

## Contract

Een opvolgende PR mag een voorganger alleen volledig superseden wanneer de opvolger aantoonbaar alle vereiste functionele én delivery-dekking behoudt.

Verplicht bij predecessor → successor:
1. vergelijk changed-file sets;
2. identificeer predecessor-only deltas;
3. classificeer iedere delta als functioneel, test, workflow, classifier, security, governance, docs of skill;
4. bewijs dat iedere vereiste delta in successor of actuele `main` aanwezig is;
5. controleer expliciet dat iedere executable regression test een canonieke workflow/classifier-route heeft;
6. sluit of verwijder de oude lineage pas nadat deze proof groen is.

Branch ancestry is geen substituut voor deze controle, met name niet bij squash merges.

## Reference incident

PR #2129 → #2148 verloor alleen de backend workflowregistratie van `tests/supabase-instagram-media-job-materializer-v1.test.mjs`. PR #2158 herstelde deze delta en werd beschermd gemerged naar `7d0442b517c80c51f69ebcaba6328d731a309459`. Exacte productie-readback op die SHA eindigde succesvol.

## Terminal rule

Een aangetroffen predecessor-only vereiste delta houdt de obligation in `RECOVERABLE_INCOMPLETE` totdat de huidige canonieke lineage de ontbrekende dekking heeft hersteld en exact-head productie/readback groen is.
