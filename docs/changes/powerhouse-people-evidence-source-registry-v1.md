# Powerhouse People Evidence Source Registry v1

Date: 2026-09-24
Fingerprint: `powerhouse-people-evidence-source-registry-v1`

## Change
Adds a machine-readable, provenance-preserving external evidence registry for `PH-P031` through `PH-P040` and binds the people detection contract to it.

## Why
The People Problem Radar already knew that CBS/UWV/TNO/sector evidence was context, but source identity, applicability, freshness and legal status were not canonical machine-readable state. That allowed future content/cockpit implementations to drift or accidentally present policy proposals as current law.

## Permanent prevention
- every external source declares publisher, URL, applicable Problem IDs and evidence role;
- current claims require source freshness/status verification;
- policy proposals remain explicitly non-current until verified in force;
- external evidence cannot upgrade a tenant hypothesis to fact;
- provenance is reusable by cockpit evidence drawers, content and opportunity intelligence.
