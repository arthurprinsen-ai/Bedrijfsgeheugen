# Development ledger — BG169 backend drift recovery, 23-11-2026

- Incident: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198)
- Originele release-executor: BG169, run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45142550416
- Exacte upstream kandidaat: [PR #6119](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6119), `e0bcb3d7c0a54329e7726ac4ac0266cc7a1732df`
- Eerste echte mislukte backend-tests: provider888 historisch aantal 888/886; oude brand-shell-workflow stringaannames; verboden type-only jsr-import in bestaande db-pooler Edge function
- Eigenaar: bestaande Engineering Agent / oorspronkelijke beschermde GitHub release lane, niet een parallelle publisher
- Deze kandidaat: drie minimale broncorrecties, drie preventie- en learning-artifacts, geen wijziging aan canonieke social-/blogposts, contractchecks of live database
- Veiligheid: oorspronkelijk service-authorisatiepad, afhankelijkheidsversies, RLS, validatie, verplichte CodeQL/Required, BG169 en mergeprotocollen blijven ongewijzigd
- Verificatietoestand bij vastleggen: `CODE_CANDIDATE_NOT_LIVE`, alle echte CI en productie-readback opnieuw vereist
