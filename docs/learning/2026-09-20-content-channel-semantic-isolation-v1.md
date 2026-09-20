# Separate channel identity before creative scoring

Channel fit is a hard invariant, not a score. A recommendation that is valid for Arthur's personal LinkedIn must never become eligible for the company page merely because both channels contain the word LinkedIn.

The orchestrator now filters eligibility before ranking. Company generation excludes personal truth sources and materializes its measurable campaign URL before AI generation. Personal generation remains grounded in the verified source, but the final text is checked again: it must itself contain a concrete first-person event and preserve source anchors.

This moves identity and truth checks earlier in the loop, reducing generation waste and preventing repeated downstream 422/recovery cycles.


## Live production proof

The control is production-proven on merge `56618d748a9b0d417b0198086aa097b4ef36b1ef` with Supabase `powerhouse-content-orchestrator` v15. Production source matches `main` exactly. The subsequent closed-loop run preserved the hard separation: company content is selected from company-eligible recommendations only; personal content still fails closed if its final copy loses the concrete first-person event. This proves the semantic-isolation control, not automatic publication of content that fails downstream gates.
