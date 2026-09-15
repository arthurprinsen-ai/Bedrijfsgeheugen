#!/usr/bin/env python3
import re
import subprocess
import sys
from pathlib import Path

CREATE_TABLE = re.compile(r"create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)", re.I)
CREATE_FUNCTION = re.compile(r"create\s+(?:or\s+replace\s+)?function\s+public\.([a-zA-Z0-9_]+)\s*\(", re.I)
SECURITY_DEFINER = re.compile(r"security\s+definer", re.I)


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

    if SECURITY_DEFINER.search(sql):
        intentional = "POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL" in sql
        revoke_exec = (
            "revoke execute on function" in low
            and "from public" in low
            and "anon" in low
            and "authenticated" in low
        )
        if not intentional and not revoke_exec:
            errors.append(
                f"{label}: SECURITY DEFINER introduced without fail-closed EXECUTE revocation or explicit "
                "POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL marker"
            )

    for fn in CREATE_FUNCTION.findall(sql):
        fn_mentioned = re.search(rf"alter\s+function\s+public\.{re.escape(fn)}\s*\([^;]*\)\s+set\s+search_path", sql, re.I | re.S)
        body_has_set = re.search(r"set\s+search_path\s+(?:to|=)", sql, re.I)
        if not fn_mentioned and not body_has_set:
            errors.append(f"{label}: public.{fn} is created/replaced without deterministic search_path")

    return errors


def self_test():
    unsafe_table = "create table public.bad_table(id bigint);"
    unsafe_fn = "create function public.bad_fn() returns void language plpgsql security definer as $$ begin null; end $$;"
    safe_table = """
      create table public.good_table(id bigint);
      alter table public.good_table enable row level security;
      revoke all on table public.good_table from anon, authenticated;
      grant all on table public.good_table to service_role;
    """
    safe_fn = """
      create function public.good_fn() returns void language plpgsql security definer
      set search_path = public, pg_catalog as $$ begin null; end $$;
      revoke execute on function public.good_fn() from public, anon, authenticated;
      grant execute on function public.good_fn() to service_role;
    """
    public_exception = """
      -- POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL
      create function public.public_fn() returns void language plpgsql security definer
      set search_path = public, pg_catalog as $$ begin null; end $$;
    """

    assert len(check_sql(unsafe_table, "unsafe_table")) == 2
    unsafe_fn_errors = check_sql(unsafe_fn, "unsafe_fn")
    assert any("SECURITY DEFINER" in e for e in unsafe_fn_errors)
    assert any("search_path" in e for e in unsafe_fn_errors)
    assert check_sql(safe_table, "safe_table") == []
    assert check_sql(safe_fn, "safe_fn") == []
    assert check_sql(public_exception, "public_exception") == []
    print("Powerhouse Supabase security contract self-test passed: unsafe fixtures blocked, safe fixtures accepted.")


if "--self-test" in sys.argv:
    self_test()
    sys.exit(0)

BASE = sys.argv[1] if len(sys.argv) > 1 else "origin/main"
HEAD = sys.argv[2] if len(sys.argv) > 2 else "HEAD"

result = subprocess.run(
    ["git", "diff", "--name-only", f"{BASE}...{HEAD}", "--", "supabase/migrations/*.sql"],
    check=True,
    capture_output=True,
    text=True,
)
files = [Path(p) for p in result.stdout.splitlines() if p.strip()]

if not files:
    print("No changed Supabase migrations; security contract passes.")
    sys.exit(0)

errors = []
for path in files:
    if path.exists():
        errors.extend(check_sql(path.read_text(encoding="utf-8"), str(path)))

if errors:
    print("Powerhouse Supabase security contract FAILED:\n")
    for error in errors:
        print(f"- {error}")
    print("\nRequired contract: RLS + revoked browser roles for new public tables; deterministic search_path for functions; SECURITY DEFINER must be internal/revoked or explicitly reviewed as PUBLIC_INTENTIONAL.")
    sys.exit(1)

print(f"Powerhouse Supabase security contract passed for {len(files)} changed migration(s).")
