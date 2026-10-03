# Wet DBA static i18n cache recovery — 2026-10-03

Obligation: `static-i18n-wet-dba-cache-20261003-v1`

Observed failure:
- website preflight failed with `STATIC_I18N_CACHE_INCOMPLETE`;
- 66 missing translations originated from the newly published Wet DBA article;
- the broken shared baseline blocked unrelated website recovery work.

Closure:
- append-only English cache patch added for all 66 incident strings;
- executable historical replay added under the canonical `tests/brain-*` contract;
- root cause and prevention recorded in Brain learning;
- this obligation restores the baseline only and does not absorb the Platform-route obligation.
