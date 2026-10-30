# Append-only ontwikkelregistratie — officiële bronkwaliteit en GitHub-autorisatie

**30 oktober 2026, bronrun 09:55 UTC**, oorspronkelijke `Regulatory Source Watch`:
- Event GitHub `41036966479`, mislukte job `124000057814`; oorspronkelijke main `6134d2cc1030b87b77441ee110d7a33fd367a620`.
- EUR-Lex AI Act/NIS2/GDPR: HTTP 202, ieder 2.035 HTML-bytes; **geen onafhankelijk geverifieerde inhoud**. NCSC: HTTP 200 en 408.634 bytes; transport geverifieerd, wetswijziging nog niet semantisch bewezen.
- Een bestaande onbeveiligde candidate-branch `writer/regulatory-source-watch/41036966479` / `3852c965c95d26713216178eaca02e79d43a2263` bevatte de foutief als veranderde wetgeving aangemerkte 202-antwoorden. **Niet mergen**, niet als actueel juridisch bewijs beschouwen.
- GitHub `GITHUB_TOKEN` gaf `GraphQL createPullRequest: GitHub Actions is not permitted to create or approve pull requests`. Dit is een afzonderlijke originele provider-autorisatiegrens; historische `config/repository-writer-migration.json` met `RESOLVED_VERIFIED` van eerdere runs is hiervoor onvoldoende.

**Oorzaak:** onbegrensde transport-naar-inhoud-promotie in de originele Python-monitor én verouderde aanname over PR-create-autorisatie.

**Herstelkandidaat:** exact één originele watcher: transportvalidatie vóór hash-`changed`, onbetrouwbaar in diagnostisch heartbeat maar niet in `regulatory-content` of originele source-state, exclusieve writer met expliciete PR-weigering en ongewijzigde GitHub-branchbeveiliging. De oorspronkelijke Python ingest gebruikt dezelfde bestaande RPC en databaseregistratie. Regressie test werkelijke 202, korte 200, interstitial, redirect en goede 200 tegen tijdgebonden tijdelijke files; de huidige originele echte bronrun en provider-PR proef blijven aparte verificatiepunten.

**Bijbehorende borgen:** `brain/learning/2026-10-30-regulatory-source-202-pr-denial-v1.json`, `.agents/skills/powerhouse-continuity/SKILL.md`, `docs/changes/2026-10-30-regulatory-source-202-pr-denial.md` en bestaande GitHub workflow. Vereist: protected merge exact main, daarna natuurlijke bron-/databasereadback met géén 202-content-promotie, PR-status op echt toegestane serviceaccount. **Status vóór proof: CANDIDATE, NIET LIVE**.
