# Existing free workbook → real, verified booking

Parent acceptance [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Date: 2026-10-09.

## First party acquisition path
The four-page ungated `/assets/downloads/7-verborgen-bedrijfslekken.pdf` and selfscan are live. A high-intent visitor could only discover an appointment by traversing `/frisse-blik`, a separate advanced diagnostic page. Check existing host scheduling before inserting a new CTA: Calendly authenticated event type `468ddcac-6602-4e1f-a21c-395dd50ef422` is active, 30 minutes, free and matches the URL used on the existing `/zelfscan`. Future slot availability is dynamic and never guaranteed.

## Minimal change
On the existing `pages/7-bedrijfslekken.html` change just the **optional secondary** button from explainer link to `https://calendly.com/arthur-prinsen/adviesgesprek-slimmer-geregeld`, open in a new safe tab, and label it `Plan gratis een gesprek (30 minuten) →`. The primary immediate selfscan and immediate ungated PDF stay unchanged. Add only the Dutch→English translation for the new exact string. The existing first-party tracker already captures optional CTA clicks; `data-bg-cta-intent=meeting_booking_page` must not be reused as a booking or revenue event.

## Conversion semantics
Provider-confirmed appointment or invitee: booked call. Customer actually joins: attended call. Accepted invoice or payment: realized revenue. Vendor/LinkedIn ACK, PDF impression/click or booking-page click: no proved sale. None is invented. Existing ONE BRAIN and Heartbeat remain authority. If no booked appointment, keep P0 #4198 open.

## Proof and rollback
Run protected website CI, locale translation, full build and browser. Verify exact source on production and then the published link. Rollback changes only one optional CTA and its translation; the PDF, scan and core portal remain untouched.
