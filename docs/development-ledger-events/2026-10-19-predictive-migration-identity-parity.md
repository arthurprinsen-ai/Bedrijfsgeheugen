# Restore actual provider migration identity
Obligation-ID: predictive-calibration-uncertainty-retention-20261019
Supersedes: 4508

Protected retention4508 passed native Preview and6 actual PostgreSQL behaviors, but production check118292987939 correctly refused a remote version absent locally. Production stores growth-source migration20261019203052;4509 source has only20261019223000. Read the actual schema_migrations statement and compare it byte-for-byte: both are identical, SHA256f267cda0725f4020c47e4ec6511e84a4f4e527327f1b417490a80564f74fb521.

Restore the actual applied203052 source from provider truth. Retain already Preview-applied223000 bytes unchanged as an idempotent compatibility replay; same named cron is updated, not duplicated. Do not edit/delete/insert migration tracking rows, mark pending SQL applied, or bypass native deployment. Existing retention migration remains immutable. Regression begins RED on the missing actual identity. Native exact-head Preview, Required/CodeQL, protected main, production versions200528/203052/223000 and actual uncertainty-after-refresh proof remain required.
