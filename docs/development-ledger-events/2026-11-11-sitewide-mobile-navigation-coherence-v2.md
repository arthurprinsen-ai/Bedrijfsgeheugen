# User screenshot regression / single navigation 2026-11-11
Parent: PR #5613 SHA acd84d42b58da6dd8de95f93fa8aba82f8e4b467. New iPhone screenshots showed extra floating close button, exposed background strip, off-axis header/menu sheet and obscuring WhatsApp. Original pass asserted only aria and toggle, not mobile geometry.

Root cause: V18/legacy mobile header position and a second close control, with a fixed menu affected by ancestor coordinate systems.

Recovery: retain original menu engines; move mobile menu sheet to body; fix header during open; align full-width menu beneath measured header; remove duplicate close control; suppress floating WhatsApp and non-essential mobile ticker; reduce duplicate-hamburger visual confusion; maintain hero touch target.

Proof: existing website lane browser asserts 320/390px viewport geometry, header adjacency, no side gaps, no secondary close, real touch/keyboard and /product route. No portal/auth changes, no bypass. Exact Netlify READY/main SHA and independent readback mandatory before marking LIVE.
