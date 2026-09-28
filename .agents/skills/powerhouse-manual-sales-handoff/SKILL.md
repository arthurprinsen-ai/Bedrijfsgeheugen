# Skill: Powerhouse Manual Sales Handoff

Fingerprint: `powerhouse-manual-linkedin-dm-handoff-v1`

## Purpose
Keep human work to the irreducible last-mile action only. The human must never research, draft, invent an attachment or reconstruct context that Powerhouse already has.

## Contract
A manual LinkedIn DM card must contain:
1. recipient: person, role, company;
2. verified LinkedIn profile URL when available;
3. relationship state and score, with explicit “not verified” when needed;
4. why-now trigger;
5. estimated value, clearly labelled as potential;
6. final ready-to-send DM text;
7. attachment instruction;
8. the actual generated PDF when a PDF-class asset is selected;
9. controls for Sent, Later and Not relevant.

## Queue policy
- Only actions with `handmatig_nodig=true` appear in Arthur Actions.
- E-mail, posts, comments and other provider-executable actions are not pushed to Arthur.
- Manual actions rank before other suggested actions and then by commercial priority.
- No duplicate handoff for the same canonical action.
- Missing profile/connection evidence is displayed as unverified, never inferred.
- A missing PDF is a Powerhouse failure, not a user task: Powerhouse must generate it before asking Arthur to send.

## Outcome loop
After Sent: write `executed` into the canonical outcome path and return follow-up ownership to Powerhouse.
After Later: write `defer`.
After Not relevant: write `not_relevant` and respect suppression/fatigue rules.

## Runtime surfaces
- `public.bg_vandaag` = projection for Arthur Actions.
- `supabase/functions/bg-dagoverzicht` = authenticated list/outcome/PDF endpoint.
- `/intern/vandaag/` = mobile-first human handoff UI.
