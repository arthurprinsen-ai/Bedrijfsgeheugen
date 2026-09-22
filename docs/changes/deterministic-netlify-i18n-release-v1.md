# Deterministic i18n release build

Netlify release builds may not generate translations over the network. The previous contract allowed the production build to discover missing static strings and call Anthropic whenever `ANTHROPIC_API_KEY` was available in build scope. That made the deployment nondeterministic and different from GitHub CI.

The release contract now defaults to offline behavior. `STATIC_I18N_NETWORK=1` is required explicitly for a translation-generation job; Netlify pins `STATIC_I18N_NETWORK=0`. The public runtime translator remains available for interactive language switching, but a deploy itself cannot depend on a remote AI translation request.

Definition of done: regression test green, protected merge, Netlify production build ready, exact `release.json` identity, and public pricing/homepage readback.
