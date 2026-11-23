# GitHub Recovery Supervisor: voorkom verkeerde PR-prioriteit bij actuele lease en oude basis

**29 oktober 2026 — beschermde kandidaat, nog niet live.** Dit herstelt één fout in de bestaande Recovery Supervisor-prioritering; er komt geen nieuwe agent, scheduler of onafhankelijke writer.

## Wat ging er mis?

De oorspronkelijke policy-PR [#5134](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5134) had groen Required en CodeQL op zijn oude commit, maar GitHub meldde `behind`. De bevoegde eigenaar had een geldige terminal writer-lease aangemaakt op de actuele `main`-epoch. In de bestaande prioriteitscode maakte die actuele lease-epoch de PR ten onrechte een categorie-4 kandidaat, hoewel de PR-base nog oud was.

De bestaande Recovery Supervisor [run 40908048689](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40908048689) eindigde `success`, maar koos PR #3978; na `RECOVERY_PR_BUDGET_USED:1/1` bleef #5134 onbehandeld. Een groene supervisorrun betekent dus niet dat iedere PR of de bedoelde PR is hersteld.

De eigenaar heeft #5134 hierna veilig met GitHub's native CAS-update `expected_head_sha` gesynchroniseerd. Exacte Required + CodeQL zijn opnieuw geslaagd; de oorspronkelijke PR is beschermd gemerged op `main` `eead20219269341e1933bd33d3a10c7bf2ad43e9`; Netlify publiceerde exact dezelfde SHA. Dit bewijst herstel van die ene PR, niet toekomstige foutpreventie.

## Wat verandert?

De bestaande `tools/delivery/recovery-pr-prioritizer.mjs` behandelt voortaan ook een **welgevormd GitHub PR-base-SHA dat afwijkt van de actuele hoofdbranch** als een *advisoir* signaal dat bronverversing nodig kan zijn. Een geldige exclusieve lease met recente succesvol afgeronde Required mag dan vóór oudere, niet-geverifieerde kandidaten komen. Een misvormde of ontbrekende base-SHA geeft geen driftbewijs. Lopende tests behouden defer-prioriteit; `MAIN_SYNC` blijft de exclusieve reconciliatiehouder.

De prioritering verleent zelf **geen schrijfrecht**, omzeilt geen GitHub Required/CodeQL en mag geen `behind_by`, review-, tenant- of providerbewijs verzinnen. Voor iedere mutatie blijft de bestaande supervisor de actuele GitHub-compare, afwijkende paden, owner-lease, CAS en budgetgrenzen controleren.

## Regressie en acceptatie

Nieuwe replay-test: `node --test tests/brain-recovery-priority-base-epoch-20261029.test.mjs`. De bestaande `node --test tests/delivery-recovery-pr-prioritizer.test.mjs` blijft vereist. Beide moeten slagen op de nieuwe exacte HEAD, gevolgd door volledige Required/CodeQL, beschermde merge, minstens één echte autoritatieve Recovery Supervisor-run en readback van de feitelijke rangorde. De code is tot dat bewijs **CANDIDATE**, niet `LIVE`.

**Bestaande registraties:** [P0 issue #4914](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4914), Supabase `brain_failure_registry` fingerprint `ci|strict-main-drift|missing-terminal-writer-lease-owner-starvation|20261023-v1`. Geen tweede issue of scheduler.