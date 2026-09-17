# Instagram final-image readback gate — CI closure

Status: LIVE & BEWEZEN
Fingerprint: `instagram-final-image-readback-gate-v1`
Date: 2026-09-17

## Incident
An Instagram feed post rendered partially gray. A 320×400 source asset had been technically accepted without complete final-image validation immediately before publication.

## Root cause
The Instagram image path validated generic final-visual evidence, placeholder state, Mira identity and exact asset URL, but did not fail closed on image-specific dimensions, MIME type, RGB color space, alpha, decode completeness, visual completeness and gray/empty detection.

## Permanent prevention
Instagram feed image publication must fail closed unless the exact final asset sent to Buffer is verified as all of the following:

- 1080×1350
- `image/jpeg`
- RGB
- no alpha
- fully decodable
- visually complete
- not gray or empty
- not placeholder content
- Mira identity matches the Instagram company channel
- exact final asset evidence matches the asset submitted to Buffer
- publish format verification is positive

The production gate, canonical contract and regression tests implementing this rule were merged in PR #1535. Merge SHA: `2f850e8e448b8e690693db4dbdb351e9a84aa2df`.

## Regression coverage
The regression suite covers at least: low resolution, PNG/non-JPEG, CMYK/non-RGB, alpha, incomplete/truncated decode, visually incomplete content, gray/empty content, unverified format, wrong final asset URL and a valid 1080×1350 RGB JPEG success case.

Targeted Buffer Social Learning suite: 43/43 passed.

## Broad required-check closure
The broad GitHub `Required test` workflow that was still queued/running at the earlier readback has now reached a terminal successful state:

- workflow: `Required test`
- run id: `34957135262`
- run number: `2788`
- PR head: `e9e50244e5b58d36a5de7f9e9867efebde4e8842`
- status: `completed`
- conclusion: `success`

Reusable engineering rule: a component-specific green suite is not sufficient to call repository closure complete while a broad required workflow is still queued or running. Required workflows must be read back independently to a terminal success state before full CI closure is claimed.

## Canonical Powerhouse learning
The existing canonical Supabase learning `instagram-final-image-readback-gate-v1` remains `PROVEN`, confidence `1.0`. Its evidence now also contains the successful broad `Required test` closure and the prevention rule above. This document is human-readable lineage; Supabase remains the canonical learning authority.

## Closed loop
Incident → root cause → RED regression → fail-closed gate → contract → GREEN tests → merge → main readback → Buffer outcome → canonical learning → broad Required-test terminal success → documentation.

No separate learning system, queue or parallel authority was introduced.
