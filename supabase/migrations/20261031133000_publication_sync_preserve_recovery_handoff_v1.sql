-- 31 Oct 2026 — P0 #4198: terminate original publication recovery next_action rewrite loop.
-- Production root: sync_content_publication_obligations() ON CONFLICT rewrote
-- PLANNED next_action to vague defaults on each original pre/post reconciliation,
-- after the original ONE BRAIN had just written exact owner/action.
-- Existing rows retain their authoritative original owner-controlled next_action;
-- only genuinely changed experiment/format metadata may be updated. This never
-- creates a publisher, changes provider evidence/ID/status, or bypasses consent.
-- Preserve existing signature, SECURITY DEFINER, search_path and EXECUTE grants.
-- New rows retain the original default planning action until original Brain
-- independently assigns a typed recovery responsibility.
CREATE OR REPLACE FUNCTION public.sync_content_publication_obligations(p_from date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date, p_to date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count integer := 0;
begin
 if p_from is null or p_to is null or p_to<p_from then raise exception 'INVALID_PUBLICATION_RANGE'; end if;
 insert into public.content_publication_obligations(
 tenant_id,publication_date,channel,experiment_id,content_kind,status,next_action,updated_at
 )
 select 'canonical', e.calendar_date,ch.channel,e.experiment_id,
   case when ch.channel='blog' then 'blog' else 'social' end,'PLANNED',
   case when ch.channel='blog' then
     'Selecteer exact één goedgekeurde due slug en lever via candidate PR → BG169 → live proof.'
   else 'Genereer/publiceer via de bestaande kanaallane en koppel live bewijs plus metrics terug.'
   end,now()
 from public.social_experiments e
 cross join lateral (select distinct value as channel
   from jsonb_array_elements_text(coalesce(e.target_channels,'[]'::jsonb)) as c(value)) ch
 where e.calendar_date between p_from and p_to and e.tenant_id='canonical'
   and ch.channel in ('linkedin_personal','linkedin_company','instagram','blog')
 on conflict (tenant_id,publication_date,channel) do update
 set experiment_id=excluded.experiment_id,
     content_kind=excluded.content_kind,
     updated_at=now()
 where (content_publication_obligations.experiment_id,
        content_publication_obligations.content_kind)
   is distinct from
       (excluded.experiment_id,excluded.content_kind);
 get diagnostics v_count=row_count;
 return v_count;
end;$function$
