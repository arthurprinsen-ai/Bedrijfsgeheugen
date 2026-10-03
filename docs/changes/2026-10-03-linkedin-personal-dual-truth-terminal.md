# LinkedIn personal dual-truth terminal closure

The 3 October 2026 recovery exposed a final contract mismatch after the personal LinkedIn post had been restored. Edge Functions already supported two valid personal truth modes, but database artifact/obligation guards and the reconciler still assumed every personal post must be a first-person Arthur experience.

This change makes the contract consistent end to end. Personal LinkedIn may publish only when either:
1. a verified first-person Arthur experience is present; or
2. a verified, source-backed everyday-life observation is present with no first-person experience claim.

Both modes remain non-corporate and non-business. The observational review also stops treating consumer-tech terminology such as AI as automatically commercial when the post is clearly about daily life.

The reconciler now derives the canonical LinkedIn permalink from the exact provider URN, preventing a new provider post from inheriting the URL of an earlier rejected/deleted attempt.
