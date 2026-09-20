# Development ledger — instagram-prepublish-business-rule-scope-v1

Date: 2026-09-20  
Obligation: `instagram-prepublish-business-rule-scope-v1`  
Lane: backend  
Failure class: `CHANNEL_POLICY_SCOPE_DRIFT`

## Observed

Instagram Mira was blocked by the generic `doorklik` rule demanding a Bedrijfsgeheugen tracking link.

## Root cause

The pre-publish review used `channel !== 'linkedin_personal'` as the scope for generic business rules, unintentionally applying LinkedIn-company policy to Instagram.

## Change

Generic business rules are scoped to `linkedin_company` only. Instagram continues to enforce dedicated Mira and exact-media gates.

## Evidence

- `supabase/functions/bg-pre-publish-review/index.ts`
- `tests/brain-instagram-prepublish-rule-scope.test.mjs`
- `brain/learning/2026-09-20-instagram-prepublish-business-rule-scope-v1.json`
- `docs/changes/2026-09-20-instagram-prepublish-business-rule-scope-v1.md`
