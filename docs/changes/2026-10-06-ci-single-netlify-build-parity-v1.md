# CI single Netlify build parity v1

This change removes one unconditional duplicate Netlify production build from the protected pull-request critical path without weakening exact-HEAD or production parity.

Before this change, `Required test` ran an exact production build inside serial preflight, and the website reusable lane ran essentially the same production build again in `netlify-build-parity`. The first build also delayed backend, portal, automation and website lane startup because it lived inside preflight.

The new topology keeps one canonical `netlify_build_parity` job in `Required test`. It starts after classification and runs in parallel with the selected domain lanes. The protected aggregate `test` context still fails closed when parity is required and that job does not succeed.

The website lane keeps exact preview/browser verification and its local fallback, but no longer owns a second unconditional production parity build. This preserves Netlify-function-only coverage because the central parity job is driven by the existing `netlify_build_required` classifier rather than by the website lane alone.
