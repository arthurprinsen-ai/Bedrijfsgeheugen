# Test prototype page recovery — 2026-08-29

## Incident
Production preserved many legacy HTML files but lost the page-like information architecture that users had accepted in the Netlify test prototype. The V18.6/V18.8 prototype implemented primary website sections as in-document interactive views rather than standalone routes. Production promotion treated the prototype primarily as a homepage/runtime source, so those accepted views were not promoted as equivalent production pages.

## Verified source
- PR #110
- head SHA `5a8cc121691200231f9b7a00eed5fdcff9764678`
- file `prototype-v18-6.html`
- accepted views: Problemen, Oplossingen, Platform, Prijzen, Cases, Kennis, Over ons, Frisse Blik, Inloggen, Aanmelden.

## Root cause
Semantic/UI acceptance was attached to a prototype artifact instead of a route-level website baseline. File-presence and SEO checks therefore stayed green while accepted page experiences disappeared.

## Recovery
The accepted test views Problemen, Oplossingen, Prijzen, Cases and Kennis are restored as real routes. Over ons is restored to the test-prototype semantics (`Ons geloof`, `Ons verhaal`, `Onze missie`, `Van chaos naar grip en controle`). The accepted baseline and navigation catalog now point at the PR #110 test source.

## Permanent invariant
A production promotion may not collapse, omit or replace an accepted test/prototype view merely because the underlying repository still contains other HTML pages. Accepted information architecture is a first-class release contract. Every accepted primary view must resolve to a real production route or an explicitly accepted equivalent. Unexpected semantic or route drift is RED and must restore the last-known-good accepted experience before promotion.
