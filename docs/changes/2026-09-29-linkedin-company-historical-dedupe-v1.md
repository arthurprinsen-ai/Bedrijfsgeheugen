# LinkedIn company historical dedupe v1

On 2026-09-29 the Bedrijfsgeheugen company page showed materially the same story on consecutive days.

The runtime cause was narrower than the existing atomic single-writer protection: the durable story fingerprint was only calculated for `linkedin_personal`. Company posts therefore relied on text similarity alone, while the measured campaign URL changes by day.

This change makes `linkedin_company` use the same historical story-fingerprint authority and canonicalizes the company body before uniqueness reservation by removing URLs, hashtags, date markers and whitespace noise. The existing provider-create terminality, publication capability and atomic claim remain unchanged.

A repeated company story must now fail closed before any provider write.
