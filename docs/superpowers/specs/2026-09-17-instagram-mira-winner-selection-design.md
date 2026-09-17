# Instagram Mira Winner Selection — Design

Date: 2026-09-17
Status: Approved design
Scope: Bedrijfsgeheugen Powerhouse / Instagram / Mira

## Objective
Make every autonomous Instagram publication for `bedrijfsgeheugen.nl` traceable to an evidence-based, prospectively selected Mira content winner. A scheduled or sent Buffer post is not proof of correct selection. Publication is only canonically eligible when candidate set, scores, winning decision, Mira identity/media proof, channel identity, publication obligation and downstream learning lineage are present and consistent.

Reuse existing Powerhouse authorities. Do not create a parallel content brain, CRM, analytics store, calendar, queue or learning system.

## Existing authorities to reuse
- `public.bg_externe_signalen`
- `public.powerhouse_predictive_signals`
- `public.powerhouse_content_recommendations`
- `public.powerhouse_opportunities`
- `public.social_posts`
- `public.social_metric_snapshots`
- `public.social_learning_evaluations`
- `public.social_learnings`
- `public.content_publication_obligations`
- existing Instagram growth calendar seeds and content-learning/publication workflows

Known state on 2026-09-17:
- seed `instagram-2026-09-17` has topic `Excel-en-handwerk`, format `reel`, `dynamic_replacement=true`;
- the sent provider post had no proven ex-ante `daily_winner` lineage;
- canonical social ingestion stored that Reel as `format=carousel`;
- publication evidence recorded `mira_gate_result=UNPROVEN`.

Never retroactively claim the already-sent post was prospectively selected when it was not.

## Selection flow
Daily candidate problem clusters are built from allowed/fresh external signals, predictive signals, relevant existing opportunities, recent social outcomes/validated learnings, the date’s Instagram seed and existing Mira friction candidates. Every candidate carries source references, timestamps, freshness, confidence and provenance.

Candidates are normalized to concrete human frictions suitable for Mira while staying faithful to evidence and avoiding fabricated personal experiences.

Every eligible candidate receives versioned component scoring covering freshness, recognizability, emotional friction, share/send potential, save/usefulness potential, meme potential, originality/repetition penalty, Mira-fit, evidence strength/source diversity, comparable Instagram performance, growth potential, narrative continuity and production feasibility. Store raw components, normalized score, weight version, timestamp and evidence refs. No hidden or magic score may influence publication.

The winner is persisted prospectively in `powerhouse_content_recommendations` as `daily_winner`. Winner evidence includes `selection_contract`, `score_version`, `selected_at`, ranked candidates, score breakdown, runners-up, provenance/freshness/confidence, linked seed/content key, character Mira, intended format, reason, date and target channel.

## Fail-closed publication gate
Automatic Instagram publishing requires:
1. exact canonical `bedrijfsgeheugen.nl` channel identity;
2. current-date `daily_winner`;
3. publication obligation linked to winner/content key;
4. complete score/provenance lineage;
5. final media Mira identity proof under current contract;
6. compatible provider media metadata and intended format;
7. dedupe/content-pressure pass;
8. no material caption/topic/format drift without a new selection decision;
9. provider prepublish validation pass.

Missing proof means hold, not silent fallback publication.

## Mira identity/media proof
Bind the exact final asset to generator/provider, media URL/hash where available, identity reference lineage, identity result, realism/visual QA, generated/verified timestamps and intended format/duration/dimensions. Buffer transport success alone is not Mira identity proof.

## Reel normalization
Provider/readback ingestion must map Reel/video Reel to `social_posts.format='reel'`, carousel to `carousel`, static image to its correct type, and unknown provider type to explicit unknown/hold behavior rather than an incorrect default. Repair the existing 2026-09-17 misclassification with data-quality lineage.

## Closed-loop learning
Observed metrics feed existing social metric/learning tables and remain linked to exact post, winner decision, problem cluster, score version/components, hook/format/narrative and source set. Only sufficiently mature observed evidence may alter future weights/policy; weak samples remain hypotheses.

## Historical integrity
The already-sent 08:07 local post may remain provider `sent`, but must not be labeled prospectively selected. Mira evidence stays unproven until exact final-asset proof exists. Reel misclassification is repaired separately. Seed-vs-published topic drift remains auditable.

## Tests and release gates
Required regression coverage: candidate generation, deterministic ranking, score completeness, provenance/freshness, low-confidence exclusion, winner idempotency/dedupe, no publication without winner, no publication without Mira proof, exact channel identity, drift protection, Reel normalization, provider readback, outcome-to-winner lineage, and prevention of retrospective winner falsification.

Use existing CI/CD, security, migration and production-readback gates. No gate bypass.

## Acceptance criteria
Not `LIVE & BEWEZEN` until a production or production-equivalent run proves: fresh candidates; ranked evidence; exactly one winner persisted before generation/publication; obligation links to winner; exact Mira media passes proof; provider receives Reel metadata; `social_posts` reads `format=reel`; publication is live on exact Instagram channel; metrics link back to winner; learning evaluation consumes outcomes in the existing learning system.

## Non-goals
No separate Mira database, independent content brain, Make dependency, retrospective fabrication of winner lineage, or claim that the system can know a future viral winner with certainty.

## Implementation boundary
Minimally extend existing content-intelligence, publication and learning code. Add persistent structures only if current canonical evidence/json columns cannot safely represent required lineage, and then require migration/ADR plus System Map and human-readable manual updates.
