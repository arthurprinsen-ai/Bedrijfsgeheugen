# Buffer Social Learning tests aligned with current code

Two Instagram tests asserted retired shapes and kept the Buffer Social Learning workflow red since 25 October. They now check that the media router runs before the per-channel Instagram publish, that frame extraction uses contract v2 with start/middle/end sampling in its own module, and the renamed vision-proof error code.

## Validation

`node --test tests/social-learning-instagram-media-provider-routing-v1.test.mjs tests/social-learning-instagram-video-frame-proof-worker-v1.test.mjs` and the full test list of the workflow (82 passed).

## Boundaries

Test-only. No runtime change.
