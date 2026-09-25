# Instagram Composio account selection — current-main replay

## Root cause
The publisher treated more than one ACTIVE Instagram connected account as an unconditional ambiguity. That blocks publication even when one account is the canonical `bedrijfsgeheugen.nl` identity.

## Fix
For Instagram only, the publisher probes each active account through the Composio proxy `/me?fields=id,username` endpoint and accepts exactly one match for `bedrijfsgeheugen.nl`. Zero or multiple matches remain fail-closed.

## Safety
LinkedIn and other toolkits keep strict single-account behavior. No fallback account is guessed.
