-- Idempotent desired-state replay of two already-applied source-proven original production migrations.
-- Proven original failures: PostgREST 2201B (regex bound >255), 23502 (missing NOT NULL started_at).
-- Preserve original SECURITY DEFINER/search_path and human-approval experiment gates.
CREATE OR REPLACE FUNCTION public.bg_experimentcyclus_poort(p_actie text, p_voorstel jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id text; v_pagina text; v_meetpunt text;
begin
  if p_actie = 'beoordelen' then return intern.bg_experimenten_beoordelen();
  elsif p_actie = 'data' then return jsonb_build_object('meet', intern.bg_meetcijfers(30), 'cyclus', intern.bg_salescyclus_cijfers(30));
  elsif p_actie = 'voorstellen' then
    v_pagina := p_voorstel->>'pagina'; v_meetpunt := p_voorstel->>'meetpunt';
    if coalesce(p_voorstel->>'hypothese', '') = '' or (v_pagina !~ '^/[^?#[:space:]]*$' or char_length(v_pagina) > 300)
       or v_meetpunt !~ '^(klik:.{2,60}|klik_doel:.{2,80}|scroll:(25|50|75|90|100)|formulier|lead|gesprek|offerte|order)$'
       or coalesce(p_voorstel->>'onderdeel', '') not in ('site', 'seo', 'content', 'dm') then
      raise exception 'ONGELDIG_VOORSTEL';
    end if;
    v_id := 'bgx-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(v_pagina || v_meetpunt || now()::text), 1, 6);
    insert into public.social_experiments (tenant_id, experiment_id, hypothesis, primary_metric, comparison_scope, status, started_at, created_at, updated_at,
      onderdeel, pagina, controle, variant, meetpunt, min_steekproef, looptijd_dagen, onderbouwing, voorgesteld_door)
    values ('bedrijfsgeheugen', v_id, left(p_voorstel->>'hypothese', 400), v_meetpunt,
      jsonb_build_object('methode', 'zelfde pagina vóór vs tijdens', 'pagina', v_pagina), 'PLANNED', now(), now(), now(),
      p_voorstel->>'onderdeel', v_pagina, left(p_voorstel->>'controle', 300), left(p_voorstel->>'variant', 400), v_meetpunt,
      greatest(20, least(coalesce((p_voorstel->>'min_steekproef')::int, 50), 500)), greatest(7, least(coalesce((p_voorstel->>'looptijd_dagen')::int, 21), 60)),
      left(p_voorstel->>'onderbouwing', 800), 'bg-experimentcyclus');
    return jsonb_build_object('experiment_id', v_id);
  end if;
  raise exception 'ONBEKENDE_ACTIE';
end $function$

