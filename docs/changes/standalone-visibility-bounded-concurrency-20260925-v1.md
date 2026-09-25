# Snellere volledige website-visibility gate

De volledige visibility-gate controleerde alle 92 sitemaproutes op telefoon, tablet en desktop, maar deed 276 browsernavigaties achter elkaar. Bij meerdere gelijktijdige PR's hield dat onnodig veel GitHub-runners bezet.

De gate controleert nog steeds iedere route op alle drie viewports en blijft fail-closed op dezelfde tijdsgrens. Alleen de uitvoering is nu begrensd parallel: vier route-workers per viewport. Daarmee blijft de inhoudelijke dekking gelijk en daalt de runnerduur sterk.
