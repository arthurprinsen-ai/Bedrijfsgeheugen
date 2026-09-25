# Static i18n cache authority delta — 25 September 2026

## Incident

The production English cache had been promoted to immutable release authority, but the authoritative config cache still lacked 126 source strings from the current public corpus.

The missing delta consisted of:
- 119 strings from the AI ecosystem page and homepage;
- 7 previously generated money-page strings that still lived only in a mutable build-cache patch.

At the same time, three older tests still described the previous provider-dependent production model.

## Repair

- add all 126 missing translations as a versioned patch under `config/bg-static-i18n-en.d/`;
- keep production on `STATIC_I18N_NETWORK=0`;
- keep `STATIC_I18N_REQUIRE_CACHE=1`;
- update stale tests to the immutable-cache contract;
- preserve provider translation only as an explicit non-default fill path.

## Permanent rule

Public-copy changes and their English cache delta must land in the same protected lineage. A cache advertised as production authority is not complete until `--validate-cache` is green on the exact candidate.
