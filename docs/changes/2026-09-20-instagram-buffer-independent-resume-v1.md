# Instagram Buffer-independent resume

Fingerprint: `instagram-buffer-independent-resume-v1`.

The scheduled social delivery runner now invokes the canonical publisher before any Buffer query. Instagram/Composio can therefore publish independently even when LinkedIn/Buffer is rate-limited or unavailable.

Buffer failures are represented as LinkedIn `DEFERRED_PROVIDER_UNAVAILABLE` results instead of failing the whole scheduled run. Instagram keeps its canonical publisher result.
