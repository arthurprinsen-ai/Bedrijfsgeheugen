# Successor PR coverage integrity — production learning

Datum: 2026-09-18  
Type: INCIDENT / ROOT_CAUSE / PREVENTION / PRODUCTION_PROOF  
Fingerprint: `delivery|successor-pr|coverage-integrity|v1`

## Aanleiding

Tijdens de audit van gesloten en superseded PR-lineages bleek dat PR #2129 functioneel was opgevolgd door PR #2148, maar één CI-registratieregel uit de voorganger niet was meegenomen: `tests/supabase-instagram-media-job-materializer-v1.test.mjs` bestond nog op `main`, maar stond niet meer in de canonieke backend release-lane.

Alleen kijken naar merged/closed status, branch ancestry of een expliciete `Supersedes`-verwijzing was daardoor onvoldoende.

## Root cause

De successor-validatie controleerde de hoofdimplementatie, maar niet systematisch alle predecessor-only deltas in:
- executable tests;
- workflowregistraties;
- classifierdekking;
- governance/metadata;
- documentatie- en skillcontracten.

Squash merges maken commit-ancestry bovendien ongeschikt als volledigheidsbewijs.

## Structurele preventie

- een successor moet predecessor-versus-successor delta-audit doorstaan;
- iedere executable regression test moet aantoonbaar aan een canonieke workflow/classifier gekoppeld blijven;
- `Supersedes` is pas terminal bewijs wanneer functionele én coverage-integrity bewezen zijn;
- branch cleanup mag pas na main/successor containment plus coverage-proof;
- predecessor-only vereiste delta betekent `RECOVERABLE_INCOMPLETE`, niet done;
- squash-divergence wordt nooit als inhoudelijk bewijs gebruikt.

## Productiebewijs

Recovery PR #2158 herstelde de ontbrekende backend-registratie.

- candidate head: `9b3f9a5954f633a438da9d5b762fbbc96594dcee`
- protected merge: `7d0442b517c80c51f69ebcaba6328d731a309459`
- Netlify deploy: `6aad37dc16d92f0009b35922`
- production commit_ref: `7d0442b517c80c51f69ebcaba6328d731a309459`
- production-readback run: `35348507561`
- production-readback: success

## Skill-projectie

De preventieregel is gekoppeld aan delivery/self-optimization en continuity. De learning blijft de canonieke bron; de skills bevatten de uitvoeringsregel zodat volgende chats/agents de fout vóór merge of branch cleanup voorkomen.
