# AFAS OCI test: origin-agnostic internal link — 2026-11-05

## Finding
After PR #5447 (`ec2f235`) the original BRAIN backend lane failed `existing price explainer supports AFAS money owner without duplicate landing page`. The blog page now links the AFAS-koppelingspagina with the absolute canonical origin; the test only accepted the relative path. Target and anchor text are unchanged.

## Change
The assertion accepts `https://www.bedrijfsgeheugen.nl/afas-koppeling` or `/afas-koppeling` with the same anchor. Canonical and OCI text assertions stay. No page or product change.

## Verification
AFAS tests 6 of 6 pass locally. Protected Required, CodeQL, original BRAIN and terminal closure remain the independent gates. Proves no ranking or customer outcome.

## Open
The required PR check does not run this backend-lane test, so SEO PRs can turn main red after merge. Pulling backend-lane tests that touch a changed page into the PR check is a separate decision.
