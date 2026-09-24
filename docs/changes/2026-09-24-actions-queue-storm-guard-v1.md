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


## Browser-fan-out en stall-preventie v4
Tijdens de governor-delivery bleek nog een tweede control-plane defect: governancebestanden (`AGENTS.md`, `brain/policies/`, `.agents/skills/`, `tools/delivery/`) werden niet als non-artifact herkend. Daardoor startte een pure policywijziging alsnog page/SEO/browser-CI.

Dit is dichtgezet door die paden expliciet als control-plane te classificeren en met regressie te bewijzen dat `requires_preview=false` blijft. Daarnaast heeft de website-browserjob nu `timeout-minutes: 15`; een browserstall kan dus nooit onbeperkt runnercapaciteit vasthouden.


## Zombie-run closure v5
Nieuwe observatie: branch-existence is geen geldige autoriteitscheck. De negen queued zombies van PR #1444 waren gekoppeld aan oude head-SHA's, terwijl de branch later opnieuw bestond op een andere SHA. Ook bleven meerdere oude runs langdurig `in_progress` zonder state-update.

Daarom geldt nu:
- queued en in-progress worden beide door de janitor beoordeeld;
- in-progress pas na minimaal 1800 seconden zonder update;
- cancel alleen wanneer de run-identiteit aantoonbaar obsolete is: PR gesloten, PR/head-SHA verschoven, branch/head-SHA verschoven, non-main branch verdwenen, of main-SHA verouderd;
- branch-existence alleen houdt een oude run niet meer kunstmatig levend;
- onverwachte branch-head mutatie krijgt pas autoriteit na exacte diff-validatie tegen de laatst vertrouwde head.

Dit voorkomt zowel eeuwige queue-zombies als runner-slots die door superseded delivery blijven hangen.


## YAML structural-contract learning v6
De browser-timeout uit v4 was semantisch geldig, maar werd vóór `needs:` geplaatst. Een bestaande composable-release regressietest gebruikt die key-volgorde bewust als structurele contractanchor en blokkeerde daardoor Required/BRAIN.

Herstel: `browser:` wordt weer direct gevolgd door `needs:`; `timeout-minutes: 15` blijft actief maar staat erna. Nieuwe regel: bij workflow-control wijzigingen eerst bestaande structurele contracttests respecteren; verander geen bewezen anchor als de semantiek dat niet vereist.


## Latest-main single-flight v7
The remaining long-running pressure source was workflow concurrency itself. Several main verification workflows either had no concurrency group, used `github.run_id` inside the key, or explicitly disabled cancellation. This meant old main epochs could keep consuming runners after a newer main already existed.

The four verification surfaces now use stable latest-ref/latest-main single-flight:
- Canonical brand shell live readback;
- Production Release Readback;
- Powerhouse CodeQL;
- Python CodeQL.

A second governance rule is now explicit: auto-merge may only be armed after exact-head Required, BRAIN, applicable CodeQL and Skill Projection are terminal success. PR #2807 proved why: it merged while Required was still active, and Required was cancelled afterward.


## Main- en branch-trigger fan-out v8
De volgende resterende fan-outbron is structureel gesloten: verificatieworkflows met een bestaande smalle PR-scope mogen niet alsnog op iedere `main`-push starten. De main-push scopes van Python CodeQL, Powerhouse CodeQL, Canonical Brand Shell readback, Quality Intelligence, Powerhouse Assurance en SEO Order Engine spiegelen nu hun relevante wijzigingspaden.

Daarnaast draait Brain Foundation niet meer op iedere feature-branch push; kandidaatbewijs loopt via PR-admission/Required/BRAIN. Daardoor veroorzaakt het voorbereiden van een candidate geen tweede pre-PR verificatielaag.

Canonical Brand Shell production readback heeft nu naast latest-main single-flight ook een harde job-timeout van 15 minuten. Een zichtbaarheid/browsercontrole kan daarmee nooit onbeperkt een runner vasthouden.


## Production-proof en fan-out forecast v9
Niet alle main-workflows mogen dezelfde concurrencystrategie krijgen. Canonical Brand Shell verificatie en CodeQL kunnen safely latest-wins zijn; **Production Release Readback niet**. Dat workflowbewijs hoort bij een specifieke merge/release-epoch en blijft daarom serialized met `cancel-in-progress: false`.

Ook is de fan-outvoorspelling aangescherpt. Voor #2809 werden 4 runs verwacht, maar 13 PR-runs gestart omdat gewijzigde workflow-YAML-bestanden hun eigen `pull_request.paths` matchten. Voortaan wordt vóór PR-open/reopen de volledige changed-path → workflow-trigger graph geëvalueerd, inclusief self-triggering workflowbestanden.

Als een repair op een open PR daardoor te veel nieuwe runs zou veroorzaken, mag dezelfde PR tijdelijk onmerged worden gesloten, de branch zonder PR-synchronize worden gerepareerd, en pas na queue-admission weer worden heropend. Geen duplicate PR.
