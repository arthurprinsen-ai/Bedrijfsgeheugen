# 25 October 2026 — Evidence-backed Powerhouse blog reader quality

## Scope
The canonical Powerhouse blog publisher is strengthened rather than replaced. This is a website-lane recovery; it does not create another scheduler, send content or mutate customer data.

## Incident
PR #4848 produced the SEO heading “Publiceren voor: wat verandert er voor jou?” from a non-specific focus keyword; the FAQ schema combined source headings and paragraphs into question names, and the prose retained a forecast that applications would likely open on 6 October after that day had passed. Netlify preview success is not publication proof. Required and CodeQL were action_required with zero jobs.

## Correction
- Drop dangling editorial verb+preposition focus terms before choosing the real subject.
- Only explicit source-authored questions become FAQ structured data; no empty FAQPage.
- Reject a stale future-event date rather than falsely rewriting facts.
- Replay both positive and negative fixtures in a targeted source regression test.

## Merge and release contract
Use protected CI/CodeQL on the immutable head, independent exact-main readback, and the existing Powerhouse daily publisher and production audit. The pending 25 October blog must be corrected through its existing obligation, never forced live. Neither conversion nor revenue is considered proved by this PR alone.
