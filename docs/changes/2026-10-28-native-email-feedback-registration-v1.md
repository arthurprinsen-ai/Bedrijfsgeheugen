# Native email feedback deployment registration

Protected PR #5039 merged as 28a0700d1a888ec588504c808f44632083ae4e6b. Actual provider preview jlmwhsgffumljiusjuoj had exact orchestrator v377 and its shared feedback helper, but composer remained old v29 without the helper despite a successful Supabase Preview check. The existing composer was absent from supabase/config.toml.

Register only that existing function: enabled=true, its existing index.ts entrypoint and deployed verify_jwt=false. Internal x-powerhouse-token authentication remains enforced by the unchanged composer. This changes deployment inventory, not permissions, scheduler, sender, model or recipient selection. No direct provider deployment or replay of historical migrations.

The regression failed on the absent native registration before the configuration change and passes afterward. Acceptance requires exact-head Required/BRAIN/CodeQL/native preview, exact actual composer source plus packaged helper in preview, protected merge, native Git integration production and independent entry/helper parity for both consumers. No new send, causal improvement or paid revenue is inferred from source rollout. Any old prepared/frozen artifact remains immutable.

Existing source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5039
