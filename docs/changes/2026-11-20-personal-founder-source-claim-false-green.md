# Personal LinkedIn — first-person source extrapolation escaped original review (20 Nov 2026)

## Incident, verified in production
Real founder-design decision source `41521982-5e5c-4f6d-9540-6a32912862b6` was correctly recovered under the only original v2 producer after protected PR #6068. The original content generator then created a personal 20-Nov draft, and the original publisher got **independent reviewer HTTP 200/PASS** followed by a LinkedIn provider-create confirmation `urn:li:share:7529541605742018561`.

The final stored post body is present in `powerhouse_content_artifacts`. It included author-labeled claims about first-hand teams making dashboards, real-world delays/double work and completed technical outcome "levert veel snellere ... inzichten". The user's genuine source was *only* his direct choices for ONE intelligent software+AI+BI+data system and content principles, plus independently merged repository PRs. There is NO source that he personally observed that team problem, directly implemented code himself, or measured improved results. **Original pre-publish reviewer allowed the ungrounded claims**.

Provider proof separation: original publication obligation shows `PUBLISHED` with `external_id=urn:li:share:7529541605742018561` and official URL https://www.linkedin.com/feed/update/urn:li:share:7529541605742018561/ . However `LINKEDIN_GET_POST_CONTENT` attempted through original member provider and independent Composio readback accounts returned **403 Forbidden**, so this cannot be counted as `LIVE_PROVEN` exact final-content readback. `verification_pending=true`. A provider-created post is not a verified readback.

## Original-lineage correction
- Add source-scope quality gate `personalFounderDecisionSourceScopeViolations` for the **specific** user-directive-only builder event kind. Reject high-confidence unsupported directly-experienced team/client narratives and verified realized implementation/outcome sentences unless independently supported by the user's true source.
- Integrate into the original `personalFirstPersonCopyViolations`, already used by both the independent `bg-pre-publish-review` and original publisher's `personalLastMilePublicationViolations`. Sincere questions, accurately attributed design decisions and genuinely verified real team projects elsewhere remain allowed.
- Strengthen existing original personal builder prompt to forbid dressing a public MKB-friction example as a first-hand client or team experience, or telling that merged PRs prove Arthur coded personally or proved customer gains.
- Historical, shadow and canary regression asserts that the **exact 20 Nov false-green pattern** fails and a source-true own design choice passes.
- Preserve original member publisher, member authority, source revisions, exact hash, no second daily publisher, no commentary bot, no forced end questions. An already consumed post ID remains irrevocably consumed (no duplicate/repost).

## Remaining live remediation
The actual already-created LinkedIn post may need **manual editorial correction or deletion**, because no supported original same-author editing/readback path has yet been established. Do not silently claim it was edited, removed or fully live-verified. Compare provider-visible public text in an authorized browser/LinkedIn member session with canonical stored copy and correct if misleading. This is **a distinct issue** from deploying future prevention. Do not mark content/impact/engagement quality green merely because protected deployment succeeds.

The underlying metrics have only partial real reactions. Exact comments and impressions are not independently available; no claimed effect on conversations or sales.

## Source evidence
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6063
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6064
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6067
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6068
- https://app.notion.com/p/3e1da36aac8a818686c7cc61ff52d7f2

## CI preflight gate repair — 20 Nov 2026
Exact-head Required #44748661697 failed original Supabase migration-history integrity: provider has 888 applied identities, source lock had 886. The two newer provider-applied migrations are 20261120134537 (hockey minor private-data RLS hardening) and 20261120143500 (original personal verified-founder materializer). Security hardening SQL source was absent from GitHub main, but the original Supabase applied migration log contains the exact statement. Source is restored byte-for-byte from that provider SQL log; original source lock is append-only for those **two** provider identities with its 886-row prefix unchanged. This PR does NOT re-run the SQL or relax any privacy/security rights. Recheck original Required + CodeQL and exact provider migration source parity before merge. Unrelated security migration is included only to restore original applied-source completeness, not alter its logic.
