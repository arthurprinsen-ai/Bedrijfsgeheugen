# Janitor ruimt oude branches op met bewaard werk (2026-10-29)

1.519 branches met een gesloten PR, 512 zonder PR en 27 met verplaatste head bleven over. Het nieuwe `tools/ci/branch-archive-sweep.mjs` verwijdert ze alleen als het werk herstelbaar blijft: via de PR-head, via nul commits voor op main, of via een `archive/`-tag die eerst wordt teruggelezen. Maximaal 150 per run. Het annuleerpad voor oude runs gebruikt nu dezelfde veilige protected-lezing als de verwijderpaden.
