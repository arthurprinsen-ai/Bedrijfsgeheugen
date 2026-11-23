# P0 #4198 — verplichte no-premature-closure voor alle agents en chats (15 november 2026)

## Betekenis van klaar
Technische release bewezen betekent niet dat de bedrijfsuitkomst klaar is. Lees het originele `docs/brain/groen-draaiboek.md` en de bovenste `AGENTS.md`-regel; die zijn samen canoniek. Vervang nooit een klant-/agentuitkomst door een PR-, CodeQL-, succesvolle-cron-, HTTP-200- of deploymentstatus.

Hanteer onafhankelijke stappen: (1) code en regressie op exacte SHA groen; (2) beschermde merge; (3) daadwerkelijk uitgevoerde productiecode en providerbron met identieke SHA/source revision; (4) echte originele consumer-`PROCESSED` met tenant + revision + original owner/correlation; (5) rechtmatige echte externe provideractie en ID plus onafhankelijke GET/readback wanneer van toepassing; (6) echt waargenomen klant-/business-resultaat en de volgende natuurlijke uitvoeringscontrole; (7) geregistreerde foutoorzaak, herstel, regressie, preventieregel en hergebruikte les. Markeer alleen het aantoonbaar bereikte niveau, nooit alle niveaus door één groen signaal.

## Fail-closed completion
`TECHNICAL_RELEASE_VERIFIED` en `BUSINESS_OUTCOME_VERIFIED` zijn verschillende toestanden. `UNKNOWN ≠ N/A`. Een N/A voor een van de zeven stappen vraagt een gedateerde, brongebonden reden en oorspronkelijke eigenaar, geen lege waarde. Als een relevante stap ontbreekt, is het **onderliggende probleem OPEN/DEGRADED**, blijft de originele BRAIN-verplichting bestaan en wordt niet terminal gesloten. De oorspronkelijke eigenaar zet veilig door, zonder tweede scheduler/parallelle verzender, zonder bronloos resultaat en zonder het omzeilen van provider-/privacybevoegdheid. Leg ook **iedere fout onderweg** vast met oorzaak, herstel, regressie, preventieregel, owner, veilige volgende actie en hercontrolemoment.

## Meetbaar onopgelost bij start van deze correctie
De originele 7-dagen-scorecard gaf `BROKEN_RESEARCH_TO_COMPOSER_EXPIRED=1` en `EXPIRED_WITHOUT_DELIVERY=2`, plus tien niet-leesbare bronsites met herprobeertermijn. Er waren 23.295 contextverwerkte connecties maar slechts 605 bekende canonieke e-mailadressen, zonder bewezen groei. Een geslaagde rotatie-Edge-release is géén bewijs dat de originele #116 → #138 → ONE BRAIN/Heartbeat → oorspronkelijke commerciële provider en outcome-lus is afgerond. Geen nieuwe toestemming of fictieve afleveringen verzinnen.

## Onderweg vastgelegde CI-fouten in deze PR
1. `PR_MACHINE_METADATA_INVALID:OBLIGATION_ID_MISSING`: eerste kandidaat had alleen `Fingerprint:` in plaats van vereist `Obligation-ID:`. Herstel: PR-body vult canonieke `Obligation-ID` en volledige scopepaden in; onafhankelijke admission moet opnieuw slagen.
2. `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:human_documentation`: eerste kandidaat had een activity-ledger en een leerrecord, maar geen `docs/changes/` of `docs/learning/` artifact. Herstel: deze menselijke documentatie toevoegen binnen bestaande zevenbestanden-budget, zonder admission te versoepelen.

De enige oorspronkelijke eigenaar, bronrevision, idempotency, actor, lesson JSON en ledger blijven behouden. Bewijs van volledige business-loop is nog **niet** geleverd. Dit dokument is het brongebonden herstelplan, geen bewering dat de productie-executor al de drie handoffs heeft opgelost.

## Regressie en overname
Bestaande code-eigenaren `agent-integration-engineer`, `agent-reliability`, `agent-data-quality` en `agent-growth-market` staan in dezelfde `platform/agents/agent-team.mjs`; de bestaande daily source-enrichment skill krijgt de exacte commerciële ACCEPT/OPEN-regel. Regressie `tests/brain-no-premature-closure-contract-20261115.test.mjs` controleert deze contracten; incident #4198 blijft open voor de werkelijk incomplete bedrijfsloop. Na de beveiligde merge is afzonderlijk nodig: GitHub production readback, provider/source/consumer ACK en resultaat-/leereffect. Niet voortijdig 'alles groen' zeggen.

## 15 november — actuele vier overdrachten en veilige opvolgende kandidaat

De drie eerder vermelde handoffs waren de oorspronkelijke snapshot; op 2026-11-15T16:06:17.923315Z is de onafhankelijke scorecard **vier** geworden: 1 `BROKEN_RESEARCH_TO_COMPOSER_EXPIRED`, 1 `BROKEN_RESEARCH_TO_COMPOSER_SLA`, 2 `EXPIRED_WITHOUT_DELIVERY`. Ze blijven onder oorspronkelijke `original-agent:commercial` en #4198 open. Geen zelfcertificering.

PR #5884 kon ondanks code-synchronisatie niet mergen omdat de beschermde migratie-run `CANDIDATE_BASE_SHA=2f301e69633493bc1fa5589ad64c2128cff3cebc` als *onwijzigbare originele basis* gebruikte, terwijl nieuwe elders toegepaste migraties op `main` stonden. Een PR-body-wijziging verandert die oorspronkelijke gecontroleerde basis niet. Herstel: eenmalig vervangen door een nieuwe beschermde PR met `Supersedes: 5884` op de actuele `main`-SHA; dezelfde zeven inhoudelijke bestanden en dezelfde eigenaar, originele PR na vastlegging sluiten. In geen geval de migratievergelijking versoepelen. Beveiligingscontrole en onafhankelijke provider-preview blijven nodig.
