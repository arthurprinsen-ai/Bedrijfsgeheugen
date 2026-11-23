# Arthur personal LinkedIn: reuse all recorded MKB and human frictions, without sacrificing personal truth

Date: Friday 20 November 2026 (Europe/Amsterdam).

## User decision
Keep all existing personal LinkedIn editorial decisions; update Agneta and existing Powerhouse agents so professional founder thought leadership relates verifiable personal AI-native software/data/BI build choices to already recorded entrepreneur and human problems, not a tool-first technology list.

## Findings from connected Notion and original production
1. [MKB Probleemradar](https://app.notion.com/p/3e5da36aac8a8145ab3bd925260276ef): 20 categories; people/capacity, knowledge in heads, owner bottlenecks, Excel double entry, disconnected systems, cash flow, margin, staffing, forecasting, compliance, security, continuity, customer retention and more. Selected public entrepreneur voice stories are *qualitative, not representative statistics*.
2. [Voice of Customer and problem radar skill](https://app.notion.com/p/3e5da36aac8a8115a86fdb9ae3882115): complaint → symptom → root cause → impact → source and validation. Its company SEO/CTA recipe must NOT be copied to Arthur's personal profile.
3. [Value Proposition Canvas](https://app.notion.com/p/3b1da36aac8a81fba736c4897474902b): pain of knowledge in heads, costly IT projects, unused software, vendor lock-in, human searching/double work, and AI noise. Proposed benefits remain hypotheses pending customer verification.
4. [Three channels one story](https://app.notion.com/p/3c0da36aac8a81f589c1f34225dfcaf3): Arthur speaks personally and authentically about his actual founder/engineering journey; the business LinkedIn page communicates company capabilities, commercial context, impact and offers; Mira portrays fictional people only with explicit disclosure. No shared copy.
5. [Personal skill](https://app.notion.com/p/3e1da36aac8a818686c7cc61ff52d7f2) and [profile rules](https://app.notion.com/p/3b9da36aac8a81779e00ffecaa340fd5): 19 Nov breadth overrides stale 16 Nov life-only exclusions for evidence-backed technical founder stories, while all personal truth, privacy and anti-dup rules remain. 20 Nov #6062 and #6063 separately support unified AI-native software founder positioning.

## Material missing runtime connection
The original content orchestrator prompt referenced `entrepreneur_problem_sources` and `search_demand_sources`, yet `artifactInput` did not have either property. A prompt alone does not connect the editorial agent to evidence. The unchanged `public.powerhouse_mira_problem_signals_v1` already holds source URLs, dates, excerpts, source categories, uniqueness and validity flags; do not create a competing problem database or new scheduler.

## Smallest safe implementation
- Only in independently verified personal AI builder mode, make a bounded, read-only query of eligible and recently observed public problem signals; require public URL, date and nontrivial explanation, deduplicate by topic, maximum 12 sources.
- Supply the `entrepreneur_problem_sources` property to the original LLM artifact payload, labeled `EXTERNAL_ENTREPRENEUR_FRICTION_CONTEXT_ONLY` and `proof_of_arthur_experience:false`. With no sources, send the explicit `NO_VALID_EXTERNAL_CONTEXT` state and never invent.
- The original prompt and skill require at most one relevant entrepreneur/human pain point and one genuine Arthur technical design decision, framed as ONE AI-native software+data+BI system. Preserve variety across recurring frictions and prior post patterns; do not cram all 20 themes into each post.
- An external entrepreneur's complaint cannot prove that Arthur met or served that entrepreneur. A personal life story does not have to teach a business lesson. No invented metrics, clients, outcomes or successful products.
- Do not change any publish, review, member-auth, provider uniqueness, original scheduler, final-text hash or Heartbeat owner.

## Acceptance / truth
Protected Required tests, CodeQL, preview, protected merge, deployed source parity of the original edge function, one source-verified personal founder recommendation, independent final-content reviewer, exact provider ID/readback, then Heartbeat measurement. PR exists != live personal LinkedIn post. All failed steps remain OPEN until independently verified.
