# Pricing-shell build memory segmentation — 25 September 2026

The production build for the pricing interaction runtime fix reached Netlify but failed during the custom build command with exit code 2. A local reproduction with the repository build chain reached `tools/prijzen-uit-de-homepage.mjs` after the heavy V18 transforms and the Node process was killed before the remaining stages completed.

The pricing-shell CLI previously performed three substantial responsibilities in one long-lived process:

1. rewrite pricing references;
2. normalize the complete site and apply SEO/homepage policies;
3. run final shell/navigation/sitemap/SEO verification.

The repair keeps those exact stages and their order, but when the command is invoked in its normal `all` mode it spawns a fresh Node process for each stage. Memory and loaded module state are therefore released between phases. Focused `BG_PRICING_STAGE=rewrite|normalize|verify` execution remains unchanged.

A child-stage non-zero exit or signal fails the parent command. This is resource isolation, not a fail-open build shortcut. Production still must pass exact Netlify SHA, pricing content and browser-level lifecycle/plan/billing/NL↔EN proof.
