# Development ledger — bounded OpenAI word-count recovery

- Date: 2026-10-19
- Obligation-ID: native-approved-blog-bounded-wordcount-retry-20261019
- Failure evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39303086998
- Observed: OpenAI generated an invalid-length article, rejected before Notion with `OPENAI_BLOG_WORD_COUNT_INVALID`.
- Action: maximum three whole-candidate attempts on this one recoverable validation failure, with a tighter target of 1100–1250 words.
- Prevention: deterministic regression replay for successful retry, exhausted retry, provider-data minimization and unrelated-error fail-closed behavior.
- No bypass: original strict 900–1500 word validator, Notion approval and duplicate protection remain unchanged.
- Terminal proof required: exact-head CI + CodeQL, protected merge, successful native supply and Notion row readback.
