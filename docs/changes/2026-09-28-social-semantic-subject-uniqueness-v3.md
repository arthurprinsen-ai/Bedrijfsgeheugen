# Social semantic subject uniqueness v3

Date: 28 September 2026  
Fingerprint: `powerhouse-social-semantic-subject-uniqueness-v3`

## Incident

A printer anecdote appeared again on personal LinkedIn after an earlier printer post. Existing duplicate protection was too text-oriented: a different source string and sufficiently different wording could evade the story fingerprint and keyword-overlap thresholds.

## Permanent rule

A social post must be new in substance, not merely new in wording. Across the complete retained history and across channels, Powerhouse must never reuse the same concrete incident, anecdote, object-led example or semantic subject.

Broad domains may recur — for example school, hockey, family or travel — but the concrete event/example inside that domain must be new.

## Runtime enforcement

The canonical reservation function now adds a distinctive semantic-anchor gate on top of all existing checks. It excludes broad generic domains, compares the remaining high-signal anchors against historical normalized copy, and blocks:
- two or more shared distinctive anchors; or
- one shared distinctive anchor of at least seven characters.

This means an exhausted example such as the printer anecdote is blocked even when its hook, sentence order, CTA, channel or surrounding wording changes.

Duplicate recovery must select a genuinely unused subject/source/example. Paraphrasing is not recovery.

## Personal LinkedIn

The former source-rotation interpretation that could eventually recycle a used concrete story is superseded. When no unused verified non-sensitive source exists, the pipeline fails closed until another verified source is available; it does not invent or recycle a personal event.
