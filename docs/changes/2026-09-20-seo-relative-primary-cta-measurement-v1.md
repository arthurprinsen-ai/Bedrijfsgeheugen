# SEO relative primary CTA measurement

Fingerprint: `seo-relative-primary-cta-measurement-v1`.

Production readback showed that a native money page can use a root-relative internal CTA while the SEO registry stores the same target as an absolute URL. Conversion enrichment must treat those two internal URL forms as equivalent so the primary CTA remains measurable after every production build.
