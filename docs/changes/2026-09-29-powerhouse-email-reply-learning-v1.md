# Commercial email reply → revenue learning v1 — 29 september 2026

De bestaande Powerhouse Growth & Revenue OS is uitgebreid zodat commerciële e-mail niet meer eindigt bij **sent**. De canonieke keten verwerkt Gmail-replies exact-once, classificeert ze, activeert suppression of een gededupliceerde vervolgactie en projecteert het resultaat naar revenue-first learning.

Productieproof:
- DID Telecom: `objection_need`; actieve suppressie omdat de ontvanger zelf contact opneemt wanneer de situatie verandert.
- Tech Festival: `objection_timing`; één nurture-action met context rond 9 juni 2027.
- Twee reply-events en twee sales outcomes zijn read-after-write geverifieerd.
- De learning projection telt beide objections mee.
- De tijdelijke parallelle reply-cron is verwijderd; de bestaande Growth & Revenue OS blijft enige owner.
- De bestaande strikte cycle-stage guard is behouden; latere replies behouden hun oorspronkelijke action-lineage via reply-event/outcome evidence.

Runtime: `powerhouse_email_reply_events`, `powerhouse_email_contact_suppressions`, `powerhouse_email_learning_stats`, `powerhouse_email_suppression_guard_v1`, `powerhouse_refresh_email_learning_stats()`.
