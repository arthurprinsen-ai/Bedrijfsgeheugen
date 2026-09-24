# Netlify linked-build fallback — 24 september 2026

## Incident

The canonical Production Source Snapshot successfully acquired GitHub OIDC transport after the Netlify proxy was rotated. Netlify accepted the linked build and returned build `6ab5778870bdf4ced1a53687` / deploy `6ab5778870bdf4ced1a53689`, but later terminalized that deploy as `Skipped`.

The workflow treated that preferred transport as terminal ownership and exited before its existing direct MCP deploy fallback.

## Root cause

Two control-flow exits made the fallback unreachable:
- linked deploy enters `error`;
- linked deploy never exposes the exact expected SHA inside the bounded readback.

Those states mean the first transport did not publish. They do not mean the already-authorized fallback must be abandoned.

## Fix

Both linked-build failure paths now retain evidence, emit a warning and continue to the existing direct MCP deploy command. Exact release identity and production browser verification remain unchanged and mandatory.

## Prevention

Transport success is not deployment success. A preferred transport may fail over automatically to an already-authorized canonical fallback, while terminal truth remains exact production readback.
