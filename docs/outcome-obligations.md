# Whole-Brain Outcome Obligations

Dit contract geldt voor het volledige Bedrijfsgeheugen en alle huidige en toekomstige agents, scenario's, workflows, publicaties, synchronisaties, deploys, controles en automatische acties.

## Hoogste invarianten

- **NO SILENT FAILURE** — een technisch geslaagde run zonder het bedoelde resultaat is nooit automatisch groen.
- **NO LOST OBLIGATION** — ieder verwacht resultaat blijft als obligation bestaan totdat bewijs van voltooiing bestaat of een expliciete harde grens is bereikt.
- **GREEN MEANS OUTCOME VERIFIED** — groen betekent aantoonbaar extern of systeemmatig resultaat, niet alleen exit code 0.
- **RED MEANS AGENTS KEEP WORKING** — een veilig oplosbare rode toestand start of hervat automatisch recovery totdat het resultaat geverifieerd is.

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

## Outcome boven runstatus

`SUCCESS`, HTTP 2xx, een geslaagde Make-run, een afgeronde GitHub Action of een lege zoekresultaatset zijn uitsluitend technisch bewijs. Ze zijn nooit voldoende voor een obligation waarvan het business- of systeemresultaat nog ontbreekt.

Voorbeeld: als om 08:40 een LinkedIn-post hoort te bestaan, dan is een publisher-run met nul kandidaten geen succes. Zodra de deadline is verstreken en geen geverifieerd post-ID bestaat, is de status `MISSED_OBLIGATION` en moet recovery starten.

## Statusmachine

`NOT_DUE` betekent dat geen resultaat verschuldigd is. `PENDING` betekent dat de deadline nog niet is bereikt en geen technische poging voltooid is. `AWAITING_OUTCOME` betekent dat de technische stap klaar kan zijn maar outcome-bewijs nog ontbreekt. `MISSED_OBLIGATION` betekent dat de obligation over tijd is zonder bewijs. `RECOVERING` betekent dat een agent de green-until-done-lus uitvoert. `COMPLETED` is alleen toegestaan met geldig outcome-bewijs. `BLOCKED_HARD_BOUNDARY` is alleen toegestaan voor de in het agentcontract genoemde harde grenzen.

## Recoverycontract

Bij `MISSED_OBLIGATION`:

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

## Reconciliation

Naast event-driven verificatie moet er een onafhankelijke reconciler bestaan die periodiek terugkijkt naar wat volgens planning, state en historie had moeten gebeuren. Daardoor worden ook failures gevonden waarbij geen fout-event is ontstaan.

De generieke vergelijking is:

`expected obligations` − `verified completed obligations` − `valid hard boundaries` = `open recovery work`.

## Harde grenzen

Alleen credentials/accountverbindingen, permissies, security-verzwakking, destructieve/onherroepelijke data, hogere betaalde resources of juridisch/financieel bindende handelingen mogen autonome recovery blokkeren. De blokkade moet zelf expliciet geregistreerd blijven en bij volgende agentruns opnieuw worden gecontroleerd.

## Definition of Done

Een obligation is pas klaar als het bedoelde resultaat bestaat, het vereiste bewijs is opgeslagen, idempotency is bevestigd, regressie/preventie is geborgd waar technisch mogelijk en de gedeelde teamcontext de uitkomst kent. Technische success-status zonder outcome-bewijs voldoet niet.
