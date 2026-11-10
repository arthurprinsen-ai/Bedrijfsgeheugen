# Bedrijfsgeheugen — The Living Company / Decision World
Date: 2026-11-10
Original product owner: Portal V2 Living Interface #4547 (same canonical Portal V2 route)
Candidate: portal|living-company|dashboard-first-instead-of-evidence-first-journey|20261110-v1
Release state: CANDIDATE / production evidence due

## Problem
The entrepreneur still sees many technical modules and a textual five-step process.
They need to understand, in less than one minute, (a) where they want the company
to go, (b) which part is proven, (c) what remains unknown, (d) the next decision.
Static KPIs, a generic chatbot or decorative motion cannot deliver that experience.

## Design thesis
Turn the portal into a living, personalized company experience, not a
management software menu. The company is at the centre; the five evidence
states orbit it. Tap a stage to discover the real story in natural language:
Startpunt, Richting, Inzicht, Besluit, Effect. The existing single primary
action remains immediately above the visualization, and all deeper modules
stay inside the original disclosure.

The first vertical slice is portal-v2/decision-world.js plus component CSS
rendered by the ORIGINAL authenticated entrepreneur-home.js.
No route changes, no new advisor, no second state authority or scheduler.
Native buttons support touch, keyboard, arrow keys, Home and End; status text
uses an accessible live readout and textContent, never untrusted HTML.
The module is read-only. Selection is ephemeral UI state and reset on
principal change. No customer data is written or cached.

## Distinct proofs (not a progress score)
- Nulmeting gekoppeld: self-reported scan linked, NOT audited financial KPI.
- Doel vastgelegd: preference saved, NOT a realized objective.
- Bronbewijs aanwezig: verified source under original projection.
- Voorstel onderbouwd: supporting proposal, NOT approved or executed.
- Effect geverifieerd: original outcome contract has proof, NOT revenue.

Do not display a combined health score. Guest/demo gets no company map.
Missing, stale, malformed or unverified evidence never becomes a success
badge or numerical zero. Tenant auth, RLS, policies unchanged.

## Product roadmap — original owner, one experience
1. Living Company map (this change): real customer evidence, one action.
2. Decision Twin: adjustable scenarios with explicit assumptions,
   reversible hypothesis and uncertainty — reuse original Winstnavigator.
3. Company Memory: human-readable provenance for why a decision was taken,
   by whom, based on which allowed evidence, measured later via Brain.
4. Company Theatre: external changes mapped to the specific company,
   not generic news; every proposed action is reviewable and revocable.
5. Learning: verified outcomes inform subsequent decisions in ONE Powerhouse.

## Award preparation: Red Dot 2027 — not an award claim
Intended categories: Interface & User Experience Design and Digital Solutions,
potentially Websites/Apps subject to current entry rules. The 2026 registration
is closed; verify 2027 eligibility, deadlines and fees. Independent jury decides.

Acceptance targets, not measured results:
- At least 90% uncoached task completion: goal, evidence, action, proof.
- SUS >=85 and at least five real uncoached entrepreneurs with baseline.
- WCAG 2.2 AA, iOS VoiceOver, Android TalkBack, keyboard, 200% zoom.
- 320, 375, 390, 430, 768, 1024 and 1440 px, multiple orientations.
- LCP p75 <=2.5s, INP p75 <=200ms, CLS p75 <=0.1.
- Authorized two-tenant isolation; no stale claims or cross-tenant leak.
- Median first useful decision under 60 seconds; measure actual baseline.
- No gratuitous animation; reduced motion respected.

## Release evidence
This branch is NOT production. Require the original Candidate-Type
implementation gate, exact-head Required, CodeQL and BRAIN; real browser
a11y and responsive checks; approved protected merge; Netlify published
production SHA match; independent authenticated tenant DOM and data proof.
On failure log in the ORIGINAL Brain lineage with owner, root cause, regression
and preventive check. Never bypass governance or mark unproven items green.
