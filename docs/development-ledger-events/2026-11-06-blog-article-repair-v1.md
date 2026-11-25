# Seven published blog articles repaired — development ledger

- 2026-11-06, owner: daily blog publisher and the published articles under `blog/`.
- Fingerprint: `powerhouse|daily-blog|published-articles-markdown-repair|20261106-v1`.
- Source: owner instruction "Los alles op" after PR #5505; scan of all 46 articles found seven with the defect.
- Repair: in-place structure repair, FAQ and FAQPage regenerated, 326-key English cache patch, corpus test, renderer tweaks (faq answers, card excerpt).
- Known limit: hand-made English for 50 nodes; nested lists flattened; the live pages are only proven after deploy and readback.
- Status: CODE_CANDIDATE, not verified until protected Required, CodeQL, Netlify preview, original BRAIN and terminal closure agree.
