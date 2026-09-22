# Business context feedback production promotion

The interactive **Bedrijfssituatie & context** workspace merged successfully, but production still pointed at the prior SHA. This change reuses the canonical Production Source Snapshot transport to deploy the exact current main source.

Required terminal proof:
- current main SHA equals Netlify production commit_ref;
- Netlify deploy state is ready;
- Portal V2 production DOM readback succeeds;
- Production Release Readback succeeds;
- Skill Projection and assurance remain green.
