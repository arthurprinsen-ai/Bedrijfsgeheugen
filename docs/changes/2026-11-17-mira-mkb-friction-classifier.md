# Mira MKB human-friction source classification — 17 November 2026

Parent issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232. Original owner: powerhouse-mira-problem-radar-v1 / original cron #120.

## Independently observed failure and root cause

Mira original source search for 17 November 2026 had 7 stored results and zero eligible, and its legitimate business-source hits on 16 Nov were mostly software vendor launches scored 0.661/0.690. The actual code previously gave +0.25 to source friction only when source text contained generic consumer-complaint words such as 'klacht', 'frustratie', 'gedoe', 'probleem'. It failed to recognise documented business harm such as employee shortages, late invoices, incorrectly maintained Excel reports, forgotten quotes or failed capacity plans. Vendor/software launches were not inherently an experienced customer problem. The source-scoring false-negative had no autonomous correction. No new original day winner, media job or provider post existed for 17 November.

## Same-source-owner fix

Introduce one pure local business-friction classifier in the existing original radar and use it only in the instagram_company source scoring path. A dated, independently verified article documenting concrete MKB operational harm can receive the same existing high friction score already awarded to explicit complaint text, without lowering the minimum score 0.72. Recognise Dutch pain terminology in official business news (personeelstekort, achterstallige facturen, dubbele invoer, foutieve Excel-cijfers, klantverlies, projectvertragingen). Reject vendor-launch headlines even when they claim their software addresses customer pain. The linkedin_personal consumer/source taxonomy remains independent.

No extra source search, scheduler, raw URL manipulation, unsupported dates, SourceHash changes, model credits or Meta send is introduced. Keep the original 8 provider slots/day (six Mira + two personal), original 45-day provider date limit, correct publisher URLs, publication acceptance minimum 0.72, 90-day URL/hash and three-day topic uniqueness. The original immutable PH-P scene and editorial review, OpenArt official master, native MP4 and face/temporal validation and one Meta sender/readback remain in force. An accepted source is still only evidence, not proof of a published Instagram Reel.

## Acceptance

Protected Required+CodeQL, merge, independent original Edge producer source parity. Then next natural original source run must return an eligible distinct business signal -> exactly one frozen daily winner -> original exclusive OpenArt producer/claim/preflight/credit quote -> independently verified Mira footage -> original Meta numeric media ID/permalink GET -> ONE BRAIN named consumer PROCESSED and Heartbeat results. Any missing link is OPEN/DEGRADED rather than false green. Observe whether source zero-acceptance drops on subsequent original natural runs; otherwise preserve root cause and continue original owner recovery.
