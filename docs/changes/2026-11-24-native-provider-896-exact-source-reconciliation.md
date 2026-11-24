# Exacte native provider migratie-bronpariteit — 24 november 2026

Bestaande Supabase-productie `adhjwmvyoixzjtmiroln` heeft **896** daadwerkelijk toegepaste migraties. De oorspronkelijke protected GitHub `main` heeft nog **892** bestanden/lock-identiteiten. De vier ontbrekende migraties (#893–896) zijn afkomstig uit het bestaande originele social-PR [#6136](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6136) en zijn in productie **al toegepast**. Een nieuw inhoudelijk social- of e-mailsysteem is niet nodig.

Deze beperkte release herstelt uitsluitend de vier **exact identieke Git-blobs** met hun echte provider-versie en naam plus de append-only `supabase/migration-history.lock.json`. Er wordt **geen SQL uitgevoerd** door deze registratiecorrectie. Bestaande 892 eerdere versie-identiteiten blijven identiek. Nieuwe test borgt alle vier de hashes; beveiligde PR/CI, source contract en onafhankelijke providerreadback blijven nodig.

De volledige social-agent-PR heeft inmiddels twee gewijzigde bestanden die conflicteren met nieuwere `main`-code; die inhoud mag niet ongericht worden overgeschreven. De bronpariteitsrelease kan los, waarna de oorspronkelijke social-owner zijn overige code veilig integreert. Afhankelijke oorspronkelijke e-mailagent-PR [#6141](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6141) wordt pas weer beoordeeld nadat protected main en providerhistory overeenkomen. Dit is geen bewijs van Gmail-verzending, consent of gerealiseerde omzet.

## Independent provider statement byte verification and strict protected CI admission

Independently queried `supabase_migrations.schema_migrations.statements[1]` for the four exact native provider versions. Original Git source has one redundant trailing `";\n"` relative to native execution record; each `source.slice(0,-2)` equals the corresponding actual native provider statement text **byte for byte**. Provider statement MD5 values in version order:

- `20261124063737` — `e6880cd1a3b70097ae2b477bebc2cfd6`
- `20261124063938` — `6855074f8eb8c2723e21cc931a5e1050`
- `20261124064216` — `efd6420d1a0a6cfc6e601cb3a91ff012`
- `20261124064859` — `000e953a8df582f4aed591a458000fe3`

Original protected migration admission correctly rejects ordinary PRs claiming newly applied SQL. For this one already-applied native history reconciliation, add `tools/ci/verified-original-provider-896-source-lock-reconciliation.mjs`, **pinned to exact original protected base `f0921c24e730d983fed3fb3f225a04fd7e1c5d72`**, exact four filenames, original Git blob SHA1s, exact source prefix 892 entries, four independently observed provider statements' MD5 and immutable project/ref/time/order. Any different base, source, metadata, SQL, version or extra migration remains denied. The protected gate's one-time branch still requires full existing test suites, CodeQL and hosted Supabase Preview. A PR is not provider execution proof; no SQL is replayed here.
