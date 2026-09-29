---
name: linkedin-composio-publisher
description: Enforce Composio as the canonical LinkedIn publication transport and keep generation fallbacks separated from publication authority.
---

# LinkedIn — Composio publication authority

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
