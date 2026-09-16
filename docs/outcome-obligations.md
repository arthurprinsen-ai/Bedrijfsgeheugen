# Whole-Brain Outcome Obligations

Dit contract geldt voor het volledige Bedrijfsgeheugen en alle huidige en toekomstige agents, scenario's, workflows, publicaties, synchronisaties, deploys, controles en automatische acties.

## Hoogste invarianten

- **NO SILENT FAILURE** — een technisch geslaagde run zonder het bedoelde resultaat is nooit automatisch groen.
- **NO LOST OBLIGATION** — ieder verwacht resultaat blijft als obligation bestaan totdat bewijs van voltooiing bestaat of een expliciete harde grens is bereikt.
- **GREEN MEANS OUTCOME VERIFIED** — groen betekent aantoonbaar extern of systeemmatig resultaat, niet alleen exit code 0.
- **RED MEANS AGENTS KEEP WORKING** — een veilig oplosbare rode toestand start of hervat automatisch recovery totdat het resultaat geverifieerd is.
- **PARTIAL LIVE MEANS KEEP WORKING** — `DEELS LIVE`, open parity, migratiedrift, rode gates of ontbrekende readback/writeback zijn tussenstanden en geen normale stopconditie.
- **GREEN CANDIDATE MEANS PROMOTE TO PRODUCTION** — een aantoonbaar groene repository-kandidaat creëert automatisch een productie-obligation.
- **NO STALE BACKLOG** — iedere historische open/blocked/ready obligation en iedere oude PR moet actief worden gereconcilieerd tegen de huidige productie-authority; stale werk mag niet onbeheerd blijven bestaan.

## Obligation-model

Iedere verwachte actie wordt vóór of uiterlijk bij dispatch machine-readable geregistreerd met minimaal:

- `id`: stabiele obligation-id;
- `domain`: publicatie, content, SEO, website, deploy, data-sync, monitoring, sales, CRM, kosten, security, performance, governance, extern signaal of agenttaak;
- `expected`: of het resultaat volgens planning/state werkelijk verschuldigd is;
- `dueAt`: deadline of eerste verificatiemoment;
- `ownerAgent`: primaire herstelagent;
- `evidencePolicy`: welk bewijs `COMPLETED` mag veroorzaken;
- `idempotencyKey`: beschermt tegen dubbele side-effects;
- `recoveryPolicy`: veilige herstelroute en escalatiepad.

## Productie-obligation

Voor repository-backed wijzigingen is **Powerhouse Production Promotion Guardian** de owner zodra de kandidaat aantoonbaar groen is. De machine-readable policy staat in `config/production-promotion.json`.

Een commit of merge is not completion: de obligation blijft open totdat de exacte productie-SHA aantoonbaar gelijk is aan de geaccepteerde `main`-SHA en productie-smoke, regressie en protected metrics groen zijn. Netlify `ready` op een andere commit is niet voldoende. Safe promotion and rollback are autonomous: de Guardian merge/promoveert, deployt/reconcileert, verifieert en rolt bij productieregressie terug naar last-known-good zonder extra toestemming zolang geen harde grens wordt geraakt.

Historische tussen-SHA's mogen bij een commitstorm expliciet worden gesupersede door een nieuwere aantoonbaar releasable `main`, maar mogen nooit stil verdwijnen. De supersession-evidence sluit de oude obligation en de nieuwste `main` behoudt de actieve productie-obligation.

## Outcome boven runstatus

`SUCCESS`, HTTP 2xx, een geslaagde Make-run, een afgeronde GitHub Action of een lege zoekresultaatset zijn uitsluitend technisch bewijs. Ze zijn nooit voldoende voor een obligation waarvan het business- of systeemresultaat nog ontbreekt.

Voorbeeld: als om 08:40 een LinkedIn-post hoort te bestaan, dan is een publisher-run met nul kandidaten geen succes. Zodra de deadline is verstreken en geen geverifieerd post-ID bestaat, is de status `MISSED_OBLIGATION` en moet recovery starten.

## Statusmachine

`NOT_DUE` betekent dat geen resultaat verschuldigd is. `PENDING` betekent dat de deadline nog niet is bereikt en geen technische poging voltooid is. `AWAITING_OUTCOME` betekent dat de technische stap klaar kan zijn maar outcome-bewijs nog ontbreekt. `MISSED_OBLIGATION` betekent dat de obligation over tijd is zonder bewijs. `RECOVERING` betekent dat een agent de green-until-done-lus uitvoert. `COMPLETED` is alleen toegestaan met geldig outcome-bewijs. `BLOCKED_HARD_BOUNDARY` is alleen toegestaan voor de in het agentcontract genoemde harde grenzen.

Completion Supervisor v1 normaliseert deze state naar één besturingsactie. Alleen zeven identity-bound evidenceklassen samen leveren `LIVE_VERIFIED`: kandidaat-tests, protected delivery, production identity, functionele readback, complete obligations, actuele capability-handoff en learning/prevention-writeback. Een harde grens levert `WAIT_EXTERNAL` en `canComplete:false`; dezelfde obligation en hetzelfde AgentWork hervatten automatisch wanneer de vastgelegde `resume_when`-conditie aantoonbaar waar wordt.

Voor backlog-reconciliation wordt daarnaast iedere bestaande record of PR functioneel geclassificeerd als:

- `ACTIVE` — nog steeds relevant en technisch oplosbaar; recovery moet doorgaan;
- `HARD_BOUNDARY` — nog relevant maar objectief geblokkeerd door authority, permission, safety, destructiviteit, betaalde resource of juridisch/financiële grens;
- `SUPERSEDED` — de oorspronkelijke route is aantoonbaar vervangen door een nieuwere canonieke route; bewijs van de opvolger is verplicht;
- `VERIFIED_CLOSED` — het bedoelde outcome is aantoonbaar bereikt en teruggelezen.

Een database-status zoals `OPEN`, `BLOCKED`, `READY` of een open GitHub-PR is dus geen blijvende waarheid op zichzelf. De reconciler moet de actuele classificatie bepalen uit current main, Supabase/runtime, provider- en productie-readback.

## Recoverycontract

Bij `MISSED_OBLIGATION` of `ACTIVE` backlogwerk:

1. dedupe op fingerprint en idempotency-key;
2. controleer of het outcome mogelijk al extern bestaat;
3. bepaal de eerste aantoonbare state- of contractmismatch;
4. herstel uitsluitend veilige machine-state automatisch;
5. voer de kleinste veilige side-effect opnieuw uit;
6. verifieer het echte resultaat;
7. schrijf bewijs, root cause, fix en preventie naar ledger en gedeeld geheugen;
8. blijf hervatten zolang veilig herstel mogelijk is.

Een bekende fout wordt niet opnieuw vanaf nul onderzocht. Maximaal twee identieke retries per hypothese zijn toegestaan; daarna is nieuwe informatie, een nieuwe hypothese of een bewezen fallback verplicht.

## Idempotency

Self-healing mag nooit dubbele publicaties, dubbele mails, dubbele CRM-writes, dubbele facturatie of dubbele deploy-side-effects veroorzaken. Voor iedere side-effect-veroorzakende obligation wordt eerst gecontroleerd of het externe bewijs of de `idempotencyKey` al bestaat.

## Canonieke backlog reconciliation

Naast event-driven verificatie moet er een onafhankelijke reconciler bestaan die periodiek én bij hervatting van relevante chats/agents terugkijkt naar wat volgens planning, state en historie had moeten gebeuren. Daardoor worden ook failures gevonden waarbij geen fout-event is ontstaan en worden historische records niet eeuwig als pseudo-open werk meegedragen.

De generieke vergelijking is:

`expected obligations` − `verified completed obligations` − `valid hard boundaries` − `verified superseded obligations` = `active recovery work`.

Verplichte inputs zijn minimaal:

1. alle niet-afgesloten `brain_obligations` en relevante domein-obligations;
2. relevante open GitHub PR's en branches;
3. current `main` en required-check status;
4. actuele Supabase migration/runtime authority;
5. provider-/production-readback waar het outcome buiten GitHub ligt;
6. bestaande learning, error, outcome en supersession-lineage.

Verplichte behandeling per item:

- **ACTIVE:** owner + next executable action vastleggen en recovery uitvoeren; alleen stoppen bij een harde grens.
- **HARD_BOUNDARY:** exacte blocker-evidence, retry/resume-conditie en één dedupebare obligation behouden; bij iedere volgende relevante run opnieuw toetsen of de grens nog bestaat.
- **SUPERSEDED:** expliciet vastleggen welke canonical fingerprint/PR/runtime-route het item vervangt, bewijs van die opvolger teruglezen en de oude record/PR sluiten of als superseded markeren; nooit alleen negeren.
- **VERIFIED_CLOSED:** outcome-evidence, readback, learning/prevention en closure-timestamp bewaren; het item mag niet opnieuw als actief werk verschijnen tenzij nieuw bewijs een regressie toont.

Open PR's volgen dezelfde regel: `merge`, `consolidate`, `superseded-close` of `hard-boundary`; een historische PR mag niet onbeperkt open blijven als latere `main` het doel aantoonbaar heeft overgenomen.

Retired architectuur mag niet via recovery worden gereanimeerd. Als bijvoorbeeld een oude Make-obligation betrekking heeft op functionaliteit die inmiddels canoniek GitHub/Supabase-native is, moet de oude obligation als `SUPERSEDED` worden gesloten met verwijzing naar de actuele route; Make opnieuw activeren is dan een architectuurregressie.

De actuele backlog zelf is runtime-state en hoort niet als statische lijst in dit document. Iedere reconciliatierun schrijft een snapshot/fingerprint met aantallen, actieve items, hard boundaries, superseded closures en evidence naar de bestaande Powerhouse runtime/learning-lineage.

Voor `deploy` vergelijkt de Production Promotion Guardian bovendien periodiek de nieuwste geaccepteerde `main`-SHA met de actuele production `commit_ref`. Na de bounded grace period is een mismatch `MISSED_OBLIGATION` en moet hij zelf de veiligste productieactie uitvoeren en opnieuw verifiëren.

Canonical fingerprint: `powerhouse-obligation-reconciliation-v1`.

## Harde grenzen

Alleen credentials/accountverbindingen, permissies, security-verzwakking, destructieve/onherroepelijke data, hogere betaalde resources of juridisch/financieel bindende handelingen mogen autonome recovery blokkeren. De blokkade moet zelf expliciet geregistreerd blijven en bij volgende agentruns opnieuw worden gecontroleerd.

Een veilige groene productiepromotie of rollback naar een bewezen last-known-good is geen harde grens.

## Definition of Done

Een individuele obligation is pas klaar als het bedoelde resultaat bestaat óf aantoonbaar door een werkende canonieke opvolger is superseded, het vereiste bewijs is opgeslagen, idempotency is bevestigd, regressie/preventie is geborgd waar technisch mogelijk en de gedeelde teamcontext de uitkomst kent. Technische success-status zonder outcome-bewijs voldoet niet.

De Powerhouse-backlog als geheel is alleen groen wanneer iedere bekende obligation/PR in scope aantoonbaar `VERIFIED_CLOSED`, `SUPERSEDED` met bewezen opvolger, of `HARD_BOUNDARY` met actuele blocker-evidence is; alle `ACTIVE` items blijven herstelwerk. Voor repository-wijzigingen betekent completion bovendien dat de exacte production SHA is geverifieerd; commit- of merge-status alleen is nooit klaar.
