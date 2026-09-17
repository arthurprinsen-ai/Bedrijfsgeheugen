insert into public.powerhouse_legacy_learning_migrations(
  fingerprint,legacy_route,canonical_writer,superseded_by,source_issue,evidence,status
) values
('BG168/BG166/issue-1120','Make/BG168 material outcome writeback','Powerhouse/Supabase material outcome writeback','brain_obligations + canonical Powerhouse shared-memory writeback',1120,jsonb_build_object('contract','legacy-make-learning-supersession','evidence_preserved',true),'superseded'),
('BG168/BG166/issue-1153','Make/BG168 learning writeback','Powerhouse/Supabase learning writeback','canonical Powerhouse learning/outcome lineage',1153,jsonb_build_object('contract','legacy-make-learning-supersession','evidence_preserved',true),'superseded'),
('BG168/BG166/issue-813','Make/BG166 shared context projection','Powerhouse/Supabase shared current state','canonical Supabase shared-state projection',813,jsonb_build_object('contract','legacy-make-learning-supersession','evidence_preserved',true),'superseded'),
('BG168/BG166/issue-741','Make/BG168/BG166 feedback loop','Powerhouse/Supabase closed-loop writeback','canonical outcome + learning + obligation lineage',741,jsonb_build_object('contract','legacy-make-learning-supersession','evidence_preserved',true),'superseded')
on conflict (fingerprint) do update set
  legacy_route=excluded.legacy_route,
  canonical_writer=excluded.canonical_writer,
  superseded_by=excluded.superseded_by,
  source_issue=excluded.source_issue,
  evidence=public.powerhouse_legacy_learning_migrations.evidence || excluded.evidence,
  status='superseded',
  migrated_at=now();