# Personal LinkedIn posts into the learning index

`bg-social-metrics-sync` gets `registerPersonalProofs`, backed by `_shared/verified-personal-publication-registry.mjs`. Rows from `content_publication_obligations` (tenant canonical, channel `linkedin_personal`, PUBLISHED with `provider_publication_ack_verified=true`, or LIVE_PROVEN) are upserted into `social_posts` as `linkedin-personal:<id>` with `ignoreDuplicates`. The existing `linkedin()` reaction readback then measures them.

No publishing, no metrics or revenue written at registration, no new scheduler. The STORY_FAMILY_DUPLICATE blocks on 16, 17, 18, 21 and 26 Oct are not changed here.
