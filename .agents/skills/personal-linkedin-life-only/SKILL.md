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



## Daily creative novelty loop — Powerhouse/Brain owner (2026-09-29)

Fingerprint: `personal-linkedin-daily-creative-loop-v1`.

Powerhouse/Brain owns the daily personal-LinkedIn subject choice. Arthur must not have to supply a topic every day.

Canonical loop:
`SCAN -> CANDIDATES -> SEMANTIC DEDUPE/FATIGUE -> RANK -> TRUTH/PRIVACY/IDENTITY -> GENERATE -> FINAL DUPLICATE GATE -> PUBLISH -> PROVIDER ACK/READBACK -> 24h/72h/7d OUTCOME -> LEARN -> NEXT-DAY DECISION`.

Mandatory behavior:
- scan broad, recognizable everyday human friction before choosing a subject: apps, WhatsApp/group-chat chaos, notifications, logins/passwords, customer service, subscriptions, parking/traffic, shopping/delivery, school/sport apps, calendars, forms, QR/tickets, household devices, digital-government friction, smart-device absurdity, updates/cookies, family logistics, social awkwardness and newly discovered daily-life categories;
- generate multiple materially different candidates; never select the first plausible idea by default;
- score candidates on recognition, freshness, concreteness, human detail, dry humor, conversational potential and historical distance from earlier story families;
- apply a strong topic-fatigue penalty and reserve exploration capacity for genuinely new categories;
- historical uniqueness is semantic across dates: same underlying situation, conflict, gag, example, subject or moral is consumed even when rewritten;
- no listicle/generic “technology is difficult” filler and no business bridge, consultant lesson, sales CTA or Bedrijfsgeheugen reference;
- first-person events require verified personal evidence; when only an observation/opinion is evidenced, write it as an observation/opinion and never invent an event;
- after a provider create returns a durable external ID/URN, immediately consume the story family for future dedupe even if later readback is permission-limited;
- persist topic family, angle, content fingerprint, novelty/fatigue decision, selection reason, provider identity, outcome windows and learning in the canonical Brain lineage;
- learn component-wise from hook, length, humor, opening, question and category at 24h/72h/7d where provider evidence exists, but never exploit a winner by repeating its consumed story family.

Known consumed story families include `printer` and, after provider create `urn:li:share:7510601516681064448` on 2026-09-29, `whatsapp-group-chaos`.

Authority:
- machine policy: `brain/policies/personal-linkedin-daily-creative-loop-v1.json`;
- human contract: `docs/brain/personal-linkedin-daily-creative-loop-v1.md`;
- shared chat preflight: `config/brain-chat-learning-contract.json`.
