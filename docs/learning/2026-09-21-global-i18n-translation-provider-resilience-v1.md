# English selected while page text stayed Dutch

Fingerprint: `global-i18n-translation-provider-resilience-v1`

The language UI was functioning, but that did not prove the translation service was functioning. The previous runtime intentionally kept English selected when a translation batch failed. That avoided a confusing locale rollback, but when every batch failed it left the visitor looking at Dutch text with English highlighted.

UI translation now uses the dedicated Claude Haiku 4.5 model. Failed large batches are automatically retried in smaller groups. If no missing string can be translated, the runtime reports a real translation failure instead of silently doing nothing.

The translation model is governed separately from the general website/portal question-answering model so cost, latency and reliability can be tuned independently.
