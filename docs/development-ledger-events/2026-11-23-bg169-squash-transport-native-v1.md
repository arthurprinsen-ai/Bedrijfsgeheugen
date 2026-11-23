# Ontwikkellog — BG169 native merge-methode

- **23-11-2026:** originele run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45144449592 bereikte `TERMINAL_MERGE_ADMITTED` na volledige echte checks, maar GitHub API wees `merge_method=merge` af met HTTP405 omdat de repository alleen squash toestaat.
- **Eigenaar:** de oorspronkelijke `Unified Brain Delivery`/BG169 transportketen, geen tweede publicatie-agent.
- **Bronfix:** repo-policycontrole `allow_squash_merge`, toegestane `squash`, provider exact merge-SHA, zelfde PR, protected main-voorouder en identieke kandidaat/merge Git tree.
- **Regression:** `tests/brain-bg169-squash-transport-20261123.test.mjs`; oorspronkelijke Required, CodeQL, lease, rollback SHA, current-main CAS, conflict en security blijven verplicht.
- **Bewijs:** bron-PR en testkandidaat zijn géén productiepublicatie; dit incident blijft OPEN tot geautoriseerde native release plus onafhankelijke provider/live readback.
