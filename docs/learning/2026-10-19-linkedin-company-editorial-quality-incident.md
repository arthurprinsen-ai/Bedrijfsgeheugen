# 2026-10-19 — LinkedIn company editorial quality incident

## Observed (live evidence)
- 2026-10-13, 2026-10-15, 2026-10-18: LinkedIn company posts repeated the same TKI Bouw en Techniek existing-building subsidy story with different recommendation IDs. All were marked published/LIVE_PROVEN.
- 2026-10-19: a company post started with "Concrete probleem voor Directie/MT" and ran for 2,833 characters, with technical discussion of cloud agents, BI refreshes and vendor lock-in.
- A provider readback proves delivery, not that the editorial copy is on brand. **Never label this as a publisher/auth failure.**
- Previous control used automatic final_copy_approved=true for company output but no corresponding company editorial policy version. The global uniqueness gate compared full story text or provided evidence IDs, which did not prevent separate paraphrases of the same real-world news event.

## Corrective contract
- Separate audience and product positioning: the company page is for entrepreneurs' customer, time, margin, cashflow, operations and knowledge problems. The founder's journey belongs on personal LinkedIn.
- 70–175 words and no more than 1,650 characters, preferably 90–145 words; concrete problem → commercial/operational consequence → useful intervention → one next step.
- Reject formulaic "Signaal / Context / Beslissing / Actie / Leren" board memos, internal tool jargon and unverified anecdotes.
- Event-level semantic dedupe: compare the post with prior **published** company stories for the preceding 21 days, not only source IDs or exact copy. Existing global uniqueness remains mandatory.
- Generator tries one bounded editorial rewrite. If it still fails, preserve the original blocked publication attempt and continue all other channel lanes. No bypass, no synthetic green status.
- Independent bg-pre-publish-review checks identical content and previous stories again. Publisher must pass the editorial policy version and approved final text. A publication provider is never called after an editorial rejection.
- Do not retroactively delete or republish previously published posts without an explicit content decision; provider side effects stay authoritative.

## Test and release
- `tests/brain-linkedin-company-editorial-contract-v1.test.mjs` covers human copy, news story duplication, board-memo rejection, and unrelated topic diversity.
- de bestaande Required CI en verplichte Brain-leercanonicalisatie executes the regression for code changes.
- Release requires successful PR checks, branch protection, deployment of orchestrator, pre-publish review and publisher, and exact public LinkedIn readback on a future post.
- A merged source change is **not** proof that Supabase Edge Functions are deployed.
