# Autonomous outreach: opt-out line in every mail

`powerhouse-autonomous-outreach` appends a plain opt-out sentence to each mail ("Antwoord met afmelden"). `powerhouse-email-reply-loop` already turns that reply into an active suppression, which the sender checks before every send. The recipient-authority gate and suppression check are unchanged.
