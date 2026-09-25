# Versioned static English translation cache — 25 september 2026

## Incident
The exact-main Netlify production build reached the provider successfully after the deploy-bridge credential was repaired, but the build still failed with exit code 2. The same source had already built successfully as a deploy preview.

The decisive environment difference was static i18n: deploy previews use `STATIC_I18N_NETWORK=0`, while production uses `STATIC_I18N_NETWORK=1` and therefore depended on live translation-provider calls during every deployment.

## Root cause
English localization had no versioned translation cache in the repository. Even unchanged public copy therefore made production availability depend on an external translation provider.

## Fix
- generated a complete English translation cache for the exact current public corpus;
- coverage: 94 public HTML files, 7,707 unique translatable source strings, zero missing entries;
- added `--validate-cache` mode to the canonical localized-route builder;
- added an executable regression that fails when current public source strings are not covered;
- kept the existing fail-closed production guards intact;
- triggered the canonical Production Source Snapshot in the same lineage.

The provider remains available only as a fill path for genuinely new uncached source strings. Unchanged deployments no longer require a live translation call.

## Safety
This does not permit untranslated English routes. Cache incompleteness and production provider failure remain fatal.
