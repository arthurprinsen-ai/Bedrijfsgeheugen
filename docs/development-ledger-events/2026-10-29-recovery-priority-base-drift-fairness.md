# Development ledger — recovery-priority-base-drift-fairness

- **Datum:** 2026-10-29
- **Change-ID:** `delivery|recovery-priority-base-drift|20261029-v1`
- **Bestaande supervisor:** `.github/workflows/powerhouse-delivery-recovery-supervisor.yml`
- **Eigenaar:** de geauthenticeerde `arthurprinsen-ai` canonical writer; maximaal één writer per PR.
- **Scope:** uitsluitend de bestaande bounded PR-ranking in `tools/delivery/recovery-pr-prioritizer.mjs`; één nieuwe replay-test; canonical BRAIN-learning + menselijke Change/ledger.
- **Fingerprint:** `ci|strict-main-drift|missing-terminal-writer-lease-owner-starvation|20261023-v1`.
- **Eerdere succesvolle bron-PR:** #5134; protected main `eead20219269341e1933bd33d3a10c7bf2ad43e9`; Netlify exact main production deploy `6ae370a59cc60cf4ee32e9d1`.
- **Onafhankelijke diagnose:** Recovery Supervisor run `40908048689` selecteerde verouderde PR #3978, herstelde niet #5134, verbruikte budget 1/1; tegelijk was #5134 exact-head Required-success met actuele lease-epoch maar verouderde `base.sha`.
- **Wijzigingscontract:** `base.sha` afwijkend van actuele main telt als adviserend prioriteitssignaal **alleen als geldige SHA**; geen automatische branchmutatie door prioritering. Bestaande live compare/lease/path overlap/CodeQL/Required/veiligheid ongewijzigd.
- **Regressie:** `tests/brain-recovery-priority-base-epoch-20261029.test.mjs`, plus bestaande delivery-prioritizer tests.
- **Publicatieregel:** niet groen totdat exact-head Required + CodeQL, beschermde merge en werkende prioritering van een latere natuurlijke of geautoriseerde run onafhankelijke readback hebben.
- **Geen:** tweede scheduler, PR-kopie voor #5134, extra provider, permissievermindering of omzeiling van branchbeveiliging.
