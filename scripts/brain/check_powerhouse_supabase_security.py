#!/usr/bin/env python3
import re
import subprocess
import sys
from pathlib import Path

CREATE_TABLE = re.compile(r"create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)", re.I)
CREATE_VIEW = re.compile(r"create\s+(?:or\s+replace\s+)?view\s+public\.([a-zA-Z0-9_]+)", re.I)
CREATE_FUNCTION = re.compile(r"create\s+(?:or\s+replace\s+)?function\s+public\.([a-zA-Z0-9_]+)\s*\(", re.I)
SECURITY_DEFINER = re.compile(r"security\s+definer", re.I)

# Immutable production-ledger mirrors can predate this security gate. They are exempt
# only while their Git blob is byte-for-byte the reviewed production statement.
# Any edit changes the blob SHA and immediately restores normal fail-closed checking.
HISTORICAL_PRODUCTION_MIRROR_BLOBS = {
    "supabase/migrations/20260914081052_predictive_intelligence_first_mover_v1.sql": "ab6713e1057da039a7f1725a7bc05116a46299c7",
    "supabase/migrations/20260914081911_predictive_first_mover_contract_v1_hardening.sql": "1324acc5f67238980ef5f31dad91df7aaeefdf94",
    "supabase/migrations/20260914082435_predictive_first_mover_obligations_and_guard_v1.sql": "a18a4ee8fa018d5dd06621a7ea3fd9a52a54fa2a",
}


def historical_mirror_is_exact(path: Path) -> bool:
    expected = HISTORICAL_PRODUCTION_MIRROR_BLOBS.get(path.as_posix())
    if not expected or not path.exists():
        return False
    actual = subprocess.run(["git", "hash-object", str(path)], check=True, capture_output=True, text=True).stdout.strip()
    return actual == expected


def check_sql(sql: str, label: str):
    errors = []
    low = sql.lower()

    for table in CREATE_TABLE.findall(sql):
        rls_pat = re.compile(rf"alter\s+table\s+(?:if\s+exists\s+)?public\.{re.escape(table)}\s+enable\s+row\s+level\s+security", re.I)
        revoke_pat = re.compile(rf"revoke\s+all\s+on\s+(?:table\s+)?public\.{re.escape(table)}\s+from\s+[^;]*(?:anon[^;]*authenticated|authenticated[^;]*anon)", re.I | re.S)
        if not rls_pat.search(sql):
            errors.append(f"{label}: public.{table} is created without ENABLE ROW LEVEL SECURITY in the same migration")
        if not revoke_pat.search(sql):
            errors.append(f"{label}: public.{table} is created without revoking broad anon/authenticated table privileges in the same migration")

    for view in CREATE_VIEW.findall(sql):
        intentional = (
            f"POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL_VIEW:{view}" in sql
            or "POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL_VIEW" in sql
        )
        alter_invoker_pat = re.compile(rf"alter\s+view\s+public\.{re.escape(view)}\s+set\s*\(\s*security_invoker\s*=\s*true\s*\)", re.I)
        inline_invoker_pat = re.compile(rf"create\s+(?:or\s+replace\s+)?view\s+public\.{re.escape(view)}\s+with\s*\(\s*security_invoker\s*=\s*true\s*\)", re.I)
        revoke_pat = re.compile(rf"revoke\s+all\s+on\s+(?:table\s+)?public\.{re.escape(view)}\s+from\s+[^;]*(?:public[^;]*anon[^;]*authenticated|public[^;]*authenticated[^;]*anon|anon[^;]*authenticated|authenticated[^;]*anon)", re.I | re.S)
        if not intentional:
            if not (alter_invoker_pat.search(sql) or inline_invoker_pat.search(sql)):
                errors.append(f"{label}: public.{view} is created without security_invoker=true in the same migration")
            if not revoke_pat.search(sql):
                errors.append(f"{label}: public.{view} is created without revoking browser-role view privileges in the same migration")

    if SECURITY_DEFINER.search(sql):
        intentional = "POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL" in sql
        revoke_exec = "revoke execute on function" in low and "from public" in low and "anon" in low and "authenticated" in low
        if not intentional and not revoke_exec:
            errors.append(f"{label}: SECURITY DEFINER introduced without fail-closed EXECUTE revocation or explicit POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL marker")

    for fn in CREATE_FUNCTION.findall(sql):
        fn_mentioned = re.search(rf"alter\s+function\s+public\.{re.escape(fn)}\s*\([^;]*\)\s+set\s+search_path", sql, re.I | re.S)
        body_has_set = re.search(r"set\s+search_path\s+(?:to|=)", sql, re.I)
        if not fn_mentioned and not body_has_set:
            errors.append(f"{label}: public.{fn} is created/replaced without deterministic search_path")
    return errors


def self_test():
    unsafe_table = "create table public.bad_table(id bigint);"
    unsafe_view = "create view public.bad_view as select 1 as id;"
    unsafe_fn = "create function public.bad_fn() returns void language plpgsql security definer as $$ begin null; end $$;"
    safe_table = "create table public.good_table(id bigint); alter table public.good_table enable row level security; revoke all on table public.good_table from anon, authenticated; grant all on table public.good_table to service_role;"
    safe_view = "create view public.good_view as select 1 as id; alter view public.good_view set (security_invoker = true); revoke all on table public.good_view from public, anon, authenticated; grant select on table public.good_view to service_role;"
    safe_inline_view = "create or replace view public.good_inline_view with (security_invoker = true) as select 1 as id; revoke all on public.good_inline_view from public, anon, authenticated; grant select on public.good_inline_view to service_role;"
    public_view_exception = "-- POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL_VIEW:public_view\ncreate view public.public_view as select 1 as id;"
    safe_fn = "create function public.good_fn() returns void language plpgsql security definer set search_path = public, pg_catalog as $$ begin null; end $$; revoke execute on function public.good_fn() from public, anon, authenticated; grant execute on function public.good_fn() to service_role;"
    public_exception = "-- POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL\ncreate function public.public_fn() returns void language plpgsql security definer set search_path = public, pg_catalog as $$ begin null; end $$;"
    assert len(check_sql(unsafe_table, "unsafe_table")) == 2
    unsafe_view_errors = check_sql(unsafe_view, "unsafe_view")
    assert any("security_invoker" in e for e in unsafe_view_errors)
    assert any("view privileges" in e for e in unsafe_view_errors)
    unsafe_fn_errors = check_sql(unsafe_fn, "unsafe_fn")
    assert any("SECURITY DEFINER" in e for e in unsafe_fn_errors)
    assert any("search_path" in e for e in unsafe_fn_errors)
    assert check_sql(safe_table, "safe_table") == []
    assert check_sql(safe_view, "safe_view") == []
    assert check_sql(safe_inline_view, "safe_inline_view") == []
    assert check_sql(public_view_exception, "public_view_exception") == []
    assert check_sql(safe_fn, "safe_fn") == []
    assert check_sql(public_exception, "public_exception") == []
    print("Powerhouse Supabase security contract self-test passed: unsafe tables/views/functions blocked, safe fixtures accepted.")


if "--self-test" in sys.argv:
    self_test()
    sys.exit(0)

BASE = sys.argv[1] if len(sys.argv) > 1 else "origin/main"
HEAD = sys.argv[2] if len(sys.argv) > 2 else "HEAD"
result = subprocess.run(["git", "diff", "--name-only", f"{BASE}...{HEAD}", "--", "supabase/migrations/*.sql"], check=True, capture_output=True, text=True)
files = [Path(p) for p in result.stdout.splitlines() if p.strip()]
if not files:
    print("No changed Supabase migrations; security contract passes.")
    sys.exit(0)

errors = []
mirrors = []
for path in files:
    if not path.exists():
        continue
    if historical_mirror_is_exact(path):
        mirrors.append(path.as_posix())
        continue
    errors.extend(check_sql(path.read_text(encoding="utf-8"), str(path)))

if errors:
    print("Powerhouse Supabase security contract FAILED:\n")
    for error in errors:
        print(f"- {error}")
    print("\nRequired contract: RLS + revoked browser roles for new public tables; security_invoker + revoked browser roles for new internal public views; deterministic search_path for functions; SECURITY DEFINER must be internal/revoked or explicitly reviewed as PUBLIC_INTENTIONAL. Historical production mirrors are exempt only at an exact reviewed Git blob SHA.")
    sys.exit(1)

if mirrors:
    print("Verified immutable historical production mirrors: " + ", ".join(mirrors))
print(f"Powerhouse Supabase security contract passed for {len(files)} changed migration(s).")
