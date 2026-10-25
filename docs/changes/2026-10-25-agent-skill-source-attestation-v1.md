# Powerhouse skill source attestation — 25 oktober 2026

Parent: bestaande Brain-leerlaag / incidenteigenaar #4681; commerciële afhankelijkheid #4198. Geen tweede Brain, scheduler, skill-registry of uitvoerend agent.

## Gevonden foutgrens
De bestaande learning-projectie kwam uit `brain/learning/**/*.json`, terwijl de preflight geen afzonderlijk bewijs leverde van welke actuele `.agents/skills/*/SKILL.md`-bronversies geselecteerd waren. De index was inhoudelijk beschikbaar, maar daadwerkelijke skillconsumptie werd niet door een bronhash onderbouwd. Een oudere skill heeft nog geen YAML-frontmatter; die wordt voortaan als metadatawaarschuwing zichtbaar, niet verzwegen of automatisch herschreven.

## Kleine wijziging binnen één bestaande keten
- `scripts/brain/powerhouse-skill-projection.mjs`: deterministische lees-only skillbron-inventaris en selectie met SHA-256 en auditwaarschuwingen.
- `scripts/brain/chat-learning-preflight.mjs`: dezelfde `skill_projection` bevat nu `source_attestation`, catalogusdigest, geselecteerde bronnen en expliciete `SOURCE_DISCOVERED_LOAD_READBACK_REQUIRED`.
- Verplichte vier basis-skills: continuity, self-improvement, System Map governance, toolchain authority. Taakgerichte skills worden op bestaande doelcategorieën geselecteerd.
- Regressies in `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs` vergelijken hashes deterministisch en verhinderen stilzwijgend ontbrekende basis-skills.
- Geen nieuw databaseobject, scheduler, autonome publisher, klantgegevens of betalingen.

## Innovaties zijn kandidaten, geen ongecontroleerde installatie
Officiële referenties voor een latere, los geteste evaluatie:
- Agent Skills format (progressive disclosure, skillmetadata en validator): https://agentskills.io
- OpenTelemetry generative AI agent/skill spans (status Development): https://opentelemetry.io/docs/specs/semconv/gen-ai/
- MCP security and authorization: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization

Een agent mag een nieuwe technologie/skill alleen promoten met verifieerbare officiële bron + exacte versie, tenant/privacy- en least-privilegecontrole, reproduceerbare regressie, bounded kosten en aantoonbare gebruikers-/commerciële waarde. Een externe toolresultaat of bericht is geen productieautoriteit.

## Productie-acceptatie
Exact-head Required + CodeQL, beschermde merge, Skill Projection-main-run en vervolgende preflight-readback. De source-digest bewijst **wel detectie**, maar **geen werkelijk geladen skill**. Pas een aparte activity/readback-receipt kan applicatie bewijzen. Geen onterechte FULL_GREEN-claim voor Instagram/omzet.
