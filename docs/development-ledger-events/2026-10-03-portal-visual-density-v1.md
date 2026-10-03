# Portal visual-density regression closure — 2026-10-03

Obligation: `portal-visual-density-20261003-v1`

The portal visual-density defect was reproduced with browser screenshots, corrected in portal-v2, and verified against production at desktop, tablet and mobile sizes.

Evidence:
- 9 browser screenshots: Overview, CSRD & Impact and Data & AI × 1440×900, 1024×768 and 390×844.
- Production deploy `6ac0a94207c0820008381755` on commit `e65fe29d3693e1ce480e9ac90ce244ebcf266c40` contains the visual fix.
- CSRD world: 320px desktop/tablet; hidden on mobile.
- Score meter: 108px desktop/tablet; 88px mobile.
- Horizontal overflow: 0px in all nine live runs.
- Screenshot harness is classified in the portal delivery lane and has its own classification regression test.
