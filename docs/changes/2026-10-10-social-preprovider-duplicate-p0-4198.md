# Recover genuinely new LinkedIn posts after a pre-provider semantic duplicate

## Incident
Both 10 October LinkedIn channels had genuinely no external ID, no provider-create acknowledgement, and the canonical publication capability was unconsumed. They were correctly blocked by the existing story-family uniqueness gate. However its catch handler wrote `republish_forbidden:true` *before any provider call*, leading all subsequent content supervisors to consider the day irrecoverable — even after different source-backed recommendations were available.

## Change
- The publisher keeps the semantic uniqueness rejection mandatory but records a pre-provider rejection, not a sent post.
- The existing orchestrator may reselect a **different** candidate only when the duplicate rejection is explicitly proven before provider send: `state=blocked`, no delivery ID, uniqueness gate blocked, capability issued and unconsumed, and zero provider create/ack/truth/possible-side-effect evidence.
- The existing supervisor triggers the same orchestrator under the same day+channel lease in those narrowly proven cases, then the same publisher repeats full global uniqueness, identity and prepublish checks. It does not bypass provider identity, social authorization, media proofs or public readback.

## Closure
The code candidate is not a live LinkedIn post. Protected merge, exact Supabase Edge readback, newly selected nonduplicative content and real LinkedIn post IDs/permalinks are required before marking published or closing P0 #4198.
