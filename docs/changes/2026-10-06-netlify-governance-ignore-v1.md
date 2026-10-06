# Netlify governance-only build skip v1

`site/website-release-risk.json` is delivery/CI policy, not a production website artifact. The Netlify pre-build ignore gate now treats that exact file as governance-only.

This prevents a full Netlify production build when a change only adjusts website release classification. Runtime sources such as `netlify.toml`, public HTML, assets, generated site code and functions remain build-triggering.

Regression coverage: `tests/brain-netlify-governance-ignore-v1.test.mjs`.
