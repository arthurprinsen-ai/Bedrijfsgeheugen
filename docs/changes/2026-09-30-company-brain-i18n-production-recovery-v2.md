# Company Brain i18n production recovery v2

Current main still failed the fail-closed English production build because 11 Company Brain fragments generated after shell/build transformation were absent as exact cache keys. This recovery applies those exact translations on the latest main epoch and preserves the hard STATIC_I18N_REQUIRE_CACHE gate.

The recovery supersedes stale PR #3429 and unblocks production delivery of the already merged AI Modelwijzer Falcon expansion (110 models / 11 providers).
