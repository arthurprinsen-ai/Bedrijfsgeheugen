# Original BRAIN timeout fixture correction

Original #6175 BRAIN run 45468350286, job 138709754512, assertion 6811 failed with 78 instead of 0 because GNU timeout cannot invoke the shell-only gh mock. The test now models the exact 30s gh api wrapper and retains all existing positive/negative assertions. No production workflow or acceptance rule changed. Protected Required, CodeQL and independent original lineage proof remain mandatory. Historical failure stays recorded; no claim of production success.
