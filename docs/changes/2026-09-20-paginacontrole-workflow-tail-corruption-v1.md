# Paginacontrole workflow corruption recovery

Fingerprint: `paginacontrole-workflow-tail-corruption-v1`.

The workflow failed instantly with zero jobs because duplicate YAML fragments had been appended after the canonical final step. The file has been truncated to its single intended workflow document and a regression now blocks recurrence.
