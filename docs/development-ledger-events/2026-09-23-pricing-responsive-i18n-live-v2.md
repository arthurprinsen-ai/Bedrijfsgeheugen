# 2026-09-23 — pricing responsive + i18n live recovery v2

Production evidence showed that rendering the pricing controls was not sufficient: interaction could be lost after runtime DOM replacement because the rescue controller did not re-synchronize the replacement nodes. The English switch also remained fragile because production generated fallback English routes with static translation network access disabled, leaving final translation to a client-side API call.

Root cause remediation is now one lineage: the pricing controller delegates click, touchend and keyboard activation, initializes on already-loaded documents, observes child-list replacement, re-applies state after replacement, and exposes a runtime-ready marker. The pricing asset query version is bumped to prevent stale mobile caches. Production builds static English routes with network translation enabled; deploy previews remain offline and deterministic.

Prevention evidence is encoded in the pricing interaction regression test and the deterministic i18n release-contract test. Preview, merge, production deployment and public readback remain required before terminal closure.
