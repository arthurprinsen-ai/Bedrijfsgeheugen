---
name: personal-linkedin-life-only
description: Enforce Arthur's personal LinkedIn as a strictly personal-life channel and route all business topics to the company page.
---

# Personal LinkedIn — personal life only

Fingerprint: `personal-linkedin-personal-life-only-v1`.

## Hard rule

Arthur's personal LinkedIn is exclusively for personal life and lived personal observations. It must not contain company, client, MKB, consultancy, assignment, business-process, organizational AI/digitalization, Bedrijfsgeheugen, sales, lead, offer, case, thought-leadership or business-lesson content.

A personal anecdote may never be used as a wrapper or bridge to a business message.

## Allowed source worlds

Family and parenting; children and school; hockey/sport; travel/holiday; car/transport; home/garden; consumer technology; shopping/daily services; family/generations; leisure; daily routines/frustrations; ordinary human observations.

## Source rules

External trends, search data, forums or news may suggest personal themes but may never invent an Arthur experience. First-person claims require verified personal source lineage.

## Fail-closed publication gate

Before publication require:
- exact personal channel identity;
- verified first-person source;
- concrete lived personal event in final copy;
- `personalLifeOnlyVerified=true`;
- no business/corporate/consultant signal;
- no forced business moral;
- copy not interchangeable with the company page.

Business exceptions are not allowed. If a topic is business-oriented, route it to LinkedIn company or rewrite from a genuinely personal topic.

## Learning

Keep personal-profile performance separate from company-page performance. Optimize personal LinkedIn for recognition, humor, conversation and personal engagement, not commercial conversion.


## Provider capability proof (2026-09-22)

Fingerprint: `linkedin-composio-capability-proof-v1`.

- A LinkedIn connection in an external dashboard is not sufficient publication evidence. Powerhouse must read the active provider connection itself.
- Personal posting identity must be resolved through the authenticated LinkedIn member identity before any provider side effect.
- Company-page posting capability must be proven separately from personal capability; do not infer organization permissions from a personal connection.
- Capability discovery is read-only and runs before the canonical social publisher. The publisher remains the sole writer and all existing personal-truth, daily-channel and dedupe gates remain mandatory.


## Personal source rotation no-gap rule (2026-09-27)

Fingerprint: `personal-source-rotation-no-gap-v1`.

Personal LinkedIn may never invent a daily-life event merely to satisfy a publishing cadence. If today's verified source pool is empty:
- first use an unused verified non-sensitive personal source;
- if all verified sources have been used before, select the least-recently-used verified non-sensitive source;
- generate a fully new angle and wording from that factual source;
- verbatim reuse, copied sentences, new facts, business bridges and management morals remain forbidden;
- global final-text/story dedupe still applies;
- the fallback remains a personal-life post, never company-page content.

This rotation prevents an exhausted source pool from silently turning the daily channel into `PERSONAL_TRUTH_SOURCE_UNVERIFIED` while preserving truth and uniqueness.

## Concrete subject / example reuse is forbidden (2026-09-28)

Fingerprint: `personal-linkedin-semantic-example-uniqueness-v1`.

A personal post may not reuse an underlying concrete subject, incident, example, anecdote or story family that has already been published, even when the wording, hook, conclusion or source text is different.

Hard rules:
- historical uniqueness is semantic, not merely textual;
- a previously published concrete example is permanently consumed for personal LinkedIn;
- when a candidate overlaps a previously used story family, discard it and select a genuinely different verified personal source;
- never rotate back to a least-recently-used source once it has been published;
- if the verified unused source pool is exhausted, do not recycle old examples to satisfy cadence; source a different verified personal-life event first;
- changing synonyms, structure, CTA, tone or lesson never makes the same example new;
- the known `printer` story family is consumed and must not be published again.

This rule is stricter than text-hash/shingle dedupe and overrides the older rotation wording wherever that could be read as allowing reuse of a previously published source.



## Source-backed topic selection — 2026-09-29
Fingerprint: `powerhouse-source-backed-all-channels-v1`.

Public daily-life/friction evidence may determine which personal-life topic is worth writing about, but it is never proof that Arthur personally experienced it. First-person claims still require verified Arthur source truth. If no verified personal anchor exists, write observationally without inventing experience, or hold the item. Always retain source lineage, dedupe historically, and write engagement/inbound outcomes back to the source/problem/angle.

## Personal LinkedIn story-family overlap guard v2 (2026-09-30)

Fingerprint: `personal-linkedin-story-family-overlap-v2`.

A verified personal source can be factually true and still be ineligible because its underlying story was already consumed. For personal LinkedIn:
- a published anecdote is permanently consumed as a story family;
- source rotation may never return to an already-published anecdote;
- same objects + same event + same lived sequence + same conclusion/routine count as the same story even when phrasing is new;
- the database story-family overlap gate is mandatory before provider write;
- on `STORY_FAMILY_DUPLICATE`, choose a different verified personal event rather than paraphrasing.

Canonical regression family now also includes the car incident: broken electric sliding door, warm airco, manual door/windows-open workaround and adaptation to the new routine.
