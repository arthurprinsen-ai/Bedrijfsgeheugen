
create index if not exists bg_connecties_canonical_person_key_idx
on public.bg_connecties ((coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),''))))
where coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),'')) is not null;

create index if not exists bg_connecties_linkedin_url_trim_idx
on public.bg_connecties ((trim(linkedin_url)))
where nullif(trim(linkedin_url),'') is not null;
