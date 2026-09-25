# Global social-post story uniqueness v2

Date: 25 September 2026
Fingerprint: `powerhouse-global-post-story-uniqueness-v2`

The v1 exact/normalized/shingle gate correctly blocks copied text, but production replay showed that the same personal auto story on 24 and 25 September had only 0.0875 three-word-shingle similarity. Text-level similarity alone is therefore insufficient.

v2 adds two semantic safeguards:
- personal LinkedIn uses a stable SHA-256 fingerprint of verified source_text, falling back to content_id;
- all social copy uses meaningful-keyword overlap after stopword removal. Eight or more shared meaningful keywords plus Jaccard >= 0.30 is blocked.

Measured replay for 24 vs 25 September:
- 24 shared meaningful keywords;
- keyword Jaccard 0.3529;
- therefore v2 blocks the repeated auto story.

The gate still runs atomically before every provider side effect. Duplicate recovery is a genuinely different story/source/angle, never paraphrasing.
