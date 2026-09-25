# Production snapshot cancel-thrash recovery

The production deployment lane was not failing on application code. Healthy deployments were being cancelled because every new protected-main commit interrupted the active `Production Source Snapshot`.

The workflow now preserves one active production deploy by disabling `cancel-in-progress`. This keeps the existing concurrency group as the serialization boundary while allowing newer work to wait instead of killing the running deploy.

Terminal delivery still requires:
1. protected merge;
2. completed Production Source Snapshot;
3. production commit reference equal to the relevant current-main SHA;
4. pricing content proof;
5. live NL/EN browser interaction proof.
