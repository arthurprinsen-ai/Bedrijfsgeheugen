# Pricing ↔ Portal production drift recovery — 2026-09-23

## Problem
The canonical `main` branch already contained pricing ↔ Portal V2 parity, but the public `/prijzen` surface still returned an older production representation.

## Root cause
Repository state was treated as insufficiently separated from production state. The release chain did not finish with an exact-source Netlify production promotion plus public DOM readback for the material pricing surface.

## Recovery
PR #2651 forces a material `prijzen.html` change so the canonical Netlify pipeline must build the exact head. After merge, production must be read back from `https://www.bedrijfsgeheugen.nl/prijzen`.

## Prevention
A pricing change is only terminal when the public page proves the same lifecycle/business-context and entitlement claims present in canonical source. Main-only evidence is not LIVE_BEWEZEN.

## Evidence required
- lifecycle route layer visible publicly;
- “Je bedrijfsfase is niet je abonnement” visible publicly;
- Scale audittrail visible publicly;
- Control/Scale/Enterprise pricing and refresh limits aligned with canonical entitlements.
