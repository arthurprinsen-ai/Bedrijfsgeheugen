# Mira personal-problem + fresh OpenArt Reel production v1

Date: 2026-09-18  
Fingerprint: `mira-human-problem-fresh-openart-reel-v1`

## Incident

A Mira obligation was incorrectly satisfied with a static text card while the intended format was a character-led Reel. In the same recovery window, an older Mira video was also at risk of being reused as a substitute for a new daily generation.

## Evidence

The verified 2026-09-17 Mira Reel ("wie legt dit even vast") proves the working production pattern:
- canonical Powerhouse concept/script;
- fixed Mira reference image;
- OpenArt Gemini Omni Flash image2video, vertical 9:16, ~10 seconds;
- new provider-generated MP4;
- Instagram Reel publication;
- Instagram provider readback with media id and permalink.

Production readback for that Reel:
- Instagram media id: `18116075632751732`
- permalink: `https://www.instagram.com/reel/DdYLdmbimKy/`
- published: 2026-09-17T06:07:52Z
- source media lineage: OpenArt image2video.

## Root cause

The system treated "Mira content exists" and "publishable visual exists" as weaker substitutes for the actual obligation: a **new, human, character-led Mira Reel**. Provider readiness, content intent, format integrity and freshness were not enforced as one contract.

## Permanent rule

Canonical Mira Reel chain:

`Powerhouse personal problem -> human moment -> Mira script -> fixed Mira reference -> NEW OpenArt image2video -> exact-media + visible-identity proof -> Composio Instagram publish -> provider permalink/readback -> Notion/Brain outcome + learning writeback`.

Rules:
- content starts from a personal, recognizable human problem;
- new script and new OpenArt asset every run;
- old assets are never final-media fallback;
- prior Mira image may be an identity reference only;
- static text cards cannot satisfy Reel obligations;
- Placid cannot substitute for OpenArt video;
- Make is retired and forbidden;
- unavailable OpenArt execution remains recoverable rather than triggering provider substitution;
- dedupe recent Instagram posts and OpenArt generation identities before publish;
- terminal success requires Instagram media id/permalink readback;
- performance outcomes feed the canonical content-learning loop.

## Content style contract

Mira should feel like a person, not a campaign:
- one small concrete incident;
- one recognizable frustration;
- restrained acting and realistic setting;
- dry self-observation/self-mockery;
- little or no on-frame text;
- brand meaning follows the human moment instead of leading it.

## Prevention

The rule is projected into:
- `.agents/skills/instagram-composio-publisher/SKILL.md`;
- `docs/superpowers/skills/instagram-mira-visible-identity-gate-v1.md`;
- Brain learning record `brain/learning/2026-09-18-mira-personal-openart-reel-production-v1.json`.

This is one extension of existing Instagram/Mira authority, not a parallel publisher, calendar, queue or learning system.
