revoke all on function public.enforce_linkedin_company_live_proof_v1() from public;
revoke all on function public.enforce_linkedin_company_live_proof_v1() from anon;
revoke all on function public.enforce_linkedin_company_live_proof_v1() from authenticated;
grant execute on function public.enforce_linkedin_company_live_proof_v1() to service_role;

revoke all on function public.powerhouse_request_linkedin_org_reauth_v1() from public;
revoke all on function public.powerhouse_request_linkedin_org_reauth_v1() from anon;
revoke all on function public.powerhouse_request_linkedin_org_reauth_v1() from authenticated;
grant execute on function public.powerhouse_request_linkedin_org_reauth_v1() to service_role;
