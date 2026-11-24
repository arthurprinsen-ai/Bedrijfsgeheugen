# P0 #4198 — borging in bestaande agents en skills: Infinity #171 plus bronwaarheid

## Productieoorzaak, exact onderscheiden van herstel
De oorspronkelijke Supabase-job #171 faalde op 2026-11-16 06:41 UTC in de 07:41-Europe/Amsterdam Infinity-tak doordat `POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED` niet lokaal werd opgevangen. De beveiligde [PR #5919](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5919) is gemerged naar main op `03a317c10f4d66eae9fc143a3f7b0f13f06389c8`; native migratie `20261116105000` is precies eenmaal in oorspronkelijke productie toegepast; een volgende *gewone* natuurlijke #171-run om 09:59 UTC is geslaagd. Dit bewijst technische deelreparatie, niet de latere natuurlijke 07:41-bronfoutafhandeling.

Productiebron `powerhouse_intelligence_signal_projection_v1` bevatte op auditmoment 258 signalen, 0 vers/geschikt binnen zeven dagen; `bg_externe_signalen` had 72 recente opgehaalde signalen maar 0 geautoriseerde. De `bg_gezondheid.external-intelligence` versheidsstatus `ok` duidt dus niet op een geschikte toegestane bron. Ontbrekend providerbewijs en customer outcome blijven OPEN. Gelijktijdige `TAVILY_432` / `DATAFORSEO_REMOTE_FAILURE` / `UPSTREAM_PLAN_LIMIT` zijn onafhankelijke signalen voor brononderzoek, geen bewezen directe oorzaak.

## Bestaande eigenaars, geen nieuw systeem
- `AGENTS.md`: vaste bewijsstaat en fail-closed escalatie voor alle bestaande agents/chats/skills.
- `.agents/skills/powerhouse-recovery-proof/SKILL.md`: originele Reliability-ledger/incident/CAS, exacte taakstatus en natuurlijke 07:41-uitkomst.
- `.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md`: echte toegestane recente externe signalen en originele provider-/consumerchain, niet alleen recente fetch.
- `platform/agents/agent-team.mjs`: vier taken voor de **bestaande** Engineering, Reliability, Data Quality en Growth-agent; geen extra uitvoerder.
- `tests/brain-infinity-original-171-agent-skill-contract-20261116.test.mjs`: executable historical replay on all four sources, function guard and nonterminal learning.

De bestaande exclusieve `#171`, originele Source Universe, ONE BRAIN en Heartbeat blijven de enige verantwoordelijkheden; veilige herstelbare taken blijven lopen, onbekende provider-side-effects worden niet blind herhaald. Extern consent, security en providerquota zijn harde grenzen.

## Acceptatie en onafhankelijke betekenis
Deze PR is governance/agent- en skillconfiguratie, geen nieuwe productieservice of provideractie. Voor toekenning `AGENT_SKILL_RULE_LIVE` zijn exact-head Required/BRAIN/CodeQL en Supabase-preview waar van toepassing, beveiligde merge, identieke main-bundel en readback van de gewijzigde agent/skill-byteinhoud nodig. Dat betekent nog steeds niet `END_TO_END_VERIFIED`: vereis afzonderlijk de natuurlijke 07:41-task receipt, nieuw echt toegestaan extern signaal, originele consumer-ACK, eventueel provider effect en toegepast leren. Open verplichtingen blijven apart. Hoofdregistratie: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
