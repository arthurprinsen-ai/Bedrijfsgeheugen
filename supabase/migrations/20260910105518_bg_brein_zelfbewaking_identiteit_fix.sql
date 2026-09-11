create or replace function intern.bg_brein_zelfbewaking()
returns jsonb language plpgsql security definer set search_path='' as $$
declare r record; n int := 0; fouten int := 0; uur text := to_char(date_trunc('hour', now()),'YYYY-MM-DD"T"HH24'); h text;
begin
  for r in select * from intern.bg_brein_status_oordeel where oordeel <> 'WERKT' loop
    h := md5(coalesce(r.toelichting,'')||r.oordeel);
    begin
      perform public.brain_observe_failure(
        'zelfbewaking:'||r.bron||':'||r.oordeel||':'||left(h,8)||':'||uur,
        'brein-status|'||r.bron||'|'||r.oordeel, h,
        jsonb_build_object('onderdeel',r.onderdeel,'oordeel',r.oordeel,'laatst_bewezen',r.laatst_bewezen,'uren_geleden',r.uren_geleden,'max_uren',r.max_uren,'toelichting',r.toelichting,'bron','intern.bg_brein_zelfbewaking'));
      n := n+1;
    exception when others then fouten := fouten+1;
    end;
  end loop;
  return jsonb_build_object('gecontroleerd',(select count(*) from intern.bg_brein_status_oordeel),'niet_werkend',n,'meldfouten',fouten,'tijd',now());
end $$;
revoke all on function intern.bg_brein_zelfbewaking() from public, anon, authenticated;