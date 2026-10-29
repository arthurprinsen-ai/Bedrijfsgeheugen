# Janitor ruimt squash-gemergde branches PR-gestuurd op (2026-10-29)

Na PR #5066 liep de Janitor één pagina van 50 branches per run; de eerste run trof een pagina zonder kandidaat. De Janitor loopt nu ook 5 pagina's van 100 gesloten PR's per run en verwijdert alleen branches waarvan een gemergde PR naar main exact dezelfde head-sha had, maximaal 150 per run. Nooit main, archive/, release/, hotfix/, open-PR-branches of beschermde refs. Verwijderingen staan als DELETE_BRANCH in het bewijs en worden teruggelezen.
