# 2026-09-24 — Problem Radar exact-main production recovery

Fingerprint: `powerhouse-50-problem-radar-production-recovery-v1`

## Waarom

PR #2791 is protected gemerged als `a2a3272e8394a292407b63826b22797f26b5533a`, terwijl Netlify-productie bij de eerste provider-readback nog `890d961c2572c213e53a97cab8e6197026e6773c` rapporteerde.

Een merge is geen productie-identiteit. Daarom vervolgt dezelfde obligation via de bestaande `Production Source Snapshot`.

## Recovery

- zelfde obligation: `powerhouse-50-problem-radar-chat-closure-20260924-v1`;
- predecessor: PR #2791;
- recovery candidate: PR #2814;
- enige deployment authority: bestaande `Production Source Snapshot`;
- snapshot marker aangepast zodat een protected-main push de exacte bron opnieuw naar Netlify promoveert.

## Completion contract

De recovery is pas terminal wanneer provider-readback bewijst:
- Netlify state = `ready`;
- context = `production`;
- `commit_ref` = actuele protected `main`;
- production URL = `https://www.bedrijfsgeheugen.nl`.

Geen preview, merge of deploy-start telt als LIVE_BEWEZEN.
