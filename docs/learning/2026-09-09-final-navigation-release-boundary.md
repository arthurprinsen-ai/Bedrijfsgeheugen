# Production learning — final navigation release boundary

Date: 2026-09-09
Status: production verified
Scope: website shell / Kennisbank and Blog navigation

## Outcome

The final navigation hotfix is merged and deployed to production.

- Pull request: #1259 — `Hotfix final navigation at true release boundary`
- Production commit: `d037bb2abbc055e6e19bc231437f2fb1fa61e427`
- Netlify production deploy: `6aa0ec459eea4a0008afc368`
- Netlify context: `production`
- Netlify branch: `main`
- Netlify state: `ready`
- Published at: `2026-09-09T05:19:40.958Z`
- Production URL: `https://www.bedrijfsgeheugen.nl`

## Incident

A previous release introduced a final site-navigation contract intended to keep Kennisbank and Blog as separate destinations. The deployed homepage nevertheless still exposed `Kennis` as `/blog/`.

The earlier finalizer was not actually the last HTML writer in the production build. `tools/bouw-release-evidence.mjs` executed afterwards and still performed a final HTML transformation. That meant a valid earlier artifact could be mutated again before publication.

## Root cause

The release contract was attached to an intermediate build boundary instead of the true release boundary.

The invariant that matters is not “the navigation was correct after generator X”, but “the deployable HTML is correct after every writer has finished and immediately before release evidence is emitted”.

## Fix

The navigation finalizer now executes after the last release HTML transformation in `tools/bouw-release-evidence.mjs`, before `release.json` is written.

The delivery classifier explicitly classifies `tools/bouw-release-evidence.mjs` as part of the website delivery path and the `website-shell-contract`; no wildcard or gate weakening was introduced.

A regression assertion requires the final navigation contract to execute after the last HTML transformer.

## Release evidence

Exact candidate SHA before merge: `9805dcaf2712cc88498935bf2d29025ec06ab4f0`.

On that exact SHA the following completed successfully:

- Required test #1869
- delivery preflight and classifier
- backend lane
- portal lane
- automation lane
- website syntax preflight
- exact Netlify website artifact build / page-SEO
- static website contracts
- baseline release-risk contracts
- deploy-preview readiness
- affected routes on desktop and mobile
- all public pages visibly rendered
- BRAIN delivery
- canonical brand shell contract
- canonical brand shell full build
- canonical brand shell live readback
- V18 Production Promotion
- Learning Contract Delivery Classifier Tests
- SEO growth intelligence

After merge, `main` resolved to production commit `d037bb2abbc055e6e19bc231437f2fb1fa61e427` and Netlify current production deploy `6aa0ec459eea4a0008afc368` reported the same exact `commit_ref`, `branch=main`, `context=production`, `state=ready`, with no deploy error.

## Permanent rule

For generated deployable website HTML:

1. A release invariant must be enforced at the true final output boundary, after all HTML writers and transformers.
2. Release evidence must never mutate deployable HTML after final contract validation.
3. If a new late-stage writer is introduced, the final-output contract must remain after it or the build must fail.
4. Production may only be called live after exact-SHA deployment evidence and production readback, not merely because a deploy reports `ready`.
5. Kennisbank and Blog remain separate destinations: Kennisbank `/kennis/`, Blog `/blog/`; a silent Kennis→Blog collapse is a release failure.
6. Do not weaken Required, browser, page/SEO, classifier, or BRAIN gates to obtain a release.

## BRAIN writeback

This learning is encoded both operationally and structurally:

- final-output navigation enforcement is in the production build path;
- regression coverage protects ordering relative to the last transformer;
- the delivery classifier now knows the release-evidence writer belongs to the website shell contract;
- this document preserves the incident, proof, and reusable release principle for future agents and maintainers.
