# Ontwikkelledger — Main Write Integrity issue API shape

- Datum: 2026-10-23
- Canonieke P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3191
- Hergebruik: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4657
- Fingerprint: `delivery|main-write|unverifiable-pr-association-v1`
- Eigenaar / obligation: `delivery|main-write|issue-json-shape-failclosed|20261023-v1`
- Bestaande executor: `.github/workflows/main-write-integrity.yml` op main-push; géén nieuwe scheduler
- Onafhankelijk providerbewijs: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4762, exact merge SHA `03bf825a6f4207df397f045ba0a3630faef34170`
- Waargenomen fout: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39940563356, tijdelijke commit-associatie onbeschikbaar en issue-listing parserfout
- Kandidaat: verifieer array/object-vorm van providerissues vóór matching/upsert; faal gesloten op onbekende providerdata
- Tests: `tests/brain-main-write-integrity.test.mjs`
- Risicobeheersing: echte unauthorized writes nooit als governed certificeren; geen duplicate issue of direct main-mutatie; autoritatieve platformchecks behouden
- Status: `CANDIDATE_NOT_LIVE`; volgende exacte-commit CI + eerste postmerge provider readback verplicht
