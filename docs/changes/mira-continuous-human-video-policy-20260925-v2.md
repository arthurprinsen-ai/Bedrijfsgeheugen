# Mira continuous human video policy v1

**Fingerprint:** `mira-continuous-human-video-v1`  
**Status:** VERIFIED / FAIL-CLOSED  
**Effective:** 2026-09-23  
**Scope:** every Bedrijfsgeheugen Instagram Mira Reel.

## Non-negotiable outcome

A Mira Reel must feel like one real person being filmed in one coherent moment. It may not look like a slideshow, a sequence of generated stills, a photo animated into video, or a montage of unrelated AI frames.

## Required generation contract

Every Reel must use one consistent Mira identity, one consistent scene, one continuous recording experience and natural human motion. Face, eyes, mouth, hands, body posture, clothing, lighting, background geometry and camera perspective must remain coherent over time. Motion must come from the person and scene, not merely from zooming, panning or morphing a still image.

Preferred production style:
- single continuous shot;
- subtle handheld phone-camera movement;
- natural breathing, blinking, head movement, hand movement and micro-expressions;
- realistic room/background motion and parallax;
- no cuts unless explicitly required by a future approved policy version;
- no slideshow transitions, frozen frames, image morphs, jumpy identity changes or scene resets.

## Hard temporal proof

Before a publication capability can be issued, `temporal_proof` must satisfy all of the following:

- `verified = true`
- `single_continuous_take = true`
- `continuous_motion_verified = true`
- `scene_continuity_verified = true`
- `identity_continuity_verified = true`
- `human_motion_verified = true`
- `realistic_camera_motion = true`
- `slideshow_detected = false`
- `still_image_animation_detected = false`
- `evidence_method` is `vision` or `manual_vision`
- at least one `evidence_ref` starts with `temporal:`

Start/middle/end frame identity proof remains mandatory but is not sufficient by itself.

## Fail-closed behavior

Any missing or contradictory temporal field blocks publication with `MIRA_CONTINUOUS_HUMAN_VIDEO_REQUIRED`. No fallback to Buffer, another provider, a still image, slideshow, carousel, or replacement Reel is allowed merely to satisfy the daily-post obligation.

The canonical publication layer may only consume the exact final media digest that passed both:
1. Mira visible-identity proof; and
2. this continuous-human-video temporal proof.

## Canonical enforcement

Enforced in:
- `powerhouse-instagram-media-router`
- `bg-pre-publish-review`
- DB trigger `enforce_mira_continuous_video_capability_v1`
- Brain governance record `mira-continuous-human-video-v1`

This policy is a quality boundary, not a best-effort preference.
# Mira continuous human video policy v1

**Fingerprint:** `mira-continuous-human-video-v1`  
**Status:** VERIFIED / FAIL-CLOSED  
**Effective:** 2026-09-23  
**Scope:** every Bedrijfsgeheugen Instagram Mira Reel.

## Non-negotiable outcome

A Mira Reel must feel like one real person being filmed in one coherent moment. It may not look like a slideshow, a sequence of generated stills, a photo animated into video, or a montage of unrelated AI frames.

## Required generation contract

Every Reel must use one consistent Mira identity, one consistent scene, one continuous recording experience and natural human motion. Face, eyes, mouth, hands, body posture, clothing, lighting, background geometry and camera perspective must remain coherent over time. Motion must come from the person and scene, not merely from zooming, panning or morphing a still image.

Preferred production style:
- single continuous shot;
- subtle handheld phone-camera movement;
- natural breathing, blinking, head movement, hand movement and micro-expressions;
- realistic room/background motion and parallax;
- no cuts unless explicitly required by a future approved policy version;
- no slideshow transitions, frozen frames, image morphs, jumpy identity changes or scene resets.

## Hard temporal proof

Before a publication capability can be issued, `temporal_proof` must satisfy all of the following:

- `verified = true`
- `single_continuous_take = true`
- `continuous_motion_verified = true`
- `scene_continuity_verified = true`
- `identity_continuity_verified = true`
- `human_motion_verified = true`
- `realistic_camera_motion = true`
- `slideshow_detected = false`
- `still_image_animation_detected = false`
- `evidence_method` is `vision` or `manual_vision`
- at least one `evidence_ref` starts with `temporal:`

Start/middle/end frame identity proof remains mandatory but is not sufficient by itself.

## Fail-closed behavior

Any missing or contradictory temporal field blocks publication with `MIRA_CONTINUOUS_HUMAN_VIDEO_REQUIRED`. No fallback to Buffer, another provider, a still image, slideshow, carousel, or replacement Reel is allowed merely to satisfy the daily-post obligation.

The canonical publication layer may only consume the exact final media digest that passed both:
1. Mira visible-identity proof; and
2. this continuous-human-video temporal proof.

## Canonical enforcement

Enforced in:
- `powerhouse-instagram-media-router`
- `bg-pre-publish-review`
- DB trigger `enforce_mira_continuous_video_capability_v1`
- Brain governance record `mira-continuous-human-video-v1`

This policy is a quality boundary, not a best-effort preference.
