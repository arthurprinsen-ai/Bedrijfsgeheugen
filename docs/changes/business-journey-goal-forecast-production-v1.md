# Business journey forecast production promotion

The Journey/Goals/Forecast cockpit is merged. This recovery lineage refreshes the existing canonical Production Source Snapshot transport because production still pointed at the previous main SHA.

Terminal proof requires:
- current main SHA equals the promoted Netlify production commit;
- Netlify deploy state is ready;
- Production Release Readback is green;
- Portal V2 production readback is green;
- Powerhouse Skill Projection and core gates are green.

This does not introduce a second deployment mechanism.
