# Bilingual SEO locale entity normalization

The exact Netlify build correctly produced English titles such as `AFAS Integration & API Connection`, but serialized HTML contains `&amp;`. The locale validator compared raw serialized text to semantic map values and therefore reported false mismatches.

The validator now decodes standard HTML entities before comparing titles and metadata. Real title, keyword, canonical and hreflang mismatches remain fail-closed.
