create or replace function public.powerhouse_email_reply_followup_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_parent public.powerhouse_sales_actions%rowtype;
  v_dedupe text;
  v_action_type text;
  v_status text;
  v_due timestamptz;
begin
  select * into v_parent
  from public.powerhouse_sales_actions
  where action_id = new.action_id;

  if not found then
    return new;
  end if;

  if lower(coalesce(new.next_action,'')) in ('','none','suppress') then
    return new;
  end if;

  v_dedupe := 'email-reply-followup:' || new.provider || ':' || new.provider_message_id;
  v_action_type := case
    when lower(new.next_action) like 'nurture%' then 'follow_up'
    else 'reply_followup'
  end;
  v_status := case
    when lower(new.next_action) like 'nurture%' then 'suggested'
    else 'prepared'
  end;
  v_due := case
    when lower(new.next_action) like 'nurture%' then new.occurred_at + interval '14 days'
    else now()
  end;

  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,content_key,topic_key,campaign_key,opportunity_key,
    person_name,company_name,role,created_at,updated_at
  ) values (
    v_dedupe,
    v_parent.subject_key,
    v_parent.person_key,
    v_parent.company_key,
    v_action_type,
    'email',
    case when v_status='prepared' then 100 else 70 end,
    'Provider-confirmed Gmail reply requires canonical next-best-action follow-up.',
    jsonb_build_object(
      'parent_action_id',new.action_id,
      'reply_event_id',new.reply_event_id,
      'reply_provider_message_id',new.provider_message_id,
      'provider_thread_id',new.provider_thread_id,
      'reply_class',new.reply_class,
      'objection_code',new.objection_code,
      'next_action',new.next_action,
      'response_copy_required',true,
      'provider_readback_required',true
    ),
    '',
    '',
    v_status,
    v_due,
    v_parent.content_key,
    v_parent.topic_key,
    v_parent.campaign_key,
    v_parent.opportunity_key,
    v_parent.person_name,
    v_parent.company_name,
    v_parent.role,
    now(),
    now()
  )
  on conflict (dedupe_key) do nothing;

  return new;
end
$$;

drop trigger if exists trg_powerhouse_email_reply_followup_v1 on public.powerhouse_email_reply_events;
create trigger trg_powerhouse_email_reply_followup_v1
after insert on public.powerhouse_email_reply_events
for each row execute function public.powerhouse_email_reply_followup_v1();
