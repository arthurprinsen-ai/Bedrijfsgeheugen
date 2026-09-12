-- 1. Eigen token voor terugkoppeling van uitkomsten, in de vault (niet in code)
do $$
declare v_token text := encode(gen_random_bytes(24),'hex');
begin
  if not exists (select 1 from vault.decrypted_secrets where name='bg_uitkomst_terugkoppeling_token') then
    perform vault.create_secret(v_token,'bg_uitkomst_terugkoppeling_token','Token waarmee bg_uitkomst_vastleggen uitkomsten terugmeldt aan powerhouse-runtime');
    insert into public.powerhouse_device_tokens(token_hash,label,scopes,active)
    values (encode(digest(v_token,'sha256'),'hex'),'bg-uitkomst terugkoppeling', array['outcomes'], true);
  end if;
end $$;

-- 2. Uitkomst vastleggen sluit nu beide lussen: de groeitrechter én het powerhouse-brein
create or replace function public.bg_uitkomst_vastleggen(
  p_fase text,
  p_pagina text default null,
  p_omzet_eur numeric default 0,
  p_bron text default 'handmatig',
  p_attributiesleutel text default null,
  p_eigenaar text default null,
  p_extra jsonb default '{}'::jsonb,
  p_action_id text default null,
  p_uitkomstsoort text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id text := gen_random_uuid()::text;
  v_root text := coalesce(p_attributiesleutel, p_pagina, p_bron);
  v_soort text := coalesce(p_uitkomstsoort, case p_fase
      when 'won_order' then 'order' when 'revenue' then 'revenue'
      when 'proposal' then 'offer' when 'appointment' then 'meeting'
      when 'qualified_lead' then 'lead' else 'lead' end);
  v_token text;
  v_teruggemeld boolean := false;
begin
  perform public.bg_growth_ingest_outcome(jsonb_build_object(
    'outcome_id', v_id, 'stage', p_fase, 'attribution_root_key', v_root,
    'canonical', p_pagina, 'intent_owner', p_eigenaar,
    'revenue_eur', coalesce(p_omzet_eur,0), 'source', p_bron,
    'payload', coalesce(p_extra,'{}'::jsonb) || jsonb_build_object('action_id', p_action_id)));

  if p_action_id is not null then
    select decrypted_secret into v_token from vault.decrypted_secrets
    where name='bg_uitkomst_terugkoppeling_token' order by created_at desc limit 1;
    if v_token is not null then
      perform net.http_post(
        url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-runtime/outcomes',
        headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
        body := jsonb_build_object('action_id',p_action_id,'outcome_type',v_soort,
                'revenue_eur',coalesce(p_omzet_eur,0),
                'evidence',jsonb_build_object('growth_outcome_id',v_id,'bron',p_bron)));
      update public.powerhouse_sales_actions
        set status='done', executed_at=now(), updated_at=now()
      where action_id::text = p_action_id;
      v_teruggemeld := true;
    end if;
  end if;

  return jsonb_build_object('outcome_id',v_id,'fase',p_fase,'omzet_eur',coalesce(p_omzet_eur,0),
                            'teruggemeld_aan_brein',v_teruggemeld);
end;
$$;

-- 3. Wat het brein vandaag heeft klaargezet, in één weergave
create or replace view public.bg_vandaag as
select round(a.priority) as prioriteit,
       coalesce(a.person_name,'?') as persoon,
       coalesce(a.company_name,'') as bedrijf,
       coalesce(a.role,'') as rol,
       a.channel as kanaal,
       a.action_type as soort,
       a.message_draft as tekst_om_te_versturen,
       a.reason as waarom,
       a.source_url as link,
       a.action_id::text as action_id
from public.powerhouse_sales_actions a
where a.status = 'suggested'
  and coalesce(a.subject_key,'') not ilike '%test%'
order by a.priority desc;

grant select on public.bg_vandaag to authenticated, service_role;
grant execute on function public.bg_uitkomst_vastleggen(text,text,numeric,text,text,text,jsonb,text,text) to authenticated, service_role;
