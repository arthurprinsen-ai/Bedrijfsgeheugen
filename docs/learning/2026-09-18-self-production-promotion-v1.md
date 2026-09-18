# Autonomous production promotion — 2026-09-18

Powerhouse chats, agents, workflows en skills zijn uitvoeringsnodes. Binnen bestaande autoriteit eindigt een materiële wijziging niet bij code, PR, preview, groene CI of merge-ready.

Zodra de verplichte exact-head gates terminal groen zijn, is de actuele geautoriseerde execution node eigenaar van de protected merge/promotion, productie-deploy of migratie, productie/provider-readback, outcome/value-verificatie, learning/prevention-writeback en next-agent discoverability. Routine merge/deploy wordt niet teruggegeven aan de gebruiker; alleen een echte authorization boundary mag autonome promotie stoppen.

De snelle ontwikkelstraat gebruikt parallelle specialist-agents voor onafhankelijke work packages, maar één rolling integrator per conflict-contract. Mutable resources worden alleen op het integratiepunt geserialiseerd. Voor Supabase-migraties wordt de definitieve versie pas bij integratie toegewezen en vooraf op uniciteit gecontroleerd.

De delivery supervisor is progress-aware. ZERO_RUN, PARTIAL_START en stale queued work worden hersteld op exact dezelfde kandidaat. Een gezonde current-head job die in progress is, wordt nooit alleen vanwege de leeftijd van de PR-head geannuleerd.

Tijdens TERMINAL_DELIVERY geldt één obligation-scoped writer lease. Niet-eigenaren muteren de branch niet; zij defereren en hergebruiken dezelfde lineage. Een onverwachte head-mutatie faalt gesloten en wordt opnieuw aan de actuele exact-head gebonden.

Incidentlessen van vandaag:
- parallelle workers kozen dezelfde migratie-timestamp;
- head-age gebaseerde recovery kon gezonde jobs thrashen;
- meerdere writers raakten dezelfde terminal branch;
- PR-metadata liep achter op de Git-ref;
- duplicate PRs voor één obligation veroorzaakten extra CI-fanout.

Permanente preventie:
- final migration version allocation bij rolling integration;
- progress timestamps in plaats van head-age voor queue recovery;
- één terminal writer lease;
- exact Git-ref/current-main identity als recovery authority;
- duplicate same-obligation lineages consolideren;
- impact-scoped parallel tests voor snelle feedback, met protected exact-head gates, security, production readback en learning-writeback als niet-overslaande eindvoorwaarden.

Fingerprints:
- `powerhouse-self-production-promotion-v1`
- `delivery|same-lineage|parallel-writer-head-thrash-v1`
- `migration-version-allocation|rolling-integrator|v1`
- `delivery-recovery|progress-aware|v1`
