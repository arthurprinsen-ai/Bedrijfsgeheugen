# 2026-11-10 — afzonderlijke al toegepaste provider-versie als lockregistratie

**Oorzaak:** Parallel lopende originele agents hebben achtereenvolgens PR #5554 (migratie 819) en de commerciële originele research-composer PR #5543 (migratie 820) gemerged. Native GitOps heeft beide werkelijk toegepast, maar de enige bronlock op GitHub main bleef op 819. De volgende source-only handoff-reparatie PR #5556 mag en moet dit afkeuren.

**Onafhankelijke readback:** original Supabase `adhjwmvyoixzjtmiroln`: 820 migraties; 819 onveranderde eerste `version/name`-paren gelijk aan GitHub; de uitsluitend ontbrekende 820e provideridentiteit is `20261110120000_powerhouse_outreach_research_wait_handoff_v1`. De SQL-source staat al in main met blob `0ffd88fd27f7943633f75efd226e7cc0429f9f37`.

**Correctie:** alleen source lock 819→820 in beschermde PR, geen DDL-actie, geen providerhistorie omboeken, geen ontsnapping aan de officiële preview. Behouden eerdere contracten, BRAIN machine record en open incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

**Terminal:** Protected Required + CodeQL + officiële preview, merge, productie/source/lock 820/820/820. Dan PR #5556 opnieuw baseren op de officiële actuele main en onafhankelijk protected uitrollen als nieuwe 821e migratie. De oorspronkelijke oudere BRAIN-backlog is wel geregistreerd maar structurele automatische herstelrotatie blijft pas werkelijk live na protected merge en provider-readback.
