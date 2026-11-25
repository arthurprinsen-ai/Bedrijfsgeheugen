# Canonieke incident- en leerborging voor release-agents — 29 oktober 2026

Fingerprint: `powerhouse|release-agent-incident-evidence|20261029`. Status: **CANDIDATE / NOT LIVE** totdat protected CI, merge en skillprojectie/readback bewezen zijn.

## Wat daadwerkelijk geregistreerd is

Het bestaande Supabase-project `adhjwmvyoixzjtmiroln` bevat vier nieuwe, na het schrijven teruggelezen `public.brain_failure_registry`-fingerprints, elk met één gededupliceerde `public.brain_failure_occurrences`-rij en maturity `OBSERVED`:

| Fingerprint | Voorval en bestaand herstel |
| --- | --- |
| `portal|authenticated-two-tenant-production-proof|20261029` | GitHub Production Release Readback #40889497643 sloeg tenant-proof over. PR #5126 beschermd gemerged; echte provider/live proof moet apart vastgesteld worden. Issue #4215. |
| `powerhouse|website|checkout-trial-switch-dom|20261029` | Website scan #40889498268: `setTrialLink` riep `replaceChildren` aan op een niet-bestaande node. PR #5125 is de bestaande reparatie. Issue #4577. |
| `github|pr-machine-metadata-literal-newline|20261029` | PR #5125 en #5126 gebruikten letterlijke `\\n`; machine-metadata werd onleesbaar. Metadata gecorrigeerd; daaropvolgende admission bewezen in Required #40894585031. Issue #5118. |
| `brain|learning-canonicalization|portal-path-shadow-canary|20261029` | BRAIN-canonicalisatie wees niet-canoniek testpad en ontbrekende shadow/canary-evaluatie af. PR #5126 heeft correcte evaluator/binding en succesvolle Required. Issue #4215. |

De al bestaande Tavily-fingerprint `powerhouse|external-search|tavily-plan-limit-432|20261029` is hergebruikt, niet gekopieerd. PR #5127 en #5129 zijn beschermd gemerged. De Supabase Edge Production Authority slaagde en `bg-externe-signalen` was rechtstreeks teruggelezen als ACTIVE versie 21; echte input/impact vergt aanvullende bewijsrecords.

## Structurele correctie, zonder parallel systeem

De bestaande `AGENTS.md` en `.agents/skills/powerhouse-continuity/SKILL.md` vereisen voortaan expliciet:
1. Preflight uit actuele GitHub/Supabase/Brain-bronnen, deduplicatie op fingerprint en owner/writer-lease.
2. Eén `brain_observe_failure`-gebeurtenis per werkelijk voorval, met een stabiele occurrence-ID en payloadhash; oorzaak/preventie met `brain_promote_failure` en CAS-versie.
3. Leesbevestiging van het oorspronkelijke registerrecord vóór terminale claims; privé klant- of secretgegevens horen niet in GitHub/algemene learning.
4. Aparte bewijstoestanden voor protected CI, merge, exacte providerdeploy, twee onafhankelijke synthetische tenant-JWT's, daadwerkelijke klantisolatie en business-outcome.
5. Agentoverdracht via dezelfde obligation/skills/ledger. Bij GitHub 403/503 alleen begrensd herstel, geen retry-storm of lagere gate.

## Regressie en livegang

`tests/brain-release-agent-incident-evidence-writeback-20261029.test.mjs` controleert skillinheritance, herkenning van vijf reeds bestaande fingerprints en het onderscheid tussen code-, provider- en klantbewijs. Deze tests verifiëren **bronregels**, niet feitelijke externe side-effects.

Vervolgacceptatie: exact-head Required/BRAIN/CodeQL, beschermd merge naar `main`, projectie van skill/Brain en read-after-write op de huidige productie. De overblijvende reparatie-PR's en hun productieproof blijven hun eigen canonical owners; geen claim dat uitsluitend deze documentatie een runtimeagent al instrumenteert.
