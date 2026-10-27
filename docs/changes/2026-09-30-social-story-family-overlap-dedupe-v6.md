# Social story-family overlap duplicate prevention v6 — 30 september 2026

Fingerprint: `powerhouse-story-family-overlap-dedupe-v6`

## Incident

Persoonlijk LinkedIn publiceerde opnieuw hetzelfde menselijke verhaal: auto, defecte elektrische schuifdeur, airco met warme lucht, handmatig openen/ramen open en wennen aan die nieuwe routine. De publicatie van 30 september was anders geformuleerd dan die van 24 september, maar inhoudelijk hetzelfde verhaal.

## Root cause

De bestaande gates combineerden raw/normalized hash, story fingerprint, shingle-overlap en keyword-Jaccard. De twee posts deelden 16 betekenisvolle woorden, maar doordat de tweede tekst veel langer was bleef de Jaccard-overlap rond 0,165 en ontsnapte de herschrijving.

## Fix

De canonieke database-reservering is uitgebreid met een overlap-coëfficiënt naast Jaccard. Een kandidaat wordt nu `STORY_FAMILY_DUPLICATE` wanneer minstens 10 betekenisvolle keywords overlappen en minimaal 30% van de kleinere story family wordt hergebruikt.

Daarnaast blokkeert `powerhouse_publication_story_family_guard_v2` dezelfde familie op databaseniveau bij inserts in de uniqueness-history. Daarmee kan een chat, agent, scheduler of alternatieve connector de gate niet omzeilen.

## Regression evidence

Een nieuwe herschrijving van hetzelfde auto/schuifdeur/airco-verhaal is tegen production Supabase getest en gaf:

- `allowed=false`
- `reason=STORY_FAMILY_DUPLICATE`
- 18 gedeelde betekenisvolle keywords in de synthetische regressie
- overlap coefficient 0,6429

De werkelijk ontsnapte posts hadden 16 gedeelde betekenisvolle woorden en ongeveer 37% overlap ten opzichte van de kleinere story.

## Canonical writeback

Bijgewerkt in dezelfde lineage:
- LinkedIn publisher skill;
- personal LinkedIn skill;
- `AGENTS.md` inheritance voor alle chats/agents;
- chat/agent intrinsic-loop documentatie;
- Brain learning;
- development ledger event;
- System Map;
- required social duplicate governance regression;
- source-controlled Supabase migration.

Een duplicate mag voortaan alleen leiden tot nieuwe bron-/onderwerpselectie, nooit tot herschrijven van hetzelfde verhaal.
