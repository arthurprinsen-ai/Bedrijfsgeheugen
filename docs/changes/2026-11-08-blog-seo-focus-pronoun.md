# Blog: pronoun as SEO focus keyword — 2026-11-08

## Problem
The articles of 7 and 8 Nov were published with the titles `je Twinfield: wat verandert er voor jou?` and `jouw MKB: wat verandert er voor jou?`, and the same pronoun phrase as keyword, heading and figure caption.

## Cause
`seo_focus` in `tools/site-shell/publish_powerhouse_blog_artifact.py` skipped question openers (hoe, wat, ...) but not pronouns, so `Hoe je Twinfield-koppeling ...` gave the focus `je Twinfield`; `seo_title` then built the generic title from it.

## Change
- `seo_focus`: pronouns (je, jij, jouw, jullie, u, uw, zich, mijn, ons, onze, we, wij) are skipped like question openers.
- Both articles, `blog/index.html`, `blog/rss.xml` and the two English caches corrected (`je Twinfield` -> `Twinfield`, `jouw MKB` -> `MKB` / `het MKB`). Slugs and canonical URLs unchanged.
- `tests/brain-blog-seo-focus-pronoun-20261108.test.mjs`: runs `seo_focus` on both real titles and scans every committed article; new step in `required-test.yml`.

## Not changed
The generic fallback title `<focus>: wat verandert er voor jou?` and the templated headings are unchanged. The text of the articles was not rewritten. No test weakened.

## Known limit
Not proven live until the deploy readback; the next generated article shows whether the generator fix holds.
