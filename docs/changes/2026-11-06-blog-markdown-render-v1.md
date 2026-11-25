# Daily blog renderer: markdown no longer leaks into headings and paragraphs — 2026-11-06

## Problem
Live article of 6 November: six paragraphs show literal `- ` list lines and five headings are over 200 characters (whole sections), also in the table of contents. Counted in committed HTML, 5 of the 7 recent daily articles have it (15, 22, 23, 24 October and 6 November). It was found through `STATIC_I18N_CACHE_INCOMPLETE` on main, which was a symptom of the same malformed text nodes.

## Cause
`body_html` in `tools/site-shell/publish_powerhouse_blog_artifact.py` took everything after `## ` as the heading, including list lines that follow without a blank line, and wrote blocks mixing text and `- ` lines as one paragraph. Only all-list blocks and a bold first line plus list were recognised. `faq_items` already reads the same source shape correctly.

## Change
- A heading is its first line only; the rest of the block is rendered as paragraph or list.
- Blocks mixing text and list lines become separate `p` and `ul` elements.
- `assert_rendered_body_clean` fails closed before the page is written: `MARKDOWN_LIST_IN_P`, `MARKDOWN_LIST_IN_H2`, `MARKDOWN_LIST_IN_H3`, `HEADING_TOO_LONG` (over 160 characters).
- Blocker register entry, one lesson and one rule, test `tests/brain-blog-markdown-render-20261106.test.mjs` in the required check.

## Not changed
Seven shapes that already rendered correctly are byte-identical. Articles that are already published, the blog index excerpt, the source generator and the translation patch generator are untouched.

## Known limits
- **The five affected articles on the live site are not repaired by this change.** They need a re-render or a reviewed in-place refresh per article.
- The reconstruction used for the before and after comparison is rebuilt from the published HTML, not the original Supabase source.
- The new check blocks a daily publication when the source still has a shape the renderer does not handle; that is intended, and it then fails with a named code instead of publishing a broken page.
- The blog index card excerpt is cut at 220 characters and can end mid-word (`ext…`); not changed here.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure. The next daily blog run is the first real proof on a new source.
