# LinkedIn-lus: onderpresterende post → data-gedreven volgend experiment → meting → leerregel — 28 oktober 2026

**Probleem (Supabase-readback):** LinkedIn-bedrijfsposts halen 1–19 vertoningen en 0 likes/reacties; `social_learning_applications` en `social_learning_decisions` waren leeg; alle bedrijfsposts hadden dezelfde CTA, dus er was niets te leren; de challenger bestond alleen voor bedrijf/Instagram, vereiste data die er niet is en viel terug op een datum-rotatie.

**Wijziging:** drie service_role-only databasefuncties (`bg_social_lus_cyclus`, `_beoordelen`, `_meting`) en de tabel `bg_linkedin_bewijs` (bewijs met bron-URL en datum). De bestaande `powerhouse-content-orchestrator` roept per run `bg_social_lus_cyclus` aan voor `linkedin_company` en `linkedin_personal`:
1. beoordeelt verlopen experimenten (voor/na tegen eigen 28-daagse mediaan, min. 2 gemeten posts, één verlenging) en schrijft de uitkomst naar `revenue_learnings`, `social_learning_decisions` en `social_learning_applications`;
2. kiest één variabele uit de dimensie met de minste variatie in de laatste 10 posts, slaat recent verworpen waarden over en geeft voorrang aan bevestigde of onderbouwde waarden;
3. legt het experiment vast in `social_experiments` (`recipe.soort = linkedin_lus`, zonder `onderdeel`/`pagina`/`advies`, dus onzichtbaar voor de CRO-poorten) en geeft de generator één instructie mee, met de bestaande persoonlijke/bedrijfsregels onverkort.

**Niet gewijzigd:** geen nieuwe scheduler of agentregister; personal identiteits-/redactiepoorten, publicatie, bronverificatie en de bestaande measured-challenger blijven.

**Eerlijke grenzen:** voor/na-vergelijking zonder controlegroep en met kleine steekproef is exploratief, geen causaal bewijs. Bedrijfsanalytics (Windsor) en persoonlijke views blijven meetgaten. De wekelijkse externe bewijsverversing is nog niet geautomatiseerd.

**Acceptatie:** `tests/brain-linkedin-underperformance-loop-20261028.test.mjs`; lokaal doorgerekend op een in-memory Postgres (nieuw experiment → herhaling idempotent → beoordeling → leerregel PROMOTED → volgend experiment; personal zonder meting). Productie-readback en daadwerkelijk bereik/likes/reacties: nog niet bewezen.
