# Pricing Portal parity — production promotion

The pricing/Portal parity feature was merged, but the current Netlify production deploy still identified the previous main SHA.

This promotion deliberately refreshes the canonical Production Source Snapshot workflow so the exact current repository source is packaged and transported to Netlify production.

Terminal proof requires:
- exact current main SHA;
- Netlify production ready on that exact SHA;
- production pricing/content readback;
- production backend/readback for the checkout change.
