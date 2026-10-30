# 30 oktober 2026 — Native Content Growth false-red door verouderde blog-watchdogtest

**Oorspronkelijke eigenaar:** Powerhouse Content Growth / canonieke Supabase Powerhouse blogpublisher. **Bestaande beveiligingsincidentlijn:** #5072. **Nieuwe foutvingerafdruk:** `powerhouse|native-content-growth|stale-blog-watchdog-recovery-test-after-readonly|20261030-v1`.

## Gecontroleerde feiten en oorzaak
Na de beschermde social-CRO main-merge van PR #5186 trad in GitHub Actions `Native content growth contracts` run `41034792790`, job `123992869752`, een echte testfout op. `tests/content-growth-daily-blog-watchdog-recovery.test.mjs` verlangde nog het **oude** GitHub-watchdoggedrag: zoek oudere niet-live datums en gebruik een eigen bewijs-/PR-pad. Dat is tegenstrijdig met de 29-oktoberwijziging die de watchdog bewust alleen-lezen maakte en historische ledgerdagen van de huidige businessdatum scheidt.

De beveiligde originele `.github/workflows/daily-blog-live-watchdog.yml` heeft `permissions: contents: read`, werkt alleen met een **exacte datum**, schrijft bij ontbreken `NO_ACTION_LEGACY_LEDGER_DATE_MISSING`, en leest alleen een al bestaande ledgerregel via originele publieke HTML `live-readback.mjs`. Er is geen legitieme automatische herstelactie waarbij een oud privé- of publiek bewijsrecord naar GitHub wordt gepubliceerd. De oorspronkelijke Supabase Powerhouse-publisher blijft de enige zakelijke schrijf-/providerautoriteit.

## Herstel en structurele preventie
Vervang in de **bestaande** Content Growth-regressietest de obsolete aannames door positieve en negatieve invarianten: uitsluitend de exacte `Europe/Amsterdam`-datum; zonder record `NO_ACTION`; geen `Object.keys(days)`-fallback; originele provider-HTML-readback alleen voor een bestaande datum; geen Git-/PR-schrijfrechten of contentpublicatie. Houd `tests/brain-daily-blog-watchdog-no-public-private-proof.test.mjs` onveranderd als onafhankelijke veiligheidsgrens. Geen wijziging aan de productie-workflow, geen herstel van historische PR-materiaalstroom, geen tweede scheduler.

## Acceptatie
Protected admission/Required/BRAIN/CodeQL → exacte main-merge → de **bestaande** Native Content Growth-ci moet in een volgende echte push-run slagen. Los daarna echte blog-publicatieverplichtingen via de oorspronkelijke Supabase-publisher en onafhankelijke browser/providerreadback op; een geslaagde CI betekent niet dat de blog vandaag live staat of bezoekers/orders zijn binnengehaald. Als een ander historisch testcontract dezelfde obsolete schrijfrechten eist, behoud de fail-gate en laat die afzonderlijk door de oorspronkelijke beveiligingseigenaar beoordelen. Werk ONE BRAIN en deze menselijke procedure bij met exacte bewijsstatus, niet met denkbeeldig groen.
