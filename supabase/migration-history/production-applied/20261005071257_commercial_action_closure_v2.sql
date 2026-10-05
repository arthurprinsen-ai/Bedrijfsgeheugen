create or replace function public.powerhouse_commercial_action_closure_watchdog_v1(p_now timestamptz default now())
returns jsonb language plpgsql security invoker set search_path='public','pg_catalog' as $$
declare v_research int:=0; v_social_expired int:=0; v_external_wait int:=0; v_bad_research int:=0; v_bad_social int:=0; v_payload jsonb;
begin
 update public.powerhouse_sales_actions a set status='expired',updated_at=p_now,
 evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object('commercial_closure',jsonb_build_object(
 'contract','powerhouse-commercial-action-closure-v2','decision','OBSERVE','terminalized_at',p_now,
 'reason','stale internal research is evidence work, not an external execution obligation',
 'reopen_rule','only fresh material evidence may create/update a canonical next-best-action'))
 where a.action_type='research_enrichment' and a.channel in ('internal','internal_research')
 and a.status in ('suggested','prepared','waiting') and coalesce(a.due_at,a.created_at)<p_now-interval '30 minutes';
 get diagnostics v_research=row_count;

 update public.powerhouse_sales_actions a set status='expired',updated_at=p_now,
 evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object('commercial_closure',jsonb_build_object(
 'contract','powerhouse-commercial-action-closure-v2','decision','OBSERVE','terminalized_at',p_now,
 'reason','stale contextual social action lost freshness; never publish old context as delayed outreach',
 'reopen_rule','fresh provider/source evidence must generate a new deduped action through the canonical LinkedIn sales machine'))
 where a.channel in ('linkedin_comment','linkedin_personal','linkedin_company','instagram')
 and a.status in ('suggested','prepared','waiting')
 and coalesce(a.due_at,a.created_at)<p_now-interval '24 hours'
 and not coalesce((a.evidence->>'provider_ack_verified')::boolean,false);
 get diagnostics v_social_expired=row_count;

 update public.powerhouse_sales_actions a set status='waiting',updated_at=p_now,
 evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object('commercial_closure',jsonb_build_object(
 'contract','powerhouse-commercial-action-closure-v2','decision','WAIT','decided_at',p_now,
 'reason','fresh external action remains owned by canonical channel executor',
 'wait_deadline',p_now+interval '30 minutes','provider_proof_required',true))
 where a.channel not in ('internal','internal_research','linkedin_comment','linkedin_personal','linkedin_company','instagram')
 and a.status in ('suggested','prepared') and coalesce(a.due_at,a.created_at)<p_now-interval '6 hours'
 and a.action_type<>'autonomous_email';
 get diagnostics v_external_wait=row_count;

 select count(*) into v_bad_research from public.powerhouse_sales_actions
 where action_type='research_enrichment' and channel in ('internal','internal_research')
 and status in ('suggested','prepared','waiting') and coalesce(due_at,created_at)<p_now-interval '30 minutes';
 select count(*) into v_bad_social from public.powerhouse_sales_actions
 where channel in ('linkedin_comment','linkedin_personal','linkedin_company','instagram')
 and status in ('suggested','prepared','waiting') and coalesce(due_at,created_at)<p_now-interval '24 hours';

 v_payload:=jsonb_build_object('contract','powerhouse-commercial-action-closure-v2','checked_at',p_now,
 'research_terminalized_observe',v_research,'stale_social_terminalized_observe',v_social_expired,
 'external_actions_owned_wait',v_external_wait,'overdue_research_nonterminal',v_bad_research,
 'stale_social_nonterminal',v_bad_social,'healthy',v_bad_research=0 and v_bad_social=0,
 'invariant','WAIT is not parking: stale research/social closes OBSERVE; only fresh external provider work may WAIT with a deadline');
 insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
 values(p_now,'powerhouse-commercial-action-closure','commercial-execution-handoff',
 case when v_bad_research=0 and v_bad_social=0 then 'ok' else 'fout' end,
 'Commercial action lifecycle v2 reconciled.',v_payload);
 return v_payload;
end $$;
revoke execute on function public.powerhouse_commercial_action_closure_watchdog_v1(timestamptz) from public,anon,authenticated;
select public.powerhouse_commercial_action_closure_watchdog_v1(now());
