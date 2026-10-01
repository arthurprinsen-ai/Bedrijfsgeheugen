# Final visual pixel polish

The last website coherence pass now includes an explicit responsive geometry contract.

Pricing cards keep equal CTA bottoms and fixed CTA height, the public header uses consistent desktop/tablet/mobile heights, empty shells cannot create duplicate whitespace, and Portal V2 visual models are constrained to their cards at the 1180px, 900px and 640px breakpoints.

Regression coverage lives in `tests/brain-website-coherence-v1.test.mjs`.
