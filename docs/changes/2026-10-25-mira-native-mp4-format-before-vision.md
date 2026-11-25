# Mira — oorspronkelijke MP4-formaatcontrole vóór gezichtsverificatie

Parent: [P0 #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). De preventieve agentmodule uit [PR #4891](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4891) draait al in Supabase productie.

## Feitelijk probleem

OpenArt gaf een video met native dimensies **1292×1604** (history `K3NqiqlKMGWDM3UEJGu0`). De bestaande frame-extractor paste de videoframes via ffmpeg `scale+pad` aan naar JPEG **1080×1920**. Een latere gezichtscontrole kon daardoor een clip beoordelen die technisch geen native 1080×1920 Reel was. De gebruiker betaalde herhaaldelijk voor AI-controles en generaties die te laat werden afgewezen. Onafhankelijke gezichts- en bewegingsdrempels blijven **0,940** en **0,900**.

## Uitgevoerde codecorrectie (beschermde kandidaat)

- Helper `_instagram-native-reel-probe.mjs` interpreteert de werkelijke ffmpeg first-video-stream dimensies en weigert onduidelijke/afwijkende metadata.
- Bestaande `instagram-video-frames.mjs` onderzoekt de originele door OpenArt geleverde MP4 **vóór** eventuele `scale+pad` en voordat er een AI-visionaanroep plaatsvindt. De helper downloadt onder de bestaande token/URL/120MB-grens en gebruikt de reeds geïnstalleerde `ffmpeg-static`; geen externe provider, nieuw geheim of scheduler.
- Media-router negeert door de caller meegestuurde vervangende frames, vereist werkelijk geëxtraheerde start/midden/eind-frames uit die MP4 en valideert native 1080×1920. De eerste AI-framevergelijking is pas toegestaan ná een geslaagde oorspronkelijke streamprobe.
- Bij een gemeten afwijking schrijft dezelfde CAS-hulp de originele OpenArt history + echte dimensies als `MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH` naar het bestaande media-job/Brain, zonder een publicatie-ACK. De huidige preventieve producer-agent kan deze nieuwe foutklasse verwerken en moet een werkelijk native 9:16-video kiezen onder de bestaande budgetgrens.
- De originele bevroren winnaar, OpenArt-master, catalogus, afbeeldingsbeleid, minimaal bewijs en één Composio Instagram-publicatiewriter blijven gelijk.

## Acceptatie

Tests: `tests/brain-mira-native-format-before-vision-20261025.test.mjs`, historisch + shadow in Brain en het bestaande Required-workflow. Geen groene status van OpenArt-generatie alleen; echte frame-/temporalproof en vervolgens een echte Instagram-post-ID/permalink/readback blijven verplicht. Production readback en regressie zijn noodzakelijk om deze kandidaat live te verklaren.

Dit verhelpt het **native dimensieprobleem**, niet ieder mogelijk probleem bij generatieve video. Zelfs een 1080×1920-video kan zwarte balken **in** de pixels bevatten; dat vereist separate kwaliteitscontrole van het daadwerkelijke frame. Er wordt geen garantie op een altijd passerende gegenereerde video afgegeven.
