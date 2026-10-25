# Frisse Blik commercial metadata truth repair — 25 October 2026

- Root cause: `/frisse-blik` describes a commercial scan with a fixed price, while the head advertises a free scan and structured data provides an unsupported EUR 0 offer.
- Evidence: exact GitHub `frisse-blik.html` meta and JSON-LD, and separate free `/zelfscan` route on the public site. No human visitor complaint, outcome or quantified uplift claimed.
- Action: clarify the distinct commercial scan vs free selfscan, remove fabricated JSON-LD offer, preserve canonical links and lead path.
- Existing owner: main website Netlify publisher, no extra scheduler or tracking. Protected checks and independent production route source readback required.
- Guard: tests/brain-frisse-blik-commercial-price-truth-v1.test.mjs
