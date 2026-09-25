# 2026-09-25 — Story-level duplicate prevention v2

- Fingerprint: `powerhouse-global-post-story-uniqueness-v2`
- Replay finding: the repeated auto anecdote from 24 to 25 September scored only 0.0875 on 3-word shingles, so v1 text similarity alone would not block it.
- Keyword replay: 24 shared meaningful keywords, Jaccard 0.3529.
- Fix: personal source/story fingerprint + meaningful-keyword overlap hard gate.
- Threshold: >=8 shared meaningful keywords and Jaccard >=0.30.
- All v1 exact raw hash, normalized hash, shingle and atomic reservation safeguards remain active.
