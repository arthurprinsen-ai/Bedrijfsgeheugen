# System-map governance non-deployment classification — 29 September 2026

A repository-native borging update changed the canonical system map and was incorrectly routed into website production delivery because the system map is a `.mjs` source file.

The system map is governance authority, not a website runtime artifact. Delivery classification now treats `platform/system-map/canonical-system-map.mjs` as non-executable shared governance. Production Source Snapshot also ignores this file and the Brain delivery control-plane source on push.

The production safety contract is unchanged: real website, portal, Netlify runtime and public-content changes still require their normal production gates. Governance-only system-map updates can close through protected main plus explicit non-deployment readback.
