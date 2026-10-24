# Daily post metrics: use independently linked LinkedIn company impressions

The canonical daily content-growth diagnostic now accepts `PROVIDER_OBSERVED_LINKED` source quality only when supplied by the existing independently verified social-source pipeline. It reads LinkedIn provider `impressions` as **impressions**, not as `views` or `reach`, preserving `exposure_kind` and explicit unknown views/reach.

Even when provider data contains 0 comments, a post with 5 impressions is too small to justify a creative diagnosis. The existing minimum of 50 observations per post and the separate measured-next-post producer threshold remain unchanged. No extra scheduler, source, data store, traffic counter or publisher exists.

This is a consumer compatibility upgrade for the existing 04:20 UTC Content growth learning workflow, **not** a claim that the independent company provider source is already live-linked or that a next post has increased orders. Terminal readback remains required.
