# Mira — geen hergebruik van afgekeurde OpenArt-video's

**25 oktober 2026 — bestaande eigenaar P0 #4439, herstelcontract `mira|immutable-rejected-history-preflight|20261025-v1`.**

## Productieoorzaak

De native-videoformatcontrole en preventieve agentfeedback zijn al via PR #4891 en #4894 beschermd gemerged en in Netlify/Supabase-productie onafhankelijk teruggelezen. Maar de vroegere router keek bij een vervangende MP4 alleen naar de laatst afgekeurde OpenArt-history. Daardoor kon een eerder afgekeurde video opnieuw worden aangeboden als tussendoor een andere history faalde. Voor `7lGMacfGJcGL3WGCF4XN` bestaan twee echte `brain_failure_occurrences`: beginframe en middenframe van 25 oktober; het middenframe scoorde 0,860 waar 0,940 vereist is. Niet gepubliceerd.

## Structurele correctie

De **bestaande** router gebruikt nu een read-only Brain-check op iedere OpenArt Reel history **voordat** originele MP4-bytes worden gedownload of een AI-provider/verifier wordt aangesproken. Iedere history met een eerdere `router:openart:<id>:instagram:` afkeuring blijft uitgesloten, ook op een nieuwe dag of bij een andere fout. Ontbrekende Brain-readback stopt het opnieuw proberen (503); een bekend afgekeurde history krijgt een expliciete 422 met de juiste herstelactie. De originele bronwinnaar, Mira-master, gezicht >= 0,940, beweging >= 0,900, Meta-publicatiebevoegdheden en exact-media-vereisten blijven gelijk.

Dit sluit de herhalingslus voor dezelfde afgekeurde bytes, niet alle mogelijke fouten van generatieve video. De agent mag pas een werkelijk andere history voorstellen binnen de al bestaande OpenArt-budgetlimiet en altijd via de originele router, zonder nieuwe scheduler of publisher. De huidige Reel mag niet ongemerkt worden vervangen door een afbeelding.

## Bewijscriteria

`tests/brain-mira-rejected-history-permanent-dedupe-20261025.test.mjs` bevat echte historische IDs, fail-closed providerproblemen, cross-day contract en verificatievolgorde. Require op exact PR-head, CodeQL, native Supabase-preview, beschermde merge en actieve Edge-router-readback. Pas na een andere echte video met onafhankelijke gezicht-, beweging- en Meta-readback kan Instagram live worden verklaard.
