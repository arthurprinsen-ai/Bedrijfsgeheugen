# LinkedIn setup result type

- Obligation: linkedin-setup-result-type-20261028
- Change: annotate the setup result object as Record<string,any> so the publisher-resume fields are typed. No runtime change.
- Evidence: `deno check` on supabase/functions/powerhouse-composio-linkedin-setup/index.ts reported TS2339 on resume_attempted, publisher_http and publisher_ok; passes after the change. Static test: tests/brain-linkedin-setup-result-type-20261028.test.mjs.
- Status: candidate; protected merge pending.
