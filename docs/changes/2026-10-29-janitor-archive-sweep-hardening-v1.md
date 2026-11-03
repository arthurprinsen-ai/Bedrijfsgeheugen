# Archive-sweep krijgt tijdbudget en circuit breaker (2026-10-29)

De eerste Janitor-run met de archive-sweep faalde bij elke tag-aanmaak en liep door de pogingen in de timeout. Er is niets verwijderd. De sweep logt nu de echte foutmelding, stopt na 3 mislukte archiveringen op rij, heeft een budget van 360 seconden en draait onder `timeout 420`. Branches met bewaarde PR-head worden gewoon verder opgeruimd.
