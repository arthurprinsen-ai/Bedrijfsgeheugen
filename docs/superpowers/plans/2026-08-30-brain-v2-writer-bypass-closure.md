# BRAIN v2 writer bypass closure

Goal: ensure repository writers never mutate `main` directly and always hand an exact candidate PR to the existing BRAIN-DELIVERY-v2 path.

Checks:
- BG193 dispatches `candidate-pr` only.
- approved-central-blog has no direct-main delivery mode.
- workflow creates a candidate branch and PR only.
- repository regression test scans workflows for explicit `git push origin HEAD:main` bypasses.
- candidate PR must pass Unified Brain Delivery and normal gates.
- BG169 performs exact-head promotion.
- Netlify production and public proof are verified after merge.
