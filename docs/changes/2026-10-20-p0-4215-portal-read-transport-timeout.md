# Transport timeout for portal reads — P0 #4215

Existing production traces identify unbounded 90–197s read waits in SOURCES, PUBLICATIONS and EXTERNAL_SIGNALS. The existing concurrency limit alone does not end upstream HTTP requests.

Solution: PostgREST abortSignal(AbortSignal.timeout(3800)) passed from boundedReads for every scheduled request. Maximum two concurrent reads in entrepreneur intelligence. Existing ten stages, tenant equality, provenance and fail-closed response stay intact.

This prevents dangling requests; it does NOT claim the overloaded database or HTTP 504 is repaired. A read exceeding 3.8s is returned as unavailable, not empty success. Verify the stage budget against genuine customer latency in preview before merge.

Protected CI + CodeQL + approved Supabase Preview + deployed Edge exact-source readback + two-tenant authenticated API 200 + browser checks are still required. Never force locking indexes/migrations during database timeouts.
