# Instagram Mira visual/reel only hard gate v2

Incident: on 20 September 2026 Instagram showed a generic text-led Bedrijfsgeheugen creative instead of a real Mira visual or Reel.

## Hard rule

Instagram has only two valid final formats:
- image: an OpenArt Mira visual at 1080x1350;
- reel: a newly generated OpenArt Mira Reel at 1080x1920.

Every final asset must prove through vision that Mira is visibly present, is the central subject, appears in a genuine daily-life scene, and that the creative is neither text-dominant nor brand-template-dominant. Generic Bedrijfsgeheugen cards, quote cards, spreadsheet/file-name cards, carousels and generic video are blocked fail-closed.

## Enforcement surfaces

The same rule is enforced in the channel contract, JavaScript identity gate, Supabase media verifier, media router, social publisher and a database trigger. Transport acceptance cannot override identity proof.

Fingerprint: instagram-mira-visual-reel-only-v2
Obligation: instagram-mira-visual-reel-only-v2
