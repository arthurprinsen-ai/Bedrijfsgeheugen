# BRAIN-regressie Mira mediacontrole: nieuwe attempts-kolom

5 november 2026 · Eigenaar: oorspronkelijke Powerhouse content-loop en BRAIN-backend

## Wat gebeurde er?
De oorspronkelijke beveiligde postmerge BRAIN-run [#41993721022](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41993721022) had één falende test. De uitvoering van Mira's bestaande directe, alleen-lezen databaseadapter selecteert sinds een eerder beveiligd herstel naast status, fout en mediabewijs ook het feitelijke veld `attempts`. De verouderde test verwachtte nog de oude veldlijst. De fout geeft geen bewijs dat een mediajob daadwerkelijk is mislukt.

## Wat is gecorrigeerd?
Uitsluitend de bestaande regressietest `tests/brain-content-loop-preventive-media-direct-adapter-20261103.test.mjs` verwacht nu `channel,status,attempts,last_error,asset_manifest,proof_manifest`. De test bewaakt ook de bestaande beperking tot `tenant_id=canonical`, de dag en het kanaal `instagram`. Het verbod op wijzigingen aan de mediaberichtentabel (`DB_READ_ONLY_TABLE_REJECTED`) en de beperkte tabelallowlist blijven intact. Er is **geen** Instagram-provideractie, nieuwe scheduler, tweede schrijver of Supabase-runtimecode gewijzigd.

## Borging en eerlijk resultaat
De oorspronkelijke ONE BRAIN-learning, dit begrijpelijke wijzigingsverslag en het append-only activiteitenledger horen bij dezelfde test-only PR. Nieuwe Required, CodeQL, volledige BRAIN, beschermde merge en postmerge providerbewijs zijn verplicht. Het betreft een aparte draft-kandidaat; de al gestarte Portal-release mag niet door een tussentijdse merge een andere bron-SHA krijgen. Daarom is geen productie- of publicatiesucces geclaimd.

- Originele BRAIN fout: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41993721022
- Canonieke eigenaar #4439: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439
- ONE BRAIN: `brain/learning/2026-11-05-mira-direct-media-attempts-oracle-v1.json`
