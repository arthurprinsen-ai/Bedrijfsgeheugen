# Scope delivery-control workflows to their real lanes

## Problem

The central delivery planner already knows explicit lane owners, but the generic `.github/workflows/` entry in `sharedPaths` overrode that intent. A delivery-control PR such as #3974 therefore ran backend, automation, portal **and** the full website/browser lane even though no site runtime changed.

## Structural fix

Explicit lane ownership now wins before the generic shared fallback:

- `scopedLaneForPath(...)` ownership wins;
- paths already listed by a configured lane win;
- known delivery/repository-writer workflows are explicitly backend or automation scoped;
- Supabase Edge authority is backend scoped;
- unknown workflow files still use the conservative all-lane shared fallback.

This removes unrelated browser/portal work without weakening assurance for new or unclassified workflows.
