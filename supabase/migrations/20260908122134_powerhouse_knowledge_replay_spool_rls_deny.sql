create policy powerhouse_knowledge_replay_spool_deny_client_access
on public.powerhouse_knowledge_replay_spool
for all
to public
using (false)
with check (false);