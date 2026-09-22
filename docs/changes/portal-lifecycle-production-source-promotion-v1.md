# Portal lifecycle exact-source production promotion

The lifecycle-context feature was merged to main, while Netlify still exposed the previous exact source SHA. This change intentionally touches the existing canonical `Production Source Snapshot` workflow so the current main source is packaged and promoted through the authorized Netlify transport.

Success is not the merge itself. Success requires:
- exact current-main SHA on Netlify production;
- deploy state ready;
- Portal V2 production DOM readback green;
- Production Release Readback green;
- lifecycle context tests and Skill Projection green.
