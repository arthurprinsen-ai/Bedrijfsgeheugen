# GitHub Actions queue-storm guard — 24 september 2026

## Root cause
De repositorybrede recovery-supervisor draaide zowel op iedere push naar `main` als iedere vijf minuten. Met tientallen open PR's kon één cyclus opnieuw meerdere recovery-workflows dispatchen en zo bestaande Actions-capaciteitsdruk versterken.

## Fix
- geen repositorybrede recovery-scan meer op `main` push;
- schedule teruggebracht naar iedere 15 minuten;
- circuit-breaker bij 20 actieve/queued/pending/waiting/requested runs;
- maximaal één PR-recovery per supervisorcyclus;
- bestaande branch protection blijft intact.

## Preventie
Recovery-automatisering moet backlog reduceren en mag nooit zelf nieuwe fan-out veroorzaken wanneer de control plane al verzadigd is.

## CI-scope preventie
De recovery-supervisor en zijn regressietest zijn expliciet non-artifact control-plane voor website release-risk. Daardoor start een CI-only herstelwijziging geen volledige publieke websitebrowsercrawl meer. Dit reduceert runnerdruk en voorkomt dat een queue-reparatie zelf opnieuw onnodig veel CI-capaciteit gebruikt.


## Zombie-queue janitor
Queued Actions-runs ouder dan 6 uur worden alleen geannuleerd wanneer hun niet-`main` head-branch aantoonbaar niet meer bestaat. De cleanup is begrensd op maximaal 20 runs per supervisorcyclus en draait vóór de circuit-breaker. Daarmee worden historische zombies van reeds afgeronde deliveries opgeruimd zonder actuele/open delivery op leeftijd af te schieten.


## Predictive queue governor v3
Iedere chat/agent moet vóór GitHub-mutaties de huidige queue en verwachte fan-out voorspellen. Soft pressure: 12 active / 10 queued. Hard circuit: 20 active / 20 queued. Een afzonderlijke actie mag niet bewust meer dan 6 nieuwe runs veroorzaken.

Onder druk is de prioriteit: exact-head werk hergebruiken → dedupliceren → writes bundelen → irrelevante lanes overslaan → bewezen orphaned stale queue opruimen → alleen ontbrekende kritieke single-flight gate starten. Herstel dat de backlog vergroot is verboden.

### Incidentlessen die permanent zijn geblokkeerd
- geen repositorybrede recovery op elke main-push;
- geen multi-PR recovery fan-out;
- geen duplicate obligation/PR als queue-escape;
- geen serie losse borging-commits die ieder CI retriggeren;
- geen volgen van superseded workflow-runs na head drift;
- geen zware website/browser-CI voor pure control-plane changes;
- geen gezonde current-head run cancellen alleen wegens leeftijd;
- geen zombie queued runs na verdwenen branches;
- geen transient branch==main reconcile;
- geen vermenging van bestaande baseline-regressies met queue-repair zonder canonieke baselinefix.
