# Replace open-weight model family placeholders with exact checkpoints

Two catalog IDs (`llama-open-weight` and `qwen-open-weight`) were not API/model identifiers and therefore failed per-model supplier identity verification.

The candidate now uses `llama-4-scout-17b-16e-instruct` (`meta-llama/Llama-4-Scout-17B-16E-Instruct`) and `qwen3-32b` (`Qwen/Qwen3-32B`). Official model cards establish published weights, context and deployment examples.

Both remain `PARTIAL` and automatically ineligible for recommendations. No numeric hosted-token price, effective EU processing arrangement, tenant access or signed customer DPA has been assumed. A separate hosting/contract verification remains mandatory before production selection.

Source-of-truth migration is candidate-only until the website lane's required checks pass. The other 108 models are not declared freshly verified by this change; keep the existing catalog freshness gate untouched.
