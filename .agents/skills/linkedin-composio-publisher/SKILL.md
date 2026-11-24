---
name: linkedin-composio-publisher
description: Enforce Composio as the canonical LinkedIn publication transport and keep generation fallbacks separated from publication authority.
---

# LinkedIn — Composio publication authority

## P0 personal identity last-metre rule — 2026-11-15 (#5913)

**This rule supersedes any older observational or generic-news personal fallback instructions in this skill.** Personal LinkedIn is an independently source-verified **Arthur-authored first-person personal story**, not news narration, company marketing, internal metrics or an AI-generated impersonation. The source must be an approved user-origin personal fact, not a reclassified third-party article or an external problem radar result. Preserve provenance, consent/privacy, authenticity, uniqueness and original daily claim. If no trustworthy own story is available, record the same obligation with its owner/next action and do not invent an experience or manufacture a replacement publication. Keep the one canonical executor running; no extra writer or scheduler.

Immediately before **each** personal LinkedIn `LINKEDIN_CREATE_LINKED_IN_POST`, the original `powerhouse-social-publisher` must re-hash the actual final commentary and require all of: current-date permitted schedule, verified immutable user-origin source/revision, source-based personal-first-person checks, independent `bg-pre-publish-review` HTTP 200 + `can_publish=true` + `identity_gate_decision=PASS` on that **identical SHA-256**, and exact equality between actual SHA-256, previous reviewed SHA-256 and source evidence final hash. A missing, stale, 422, contradictory or hash-mismatched review is an unconditional **pre-provider veto**. `final_copy_approved`, a prior `pre_publish_gate=passed`, a 200 from a write API, views, or after-the-fact readback are not replacements for editorial clearance.

Incident evidence: 2026-11-15 news about tasered package courier was registered as personal and `LIVE_PROVEN` despite conflicting reviewer 422, discordant hashes and permission-limited provider readback. Preserve chronological evidence and distinguish provider-created from content-approved, independently verified and measured; **never mark an editorially failed personal post as editorial PASS or regenerate a second provider post**. Reconcile any earlier violation with the original exact URN and source lineage, without deleting existing public content automatically. Company channel remains independent.

Regression: `tests/brain-personal-first-person-voice-and-source-20261115.test.mjs`; source `supabase/functions/_shared/personal-first-person-story-gate.mjs`, last-metre transport `supabase/functions/powerhouse-social-publisher/index.ts`. Protected CI, exact-main source parity, native Edge deployment, negative production review, natural next eligible personal attempt, exact provider URN, ONE BRAIN incident/learning readback are required for terminal closure. Never claim permanent error-proof operation or FULL_GREEN from code alone.


Fingerprint: `linkedin-composio-chain-provider-isolation-v1`.

## Hard transport rule

LinkedIn personal and LinkedIn company publication must use the canonical Powerhouse publication authority and Composio transport. Buffer is not an allowed LinkedIn fallback, reconciliation authority, retry transport or replacement writer.

A Buffer outage, HTTP 429, missing Buffer token or failed legacy Buffer sync must never block or downgrade LinkedIn publication. Buffer compatibility work is non-blocking telemetry only.

## Single-writer and duplicate prevention

Before any LinkedIn side effect:
- resolve the exact channel identity and capability;
- reserve/use the canonical daily publication claim;
- keep at most one writer for each channel + publication date;
- if provider truth is uncertain, fail closed;
- never issue a replacement post merely because readback is unavailable;
- after a successful write, retain the exact provider post URN/ID and perform exact readback where supported.

## Personal versus company identity

Personal LinkedIn remains subject to the `personal-linkedin-personal-life-only-v1` skill and its verified personal-source gate. Company LinkedIn must never reuse personal diary or household content as company copy.

Company-page publishing capability must be proven separately from personal-member capability. Missing LinkedIn organization permissions is a hard boundary, never a reason to route through Buffer.

## Generation fallback is not publication fallback

Content generation may use the separately governed `supabase-bg-composio-content-fallback-v1` route only when the primary generation provider is unavailable because of explicit provider-availability failures such as:
- credit exhaustion;
- missing primary API key;
- HTTP 401, 403 or 429;
- provider HTTP 5xx.

Ordinary request/schema/programming errors do not authorize fallback.

The Composio/Groq fallback may create only the canonical six-field artifact:
`title`, `body`, `cta`, `hook_type`, `focus_keyword`, `meta_description`.

It may never publish directly. All downstream personal-truth, company-tracking, identity, dedupe, publication-authority and exact LinkedIn URN-readback gates remain mandatory.

## Terminal delivery

Do not report LIVE or DONE until the chain has:
root cause → protected tests → merge to main → production deployment → production source readback → canonical run → provider-side publication evidence/readback → learning/writeback.

## Personal create/readback split

A successful personal LinkedIn create response is a provider side effect even when the subsequent LinkedIn readback endpoint is forbidden or unavailable. Once Composio returns a post URN:
- persist that exact URN immediately in the canonical claim and obligation lineage;
- record create success separately from readback truth;
- use verification-pending/dispatched state when exact readback is unavailable;
- set republish_forbidden=true;
- reconcile only that exact URN later;
- never erase the URN and never create a replacement post for the same daily claim.

Fingerprint: linkedin-personal-created-urn-preservation-v1.

## Global historical uniqueness — hard gate

Fingerprint: `powerhouse-global-post-uniqueness-v1`.

Every social post must be genuinely unique across the complete retained Powerhouse publication history. This applies across dates, channels and providers.

Before any external social-provider create call:
- reserve the final post text through `powerhouse_reserve_unique_publication_v1`;
- reject an exact raw-content hash already seen;
- reject an exact normalized-content hash already seen;
- reject a near-duplicate whose normalized 3-word-shingle Jaccard similarity is at or above the governed threshold (currently 0.62);
- strip URLs/punctuation/whitespace effects during normalized comparison so changing a tracking link, spacing, hashtags or superficial formatting cannot make old copy “new”;
- treat scheduled, dispatched, possible-provider-side-effect and published content as already used;
- block the claim with `republish_forbidden=true` before any provider side effect when uniqueness fails;
- generate a materially different angle/source/story instead of paraphrasing the old post.

A same-day same-channel claim may reuse its own exact database reservation for idempotent recovery, but no different daily/channel claim may reuse that content.

Never solve a duplicate by changing only the hook, CTA, punctuation, hashtags, URL, sentence order or a few synonyms. The underlying story and wording must be genuinely new.

## Story uniqueness v2

Fingerprint: `powerhouse-global-post-story-uniqueness-v2`.

Textual paraphrasing is not sufficient uniqueness. A post is a duplicate when the same underlying story, incident or content source is reused with different sentences.

Additional hard gates:
- personal LinkedIn derives a stable story fingerprint from verified `source_text` (or `content_id` when source text is unavailable);
- reusing an already-used personal story fingerprint is forbidden;
- all social copy also undergoes stopword-filtered keyword overlap;
- at least 8 shared meaningful keywords with Jaccard overlap >= 0.30 is a story-level duplicate;
- this runs in addition to exact raw hash, normalized hash and 3-word-shingle checks.

The same anecdote may not be posted again merely because wording, hook, CTA, hashtags, punctuation or sentence order changed.

## Canonical story fingerprint authority v3

Fingerprint: `powerhouse-story-fingerprint-authority-v3`.

Do not independently normalize/hash personal story sources in application code. Both historical backfill and live publishing must use the database function `powerhouse_story_fingerprint_v1`. This prevents punctuation, URL, whitespace or content-id formatting differences from producing different fingerprints for the same source lineage.

If the canonical fingerprint function cannot be called or returns empty, publication fails closed before any provider write.


## Provider token health preflight (2026-09-26)

Fingerprint: `social-provider-health-preflight-v1`.

An account reported as ACTIVE by Composio is not publication-ready until a live provider call proves the OAuth token still works. Before issuing or consuming a publication capability, LinkedIn must run `LINKEDIN_GET_MY_INFO` against the canonical connected account. A 401 or `REVOKED_ACCESS_TOKEN` means `COMPOSIO_LINKEDIN_REAUTH_REQUIRED`; keep the daily claim at `content_ready`, consume no publication capability, create no Buffer fallback, and resume the same unique artifact only after OAuth health is re-proven.

When multiple LinkedIn connected accounts exist, stale/revoked accounts do not count as healthy. Prefer the single health-verified account with alias `bedrijfsgeheugen-canonical`; ambiguity is evaluated only across healthy candidates. The publisher must use the health-verified connected account recorded by `powerhouse-composio-linkedin-setup`, never a stale secret-pinned account id.


## Daily publication invariant — channel-specific OAuth authority (2026-09-28)

Fingerprint: `linkedin-daily-channel-oauth-authority-v1`.

Daily LinkedIn delivery is an obligation, not a best-effort scheduler. Every Amsterdam calendar day with an approved publication obligation must autonomously reach one of two terminal outcomes: exact provider publication evidence for that same claim, or a narrowly defined external hard boundary that genuinely requires human authorization. Internal connection selection, stale account IDs, expired aliases, scope drift, readback limitations, concurrent agents, retries or legacy provider state are never terminal excuses.

Hard rules:
- LinkedIn personal and LinkedIn company are distinct provider identities and must resolve independently.
- Personal publication selects a health-proven connection for canonical person `urn:li:person:N1twnCNCrD`.
- Company publication selects a connection only after both the canonical person identity and live organization ACL for the configured company URN are proven on that exact connected account.
- A connection that passes `LINKEDIN_GET_MY_INFO` is not sufficient evidence for company publication.
- Company preflight must prove organization capability with `LINKEDIN_GET_COMPANY_INFO` before any publication capability is consumed.
- The runtime must never reuse the personal connection merely because it is default, newest, named canonical, or already present in setup state.
- Auth-config metadata is not token truth. Selected scopes must be verified by live provider calls on the exact connected account used for the write.
- When multiple active connections exist, probe them and select by proven capability; ignore revoked, expired, scope-deficient or wrong-identity accounts.
- After the provider returns a post URN, persist it immediately and set `republish_forbidden=true`. Missing readback may trigger reconciliation, never a second post.
- Recovery always resumes the existing daily claim; it never creates a replacement claim merely to escape auth/readback problems.
- Buffer and Make remain forbidden as LinkedIn publication fallbacks.
- Daily watchdog logic must detect any approved but unpublished LinkedIn obligation and re-enter this same canonical recovery path automatically.

Required regression proof:
- company publish/readback paths call the organization-capability resolver, not the personal resolver;
- company auth preflight is channel-specific;
- personal and company claims remain separately deduped;
- a provider-created URN cannot be replaced by a retry;
- daily recovery reuses the same obligation and unique artifact.

Reusable lesson: an OAuth auth-config can advertise the right scopes while a particular connected token still lacks them. Publication authority therefore belongs to a live, capability-proven connected account, not to an auth-config, alias, default flag or prior setup-state pointer.


### Buffer-independent reconciliation addendum (2026-09-28)

Fingerprint: `linkedin-reconciliation-buffer-isolation-v1`.

Exact LinkedIn provider reconciliation must execute independently of Buffer availability, cooldown or HTTP 429 state. Buffer health may defer only Buffer-owned audit/containment work. It must never suppress readback of an existing LinkedIn URN, company capability probing, personal/company recovery, or closure of a Composio-owned daily claim. This prevents a retired/limited fallback provider from becoming a hidden dependency of the canonical LinkedIn path.

## Semantic example uniqueness v4 (2026-09-28)

Fingerprint: `powerhouse-global-semantic-example-uniqueness-v4`.

Before any LinkedIn create call, dedupe must evaluate the underlying subject/example/story family across retained history, not only final-copy hashes. A candidate is blocked when it reuses the same concrete example or anecdote even if its sentences are entirely rewritten.

Required behavior:
- final-copy dedupe, story fingerprinting and source/content-id dedupe are cumulative gates, never alternatives;
- historical provider posts and canonical publication records are both part of the comparison set whenever available;
- user-reported duplicates are treated as authoritative negative evidence and immediately retire that story family from future candidate generation;
- after a semantic duplicate is detected, generate from a different source/event/topic; never paraphrase the blocked candidate;
- known retired example family: `printer` on personal LinkedIn;
- the rule applies cross-date and cross-channel: a concrete story already consumed by one social output cannot silently be recycled elsewhere as “new”.

A successful provider create permanently consumes the story family even when LinkedIn exact readback returns 403; retry/reconciliation must never publish a replacement.



## Provider create acknowledgement is authoritative (2026-09-28)

Fingerprint: `linkedin-company-create-ack-over-readback-v1`.

A successful LinkedIn company create call that returns a durable LinkedIn post URN is authoritative evidence that a provider side effect occurred. API readback and organization-ACL reads are separate capabilities and may return 401/403 even when the post was created and is live.

Hard rules:
- when `LINKEDIN_CREATE_LINKED_IN_POST` succeeds for the configured organization and returns `urn:li:share:...` or `urn:li:ugcPost:...`, immediately persist that URN, set `provider_create_success=true`, `provider_publication_ack_verified=true` and `republish_forbidden=true`;
- never downgrade that claim to failed/blocked merely because `LINKEDIN_GET_POST_CONTENT` or `LINKEDIN_GET_COMPANY_INFO` returns 401/403;
- readback failure after provider create is a verification limitation, not publication failure;
- the daily obligation is closed as `PUBLISHED` on provider create acknowledgement; exact readback remains optional enrichment;
- reconcile only the existing URN; never generate a replacement post;
- user-visible evidence on the LinkedIn company page may upgrade `provider_truth_verified` when API readback is permission-limited;
- do not request repeated OAuth reconnection solely to verify an already-created post;
- organization-scope diagnostics belong before a provider write, not after a successful provider write;
- watchdogs must treat a persisted provider-created URN as a terminal anti-duplicate fence and must not classify it as a silent publication failure.

Reusable lesson: write authority and readback authority are distinct. A failed read permission cannot negate a successful write acknowledgement.


## Personal LinkedIn provider write is terminal too (2026-09-28)

Fingerprint: `linkedin-personal-provider-write-terminal-v1`.

The same provider-write truth rule applies to personal LinkedIn. If the provider create call has already returned a durable personal post URN, later token revocation, 401/403 readback, or account reconnection may not retroactively turn that published side effect into a failed obligation.

Hard rules:
- persist the personal post URN immediately after create success;
- set `provider_create_success=true`, `provider_publication_ack_verified=true` and `republish_forbidden=true`;
- later `REVOKED_ACCESS_TOKEN`, 401 or 403 during readback is a verification limitation only for that already-created post;
- reconnecting a token is a prospective capability repair for future posts, never justification to replace the existing URN;
- watchdog/recovery reconciles the existing URN only.


## Provider-created social side effects are terminal across channels (2026-09-28)

Fingerprint: `provider-write-terminal-all-social-v1`.

Once LinkedIn returns a durable post URN for personal or company publication, the daily claim is `PUBLISHED` for side-effect truth. Later auth revocation, 401/403 readback limits, ACL failures or analytics failures may affect verification enrichment, but may never downgrade the publication to failed/blocked or trigger a replacement post.

Required behavior:
- persist the provider URN immediately;
- set `provider_create_success=true`, `provider_publication_ack_verified=true` and `republish_forbidden=true`;
- recover readback/auth separately from publication state;
- reconcile only the existing URN;
- never request reauthorization merely to prove an already-created post;
- daily watchdogs must close the existing claim, not reopen publication.


## LinkedIn company historical duplicate prevention v5 (2026-09-29)

Fingerprint: `linkedin-company-historical-dedupe-v5`.

Incident lesson: company-page duplicates can still escape when exact daily idempotency is correct but historical semantic uniqueness is weaker than on personal LinkedIn. A changing measured URL, hashtag set, date token, CTA or small wording change may never be treated as novelty.

Permanent hard rules for all current and future chats, agents, schedulers and recovery paths:
- `linkedin_company` must receive a durable story fingerprint before any provider write, exactly like `linkedin_personal`;
- the company candidate must be canonicalized before uniqueness reservation: strip URLs, hashtags, publication-date markers, punctuation/formatting noise and repeated whitespace;
- exact raw hash, normalized hash, shingle similarity, canonical story fingerprint and semantic example/story-family checks are cumulative;
- compare against retained history across dates and channels, not only the current daily claim;
- a user-reported duplicate is authoritative negative evidence: retire that story family immediately and generate from a materially different source/topic;
- known retired company story family: employee leaves/is sick/on leave → critical customer/process knowledge only existed in that person's head;
- a new CTA, measured URL, hook, sentence order or synonyms can never reactivate a retired story family;
- the atomic single-writer claim remains required, but it is not a substitute for historical uniqueness;
- provider create + durable URN permanently consumes the story family and sets `republish_forbidden=true`;
- retries, reconnects, parallel chats/agents and watchdog recovery must resume/reconcile the same claim and may never issue another provider write for already-consumed content.

Required machine evidence before dispatch:
`historical_story_fingerprint_present=true`,
`canonical_duplicate_body_reserved=true`,
`semantic_story_family_unique=true`,
`single_writer_claim_acquired=true`.

Canonical runtime authority: `supabase/functions/powerhouse-social-publisher/index.ts`.
Regression authority: `tests/brain-linkedin-company-historical-dedupe-v1.test.mjs`.
Brain learning: `brain/learning/2026-09-29-linkedin-company-historical-dedupe-v1.json`.


## Company write/read scope separation (2026-09-29)

Fingerprint: `linkedin-company-write-read-scope-separation-v1`.

A LinkedIn organization write must never be blocked merely because organization ACL/read endpoints return 403. The canonical Bedrijfsgeheugen organization author is `urn:li:organization:18234216` (or the configured `COMPOSIO_LINKEDIN_COMPANY_AUTHOR_URN`).

Hard rules:
- provider token health is proven with `LINKEDIN_GET_MY_INFO`;
- company author identity comes from the configured canonical organization URN, with ACL discovery used only as optional corroboration;
- `r_organization_admin` and organization-read scopes are verification/enrichment capabilities, not prerequisites for attempting a company write;
- `w_organization_social` remains the actual provider write capability; if scope metadata is unavailable, the create call itself is the authoritative capability probe;
- a 403 on `LINKEDIN_GET_COMPANY_INFO` must not force reconnect or fallback when the personal token is healthy and canonical organization identity is known;
- a 401/`REVOKED_ACCESS_TOKEN` remains a genuine reconnect boundary;
- a successful create URN is terminal publication evidence and permanently activates `republish_forbidden=true`;
- reconnect flows must preserve separate personal and company canonical identities and must not create duplicate aliases/writers.


## Production-workspace OAuth authority (2026-09-29)

Fingerprint: `linkedin-production-workspace-oauth-self-heal-v1`.

OAuth repair for autonomous Powerhouse publishing must be initiated by the production `powerhouse-composio-linkedin-setup` controller using the production `COMPOSIO_API_KEY`. A connection created in another Composio workspace or ChatGPT connector is not evidence that the Supabase publishing runtime is repaired.

Hard rules:
- create/reconnect links from the production workspace itself;
- reuse the production LinkedIn managed auth config when uniquely identifiable;
- bind the connection to stable user `bedrijfsgeheugen-owner` and alias `bedrijfsgeheugen-company-canonical`;
- after OAuth completion, provider-health-check the production connected account before publication;
- resume the existing Amsterdam-day claim through `powerhouse-social-publisher`; never create a replacement claim;
- cross-runtime “ACTIVE” metadata is never sufficient: the exact production runtime must prove provider health;
- no Buffer/Make fallback is allowed.

## Production runtime authority beats chat-session connector state (2026-09-29)

Fingerprint: `linkedin-production-runtime-authority-over-chat-session-v1`.

For Bedrijfsgeheugen LinkedIn, a chat-local Composio connection list is diagnostic only. It is not the canonical authority for whether the production publisher can post.

Before reporting an OAuth blocker, requesting reconnection, or creating any new LinkedIn connection, every chat/agent must first read:
1. `brain_records.record_id = linkedin-composio-setup-current-state-v1`;
2. the current `content_publication_obligations` row for the exact Amsterdam date + channel;
3. any persisted LinkedIn provider URN/ID for that obligation.

Hard rules:
- if the obligation already has `provider_create_success=true` or a durable `external_id/provider_post_id`, publication is terminal and `republish_forbidden=true`; never reconnect or republish to “fix” readback;
- if production runtime state is `ACTIVE`, `company_ready=true`, the canonical organization is `urn:li:organization:18234216`, and the production connected account has `w_organization_social`, a 401/403 from a chat-local connector means local-session credential divergence, not a production outage;
- never create a replacement alias merely because a chat-local connection says ACTIVE but fails provider health;
- a human OAuth request is allowed only when the production runtime itself lacks a healthy capability-proven account and no provider side effect already exists;
- after human OAuth, verify provider-level capability in production runtime, not only connector status;
- personal and company identities remain separate; organization write authority requires the production company capability state, never the default personal account.

Incident evidence: on 2026-09-29 the chat-local connector returned revoked/insufficient-scope results while canonical production state remained ACTIVE with `r_organization_admin` + `w_organization_social`, and the company post was already published as `urn:li:share:7510609161110482944`.

Reusable lesson: connector UI/session state and production OAuth authority are different control planes. Production provider evidence wins.


## Bedrijfsgeheugen company standard delivery (2026-09-29)

Fingerprint: `linkedin-company-standard-delivery-v1`.

This contract is mandatory for every current and future chat, agent, scheduler, watchdog and recovery path that creates or publishes `linkedin_company`.

### Company identity gate

Bedrijfsgeheugen LinkedIn is a company channel. Before generation or publication:
- classify the channel as `linkedin_company`;
- reject personal-life anecdotes, household friction, printer/scanner stories, family logistics, private WhatsApp/app irritations and other personal-channel material;
- select a business-relevant subject for owner/CEO/MT/director audiences: execution, decision follow-up, process friction, knowledge flow, data/AI, governance, commercial performance, risk, adoption or measurable improvement;
- never transform a rejected personal topic into company copy by merely adding a Bedrijfsgeheugen CTA.

Known globally retired story family: `printer`. It is forbidden on both personal and company LinkedIn unless the user explicitly asks to discuss printers as a new factual business subject.

### Historical novelty gate

Before provider write:
- run complete retained-history comparison across personal + company social history;
- treat user deletion/duplicate feedback as authoritative negative evidence;
- retire the underlying story family, not just the exact wording;
- choose a materially different business topic automatically;
- never reuse a story by changing hook, CTA, hashtags, URL, examples or sentence order.

### Production auth gate and self-healing

The production Powerhouse runtime is the authority, not a chat-local connector list.
For each company run:
1. read canonical production setup state and the exact daily obligation;
2. if a durable provider URN already exists, do not republish;
3. enumerate production LinkedIn connected accounts and select only the canonical person identity with organization-write capability;
4. verify live token health before write; metadata `ACTIVE` alone is insufficient;
5. ignore stale, revoked, wrong-scope, personal-only and duplicate aliases;
6. if an existing production account can be repaired without human consent, repair it and resume the same claim automatically;
7. only when LinkedIn itself requires fresh human OAuth consent may the run surface one reconnect action; never fall back to Buffer or Make;
8. after reconnect, re-prove provider capability in production runtime and resume the same obligation.

### User-deleted company post recovery

A user explicitly deleting a company post is a new verified outcome, not a readback failure.
When the user confirms deletion:
- mark the deleted provider URN as `USER_DELETED`/retired evidence;
- keep that story family consumed/retired;
- permit at most one replacement for the same Amsterdam-day company obligation;
- the replacement must have a new story fingerprint and pass full historical uniqueness;
- never resurrect or reuse the deleted text/topic;
- persist the replacement provider URN as the terminal daily side effect.

### Terminal standard

A company run is terminal only when one correct Bedrijfsgeheugen business post exists with a durable provider URN, or LinkedIn requires explicit human OAuth that cannot be performed autonomously. Internal alias drift, stale connection pointers, content-selection mistakes and readback 403s are self-healed inside the same lineage.


## Source-backed all-channel rule — 2026-09-29
Fingerprint: `powerhouse-source-backed-all-channels-v1`.

LinkedIn company publication must prefer current evidence-backed MKB/CEO/MT problems over static calendar seeds. Preserve source URL/hash/problem/trigger lineage through recommendation, final copy, provider post ID and learning. LinkedIn personal remains separately identity-gated: external public evidence may select a theme, but cannot create first-person Arthur claims.

## Story-family overlap duplicate prevention v6 (2026-09-30)

Fingerprint: `powerhouse-story-family-overlap-dedupe-v6`.

Incident regression: the personal LinkedIn posts about the broken electric sliding door + warm airco + manual door/windows-open routine were published twice with materially different wording. The existing source/story fingerprint and Jaccard checks did not recognize the second rewrite as the same human story.

Permanent rules:
- exact raw hash, normalized hash, shingle similarity, canonical story fingerprint, keyword Jaccard and **keyword overlap coefficient** are cumulative gates;
- when at least 10 meaningful keywords overlap and the overlap coefficient against the smaller story is >= 0.30, the candidate is `STORY_FAMILY_DUPLICATE`;
- duplicate protection is database-enforced by `powerhouse_reserve_unique_publication_v1` plus the fail-closed trigger `powerhouse_publication_story_family_guard_v2`;
- every current/future chat, agent, scheduler, recovery path and connector must pass this same database authority before any provider write;
- a duplicate candidate is discarded and replaced by a genuinely different verified source/event/topic; rewriting the same anecdote is forbidden;
- the consumed regression family `auto + elektrische schuifdeur + airco + warme lucht + handmatig openen/ramen open + nieuwe routine` may never be reused as a new post.

Regression authority: `tests/brain-social-duplicate-prevention-governance-v1.test.mjs`.
Source-controlled database authority: `supabase/migrations/20260930071500_powerhouse_story_family_overlap_guard_v6.sql`.
Brain learning: `brain/learning/2026-09-30-social-story-family-dedupe-v6.json`.

## Lead-magnet language routing and comment-intent capture (2026-09-30)

Fingerprint: `powerhouse-linkedin-lead-magnet-language-routing-v1`.

For LinkedIn lead-magnet campaigns:
- use one language per post; do not stack Dutch + English copies in the same post;
- keep the downloadable value asset available in both NL and EN when internationally relevant;
- a translated post is not a new story and may not bypass semantic duplicate prevention;
- route the delivered asset by known commenter/profile/conversation language, otherwise ask one minimal language choice in DM;
- use short intent tokens tied to the asset, such as `100`, `50`, `ROI`, `2027`, `STACK`, `SAFE`;
- every comment-intent event enters the canonical relationship/revenue loop and records post, keyword, language, delivery, reply, meeting/proposal/order and realized revenue;
- LinkedIn publication remains Composio-only. Buffer and Make remain forbidden publication fallbacks.


## 2026-10-22 — verified distinct-source founder reserve

Fingerprint `powerhouse|personal-verified-distinct-source-reserve|20261022-v1`.

When the canonical personal founder post is blocked as a global story-family
duplicate with NO consumed or ambiguous provider capability, the existing
source-backed orchestrator must seek an independently recorded and distinct
daily source family. The pure helper `buildVerifiedFounderReserve` runs inside the existing unscoped content orchestrator and writes at most three genuinely source-backed alternatives in the SAME canonical recommendation table. No new Postgres RPC, preview branch, cron or sender is created. Each alternative requires a recorded source event ID or allowed external URL from the verified founder evidence. Context never becomes a claimed personal experience. No provider send, email consent or media claim is granted by materialization.


## 2026-10-22 — Hold-state pre-provider duplicate bootstrap

Fingerprint: `powerhouse|held-personal-duplicate-rebootstrap|20261022-v1`.

After global story-family duplicate rejection, an otherwise retryable personal
claim can be normalized to hold/blocked while obligation remains the authoritative
record of the rejection. The EXISTING content-loop must inspect BOTH surfaces.
Only an externally unconsumed claim with no provider mutation may reopen. Use
the same existing content orchestrator under its original lease, verified
source reserve, rejected recommendation IDs, bounded daily attempts, and all
independent identity/copy/global uniqueness/provider readback gates.
This is not a new scheduler or consent to publish an unverified story.


## 2026-10-22 — personal editorial strict JSON truncated response

Fingerprint `powerhouse|personal-editorial-truncation-bounded-retry|20261022-v1`. A verified personal founder recommendation is not
a publishable artifact until BOTH independent editorial and final-copy
truth gates pass. If the editorial rewrite itself returns a demonstrably
incomplete strict JSON because the model reached `max_output_tokens`,
perform only ONE bounded larger-budget draft retry (2400 → 4800).
Do NOT retry a rejected editorial result, OAuth denial, source failure or
an ambiguous social provider write. Preserve the original publisher,
one channel/day publication authority, global semantic dedupe, and external
provider receipt. The daily executor remains active with original leases.


## 2026-10-22 — personal unconsumed publish lease recovery

Fingerprint `powerhouse|linkedin-personal-expired-authority-recover|20261022-v1`. The EXISTING protected personal LinkedIn
publisher now shares the company's exact expired authority recovery: only
same day; original publish/blocked claim; explicit no provider side effect;
all leases unconsumed and expired/revoked; zero uniqueness reservations.
Revoke by exact lease CAS then resume the ORIGINAL content_ready record by
exact updated_at CAS. Repeat source, editorial, identity, OAuth, semantic
uniqueness and external provider receipt gates; never manufacture a post.
Never add second sender, job, or OAuth fallback.

## 15 November 2026 — personal observation editorial parity

Fingerprint: `powerhouse|linkedin|observation-builder-review-mismatch|20261115-v1`. The original pre-publish LinkedIn personal decision may be `observational_personal_theme_verified=true` with `ai_native_builder_story_verified=false`. Do **not** reuse the builder/founder correction prompt for this source: it instructs business claims and creates an avoidable final `FINAL_TEXT_BUSINESS_SIGNAL_BLOCK` (HTTP 422). The original editor and original `bg-pre-publish-review` now share `personalNonBuilderBusinessSignal`; the editor attempts only one source-grounded, non-business observational rewrite before final approval. Never alter the original source type, invent personal experiences, lower the final identity/uniqueness gate, or post after a 422. If evidence is insufficient, keep the same date/channel ONE BRAIN obligation OPEN, record its original owner, rejection code, source revision, next safe genuinely different source action, and do not silently skip or re-send. Verify via original protected Required + CodeQL, Netlify/Supabase source parity, the next natural daily executor, LinkedIn provider ID and independent readback, ONE BRAIN named `PROCESSED` consumer and Heartbeat evidence. A passing source test or merge is not evidence of a published post. No second executor or schedule.

## 15 November 2026 — persoonlijke eindtekst controle: één gedeeld taalcontract

Fingerprint `powerhouse|linkedin|legacy-substring-personal-final-truth-veto|20261115-v1` (P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). De originele `powerhouse-content-orchestrator` gaf in de natuurlijke run na de content-loop release `PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED` bij een geverifieerde observerende dagelijkse bron over onlinebestelling en klantenservice. De historische `personalFinalCopyValid` gebruikte een onbegrensde `/klant/`-substring die `klantenservice` als reclame behandelde, in strijd met het onafhankelijke `bg-pre-publish-review` en het gedeelde `personalNonBuilderBusinessSignal`-beleid (standalone-woordgrenzen). **Geen beleidsverlaging:** de oude eindcontrole gebruikt voortaan de bestaande gedeelde classifier; zelfstandige zakelijke woorden, verzonnen eerste-persoonsclaims, ongeverifieerde feiten, slechte bron en ongeldige final-hash blijven verboden. `onlinebestelling` en `klantenservice` zijn alleen geloofwaardige dagelijkse scènes wanneer de geverifieerde bron ze werkelijk bevat. De originele generatie-agent probeert maximaal één source-locked redactieherziening ook bij uitsluitend een final-truth-veto, niet alleen bij een eerste editorial 422, en toetst daarna ALLE oorspronkelijke gates opnieuw. Geen parallelle agent, scheduler, LinkedIn-send of OAuth-omzeiling. Controleer Required+CodeQL, native source SHA, daarna natuurlijke run; claim pas live bij provider-ID/GET, ONE BRAIN `PROCESSED`, Heartbeat-meetbewijs.


## 15 November 2026 — exact daily-life observation gate shared with prepublish
Fingerprint `powerhouse|linkedin|personal-observational-context-lexical-drift|20261115-v1`, parent P0 #4198.
Production original personal 2026-11-15 BLOCKED: independent final review returned
`OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED` even though the original personal
generator accepted the verified online order / customer-service daily-life terms.
Use the one shared `personalObservationalLifeContextSignal` in BOTH original
generator and original final reviewer, preserving the existing source-backed
observation vocabulary including `onlinebestelling`, `klantenservice`, and
`webwinkel`. The lexical predicate is NOT a provider permit: keep
`public_theme_source_verified`, source lineage and age, personal topic,
no false first-person claims, commercial veto, exact final hash, story-family
uniqueness, capability and OAuth provider gates, and real LinkedIn ID/readback.
Do not publish the rejected artifact directly; re-enter the EXISTING one daily
lane only once it has an exact eligible source and valid editorial artifact.
The original publisher/agent remains the owner, not a second scheduler or sender.
Do not claim repair complete before protected CI, production edge source parity,
natural provider publication, ONE BRAIN consumer PROCESSED, and Heartbeat learning.


## 15 November 2026 — guarded rebootstrap of ORIGINAL personal 422
Fingerprint `powerhouse|linkedin|personal-observation-review-no-rebootstrap|20261115-v1`.
The original hourly `powerhouse_content_closed_loop_tick_v1` calls
`powerhouse-content-loop`, not the editor directly. After the successful
shared observer lexicon release, the original personal source claim remained
BLOCKED (two prior recovery attempts), but the loop did not recognize
`OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED` as a rebootstrap reason.
The existing content-loop now owns a bounded, **pre-provider-only** check:
both original daily records must have the exact same source ID, reviewed
SHA256, matching 422 failure and status; no original provider ID, live URL,
publication timestamp, consumed authority, possible provider side effect,
or republish prohibition. At most one additional attempt when the recorded
original recovery count is 2 (limit 3), with the full unchanged source/identity/
editorial/uniqueness/OAuth/provider review in the original orchestrator.
If anything fails or the source becomes ineligible, keep OPEN with the original
owner and explicit typed reason, never fake a result and never create a second
sender/scheduler. Production green requires provider URN and independent
GET, named ONE BRAIN PROCESSED plus Heartbeat measurement and learning.


## 15 November 2026 — observational source completeness before generation
Fingerprint `powerhouse|linkedin|personal-observation-truncated-source-spinning|20261115-v1` (P0 #4198). Independent original evidence: 15 November source recommendation `6418326b-bded-487d-b1dd-1ec22ea0af66` was marked verified but `source_text` contained only 143 characters ending in `...`, while its original personal generator accumulated six failures `PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED` after source-locked correction. This is insufficient evidence for a 130–200 word source-grounded post and must not be treated as publishable simply because the source URL was verified.
The ORIGINAL `validPersonalSource` now requires an observational source of at least 240 characters, not ending in truncation ellipsis, with a direct HTTPS source URL and parseable source published/observed timestamps, in addition to all prior identity/source gates. The original source collector must enrich or replace the fragment and provide a genuinely different source if needed. If no complete verified source exists, keep SAME date/channel obligation OPEN, with owner, reason and source reference, no forced publisher call, no fabricated personal experience, no blind resends, and no new scheduler. The original agent learns from the rejection and continues subsequent days, without disabling the executor. Regression tests in existing source-aware blocked-lane fairness suite. Green only after provider ID and independent GET, named ONE BRAIN PROCESSED, Heartbeat effect.


## 15 November 2026 — original source-conflict no-resurrection

Fingerprint `powerhouse|linkedin|observational-source-conflict-resurrection|20261115-v1`, parent P0 #4198. After a seven-attempt editorial rejection, the original v2 personal source rotator used ON CONFLICT DO UPDATE to turn a quarantined `skipped` recommendation back into `suggested`, replacing corrected source information with a 143-char ellipsized excerpt and claiming success. The original protected v2 SQL function must use DO NOTHING on conflicts, return a row-count based truthful result, never select a signal with `metadata.original_source_quarantine`, require >=240 complete source characters and preserve immutable original signal/dedupe key despite URL alias changes. Same service role and original publisher. No fake personal experience, no second scheduler/provider sender, no direct publish. Keep original obligation OPEN and hand the typed SOURCE_SUPPLY_REQUIRED to original radar until valid new source, independent LinkedIn provider ID/GET, ONE BRAIN PROCESSED and Heartbeat result.

## 15 November 2026 — original personal search/source contract parity
Fingerprint `powerhouse|linkedin|original-radar-accepts-truncated-source|20261115-v1`, parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
The existing personal source collector mistakenly accepted a 143-character ellipsized excerpt because its original SQL rotation required only 60 characters, while the original writer requires >=240 nontruncated characters. The original source collector now uses the SAME two personal searches within the EXISTING eight-call radar with Tavily advanced, three chunks per result (no new provider, call, queue or scheduler); business six queries remain unchanged. Both radar and existing service-role-only `powerhouse_ensure_personal_source_rotation_v2(date)` enforce source >=240, no trailing ellipsis, source publication/observation date, direct HTTPS and unused source URL, including its `already_has_eligible` branch. Incomplete original source never gets false ready. One original source deficit is recorded as an idempotent failure in ONE BRAIN with original owner and content lineage; no guessed personal anecdotes, no blind provider create, no new executor. Keep the original Daily Publisher active, other lanes progressing, and consumer status open until exact authorized provider URN+GET, named ONE BRAIN processing and Heartbeat outcome. Protected migration and Edge deployed readbacks are prerequisites, not publication proof.

## Source completeness and personal editorial-safety gate — 15 Nov 2026

Fingerprint: `powerhouse|linkedin|dual-provider-source-context-and-editorial-risk|20261115-v1`.

- The original daily personal-news supplier may return advanced Tavily context without a published date, while the original DataForSEO News fallback may provide a dated 140-character snippet. The same original radar may combine them ONLY after an exact canonical HTTPS article identity match; no cross-article enrichment, no invented date, no additional search/scheduler/transport.
- An article about police force, tasering, serious injury, abuse or similar traumatic incident does not become an appropriate casual personal-life story because a topic keyword matched. Quarantine and reject at the original source intake, record a typed reason in ONE BRAIN, and source another safe genuinely dated original event. Do not invent the author's personal experience or rely on a content length gate alone.
- Source freshness, length and editorial suitability are independent quality contracts; every downstream author, publisher and independent reviewer must fail closed on any missing contract. Preserve original daily-claim idempotency and provider URN/readback safeguards.
- A GitHub merge or Edge source parity is not a LinkedIn post. Only exact provider publication ID, independent readback, consumer receipt, measurement and subsequent learning prove the terminal chain. Keep the existing executor active when a candidate is unsuitable.

## 15 november 2026 — persoonlijke stem en bronstatus, bindende laatste-meter-check

Fingerprint: `powerhouse|personal-linkedin|true-user-story-vs-company|20261115-v1`.
- Vóór een nieuwe provider-side-effect: controleer exact persoonlijke `personal_truth_verified` + `first_person_claims_verified` + `arthur_anchor_verified`, expliciet user-fact-bronherkomst, geen journalistieke observatie/AI-builder marketing, een menselijk ik-verhaal en maandag–zaterdag.
- Lees de originele `powerhouse_content_recommendations` opnieuw op de immutable `recommendation_id`: alleen juiste datum + kanaal, status `suggested/accepted`, hetzelfde `content_id` én exacte `source_text` als de bevroren publieksclaim. Verschil, skipped of quarantined betekent veilig afwijzen; behoud de originele oorzaak/overdracht.
- Doe de controle opnieuw onmiddellijk vóór `LINKEDIN_CREATE_LINKED_IN_POST`, vóór het consumeren van de autorisatie. Nooit een nieuwe provider-call na bestaande `provider_post_id`, ongeacht readback-403 of redactionele fout achteraf.
- De bedrijfspagina is exclusief voor brongebonden MKB-problemen, oplossingen en eigen waarde: nooit deze identiteitsbarrière omzeilen. Alle bestaande canonieke Composio-, audit- en dedupe-gates blijven verplicht.

## 18 november 2026 — persoonlijke bron is EVIDENCE_DUE, niet gezonde PLANNED-status

Originele channel_decisions: linkedin_personal is blocked/hold, PERSONAL_TRUTH_SOURCE_UNVERIFIED. De obligation staat nog PLANNED en provider-ID is NULL. De originele powerhouse_ensure_personal_source_rotation_v2 gaf voor 18-Nov SOURCE_SUPPLY_REQUIRED; er waren nul bruikbare nieuwe persoonlijke aanbevelingen. De oorspronkelijke newsradar had 384 bronnen/124 globaal eligible, maar voor de persoonlijke publicatie geen nieuwe ongebruikte volledige (minstens 240 tekens), recente en geldige persoonlijke bron. Nieuwscontext is geen bewijs dat een specifieke eerste-persoonsgebeurtenis werkelijk door de gebruiker is meegemaakt.

Houd de originele persoonlijke-bronproducent aan het werk; verbeter uitsluitend daar bronintake/dedupe/kwaliteit, en vraag bij werkelijk ontbrekende persoonlijke waarheid één expliciet goedgekeurd, niet-hergebruikt concreet eigen moment zonder privégegevens van minderjarigen. Bewaar goedgekeurde bronrevisie en unieke verhaalidentiteit. Daarna oorspronkelijke persoonlijke redactie, duplicate gate, Composio-publicatie, provider ID en onafhankelijk GET/readback en Heartbeat. Bij onvoldoende bron blijft EVIDENCE_DUE met precies owner/reason/next_action in oorspronkelijke brain_failure_registry en bg_gezondheid. Nooit een algemeen Bedrijfsgeheugen-bericht, nieuwsfeit of verzonnen ik-ervaring als fallback sturen. Andere contentexecutors gaan gewoon door.

## 18 november 2026 — reviewer HTTP200 PASS moet huidig SHA en 200 vastleggen
De originele persoonlijke post van 18 november kreeg na geborgde originele editor-rebootstrap een unieke URN en LIVE_PROVEN, maar het oude `review_status=422` en `reviewed_text_hash` van de eerste afgekeurde versie stonden naast `pre_publish_gate=passed` en een NIEUWE teksthash. Dit is een onjuiste bewijsweergave, niet een reden voor herpublicatie. Exact tekst-GET bij LinkedIn was Forbidden, dus volledige onafhankelijke tekstreadback blijft onverifieerbaar.

In de **bestaande** `powerhouse-social-publisher` mag alleen een echte onafhankelijke `gate.http===200`, `can_publish===true`, `identity_gate_decision===PASS`, `gate.final_text_hash===textHash` de CURRENT velden `review_status=200`, `reviewed_text_hash=textHash`, `violations=[]` en een exacte review-tijd op PASS zetten. Behoud hoogstens een begrensde historische `prior_rejected_review` voor eerdere 422s, niet als actuele beslissing. Geen wijzigingen aan bron, auteur, provider/create/no-resend, oorspronkelijke consumed capability, negatieve auth- of reviewcodes, quality gate, RLS en doelgroep. Regressie `tests/brain-original-social-review-200-evidence-20261118.test.mjs`; BRAIN `brain/learning/2026-11-18-original-social-review-200-evidence-v1.json`; incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

