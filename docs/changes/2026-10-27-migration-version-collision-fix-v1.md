# Migration version collision: connection email activation

The connection email activation migration was renamed to `20261027171500` because `20261027170000` was already registered in production for `saas_trial_v1` by another session. Content is unchanged; production has the SQL applied and registered under the new version.
