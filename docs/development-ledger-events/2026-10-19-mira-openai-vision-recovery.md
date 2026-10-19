# Mira provider verification recovery
Obligation-ID: mira-openai-exact-media-verification-20261019

Observed: new OpenArt output completed, router HTTP 422 because the downstream Anthropic vision request failed, with no semantic verdict. Same generated video preserved; no Instagram create/send was performed. Scoped fix uses existing user-approved OpenAI route in both proof stages. Two new transport tests observed red then green; full delivery and runtime proof remain required. Exact shared transport and governance mapping recorded in System Map and publisher skill. Parent P0 #4198 remains open until independent channel outcomes and customer E2E proof exist.
