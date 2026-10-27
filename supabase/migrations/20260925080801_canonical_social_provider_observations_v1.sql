
create or replace function public.powerhouse_channel_cycle_v3()
returns trigger
language plpgsql
security invoker
set search_path=public,pg_catalog
as $$
declare
  v_provider text;
  v_source_key text;
  v_dedupe text;
begin
  perform public.powerhouse_advance_channel_cycle_v1(new.run_date,new.channel);

  v_provider := lower(coalesce(new.delivery_evidence->>'provider',''));
  if new.delivery_ref is not null and new.delivery_ref <> '' then
    if new.channel in ('linkedin_personal','linkedin_company') and v_provider='composio' then
      v_source_key := 'composio-linkedin-publication';
    elsif new.channel='instagram_company' and v_provider in ('meta','instagram','facebook') then
      v_source_key := 'meta-instagram-publication';
    else
      v_source_key := null;
    end if;

    if v_source_key is not null then
      v_dedupe := v_source_key || ':' || new.run_date::text || ':' || new.channel || ':' || new.delivery_ref;
      insert into public.powerhouse_evidence_source_observations(
        source_key,dedupe_key,external_event_id,observed_at,evidence
      ) values (
        v_source_key,v_dedupe,new.delivery_ref,now(),
        jsonb_build_object(
          'run_date',new.run_date,
          'channel',new.channel,
          'delivery_ref',new.delivery_ref,
          'provider',v_provider,
          'state',new.state,
          'truth_class','observed_provider_delivery'
        )
      )
      on conflict (dedupe_key) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists powerhouse_channel_cycle_trg on public.powerhouse_channel_decisions;
create trigger powerhouse_channel_cycle_trg
after insert or update of state,decision,delivery_ref,delivery_evidence,learning_evidence,confidence,priority
on public.powerhouse_channel_decisions
for each row execute function public.powerhouse_channel_cycle_v3();

-- Read existing channel records through the new observation writer.
update public.powerhouse_channel_decisions
set updated_at=updated_at
where run_date >= current_date - 7;
