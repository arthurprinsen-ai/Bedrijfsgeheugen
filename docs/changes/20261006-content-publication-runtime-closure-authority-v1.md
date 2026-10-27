# Canonical content-publication runtime closure authority

Daily blog candidates already have a durable runtime obligation in Supabase. The integration bundle therefore treats a pure blog publication as `canonical-runtime-obligation` and does not require duplicate learning/change/ledger files for every article.

Required test previously ignored that authority and ran the generic material-writeback guard unconditionally. The two gates could therefore disagree: the integration bundle was ready while the standalone guard blocked the exact same candidate.

This change makes the integration bundle authoritative end-to-end. The exemption is deliberately narrow: it applies only to a configured `content-publication:` obligation when every material file is under `blog/` or is `sitemap.xml`. Any control-plane or unrelated file forces normal repository-artifact closure again.
