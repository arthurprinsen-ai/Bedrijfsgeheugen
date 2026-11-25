# Mira media preflight preserves asynchronous producer claims

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

The same real 19-October media job was atomically claimed for OpenArt generation. The canonical router readiness tick demoted CLAIMED to WAITING_ASSET because the pending job did not yet have an asset URL. The bounded completion RPC correctly refused MEDIA_JOB_NOT_CLAIMED:WAITING_ASSET. Recovery reclaimed only the exact owned job/history in one transaction; no second job or publication was created.

The router now leaves CLAIMED/GENERATING untouched. Other existing-row readiness updates require id+updated_at compare-and-swap. If a worker claims or verifier writes after the initial read, preflight returns STATE_CHANGED_RETRY before changing publication obligation evidence. Concurrent first insert conflicts also require reread. Provider/identity/frame/temporal/dedupe gates stay unchanged.

Five targeted regressions cover a pending URL-less producer, a claim acquired between read and write, an unchanged row/insert contention, router integration and preservation of bounded provider failure. Protected Required/CodeQL, genuine Supabase promotion/source parity and a real readiness tick against a safely owned job remain necessary before LIVE_PROVEN. A code fix does not validate rejected Mira assets: request8021 identity0.85 and request8024 identity0.92 both remain below0.94.

Final bounded asset generation history dGFvtRIOgXdveIVQNySd was rejected by Google Responsible AI input moderation (input_moderation_blocked) before an asset existed. No fourth automatic generation or moderation workaround. Provider review or compliant verified canonical media is a hard external boundary; earlier rejected assets remain rejected.
