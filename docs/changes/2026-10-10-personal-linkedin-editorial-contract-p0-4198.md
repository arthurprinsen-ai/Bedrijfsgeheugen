# Personal LinkedIn — hard editorial contract after 2026-10-10 violation

## Ground truth
The published 10 October personal post has literal Markdown headings and horizontal rules, an unverified public statistic and a long technical status report. The original artifact recorded `final_copy_approved:false` despite passing existing identity/provider routing.

Notion canonical references:
- [Personal LinkedIn skill](https://app.notion.com/p/3e1da36aac8a818686c7cc61ff52d7f2)
- [Personal profile rules](https://app.notion.com/p/3b9da36aac8a81779e00ffecaa340fd5)

## Repair
One pure shared editorial validator `personal-linkedin-founder-editorial-v3` is invoked after final body generation and before final SHA, within the identity reviewer and a final defense-in-depth check inside the existing social publisher **before** capability issue/reserve/provider side effects.

Human requirements: 130–200 words, plain text, no Markdown or link, no promotional CTA or emojis, no internal technical status reports, verified exact external sources for statistics, authentic first-person founder perspective and one natural open question. Pure personal-life/observational modes retain their existing identity proof requirements; the shared format/claim constraints still apply.

Both primary Anthropic and permitted fallback receive the same system guidance. The generator sets final_copy_approved true with exact editorial policy version only if the canonical approved artifact passes; the reviewer and publisher both require these fields plus independent validation. Existing daily executor, identity safety, dedupe and write authority are not weakened.

## Public post
The existing LinkedIn URN must not be reposted as a new post. A provider-side in-place edit is a separate operation, supported only with provider-approved edit tooling and external readback. No claim of an edit without the provider receipt.

## Validation
`tests/brain-personal-linkedin-editorial-contract-p0-4198.test.mjs`, protected GitHub CI, exact production Edge source parity, replay of the original failing post through the reviewer (must block without publishing), replay of a compliant founder text through reviewer (must pass with correct source and identity), and daily next-post provider evidence. Full existing P0 #4198 remains open for other commercial requirements.
