# Portal V2 experience assurance v2

Date: 2026-10-04  
Status: candidate protected delivery  
Obligation: `portal-v2-experience-assurance-v2`

## Change
The existing canonical Portal V2 experience layer remains the only UI authority. This successor hardens how that experience is measured and protected:

- dynamic charts and visuals are normalized after mount and resize;
- visual overflow emits a machine-readable experience signal;
- runtime errors/rejections emit the same Powerhouse signal family;
- legacy 40px mobile controls are overridden to real 44px targets;
- browser assurance expands to six critical routes and four viewports;
- 320px narrow-mobile is a first-class acceptance surface;
- every assurance run produces 24 screenshots plus metrics;
- the gate fails on horizontal overflow, visual overflow, missing v2 runtime or undersized critical controls.

## End-to-end contract
Frontend responsiveness is coupled to existing Portal State backend regression checks. Authentication and fail-closed write confirmation remain unchanged; this change does not introduce a second data authority.

## Release truth
The change is not production-complete until exact-head CI, visual assurance, preview, protected merge, production deploy and production readback are green.
