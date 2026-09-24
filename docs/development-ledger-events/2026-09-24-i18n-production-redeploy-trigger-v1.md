# 2026-09-24 — static English production redeploy trigger

This no-op operational marker retriggers the canonical Netlify production build after `STATIC_I18N_CONCURRENCY=1` was set for production build scope.

No application behavior changes in this commit. The active code is the provider-pacing fix from main commit `640fb4966fbf82aa811a7a1f4a1fecc7ab41fe69`.

Terminal proof requires:
- exact new main SHA on Netlify production;
- successful static English build;
- `/en/prijzen` visibly English;
- no `Switching language failed. Try again.` message.
