# Full commit checkset is terminal delivery authority — 5 oktober 2026

Obligation: `full-commit-checkset-authority-20261005-v1`.

## Aanleiding
PR #3729 liet zien dat een normale Powerhouse workflow-run groen kan zijn terwijl op exact dezelfde commit nog afzonderlijke GitHub App-checks bestaan. Met name GitHub Advanced Security / CodeQL kan buiten de normale workflow om een eigen check-run publiceren.

## Structurele wijziging
De delivery authority gebruikt voortaan één keten:

`exact candidate head SHA → volledige commit check-runs + legacy statuses → security policy → required subset → mergeability/current-main CAS → merge → production verification → terminal readback`.

Een required-check subset mag nooit meer als equivalent van de volledige commit-checkset worden behandeld. Pending/failing checks blokkeren. Security-checks met een niet-expliciet geaccepteerde terminale conclusie blokkeren fail-closed. Informatieve niet-security checks mogen alleen volgens expliciet beleid terminal evidence zijn.

## Regression
De failure mode is vastgezet in:
- `tests/github-delivery-state-machine.test.mjs`
- `tests/github-delivery-state-machine-workflow.test.mjs`

De workflow-wiring staat in `.github/workflows/unified-brain-delivery.yml`; de beslissingslogica staat in `tools/delivery/github-delivery-state-machine.mjs`.

## Closure
Deze ledger-entry vormt de activity-ledger evidence voor dezelfde immutable obligation. De PR mag pas groen worden na een nieuwe exacte-head readback waarop de volledige commit-checkset, security, merge en productie-readback terminal volgens beleid zijn.
