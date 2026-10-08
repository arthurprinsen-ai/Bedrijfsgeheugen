# Portal V2 — evidence-first top three daily priorities

## Change

The existing Company Cockpit now renders the top three NOW/NEXT decisions from the existing tenant-scoped Brain runtime. Priority ordering uses canonical ranks, never a new sample scoring system. Missing euro values and confidence remain unavailable, and approval/blocker status remains explicit. Existing decision actions are unchanged.

## Security and production truth

This change adds no tenant-global API, external provider operation, new scheduler, data store or unverified return-on-investment claim. HTML text is escaped; no data is fabricated when Brain has no recommendations. The candidate requires protected CI and authenticated portal production readback before it is considered delivered.
