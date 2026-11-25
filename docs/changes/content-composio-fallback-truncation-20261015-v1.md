# Composio/Groq content fallback — bounded truncation recovery

The daily commercial publishing lane tried to generate `linkedin_company` content through the existing AI fallback and repeatedly received incomplete JSON. Strict parsing correctly blocked publication, but 16 attempts without larger context left the channel stuck.

The fallback now gets **one** bigger token budget after proven truncation (`finish_reason=length` or incomplete JSON syntax). The model must still return exactly six string fields; subsequent quality, identity, unique-content, provider authorization, and external readback gates continue without exceptions.

This change **does not** create a second sender, bypass the missing LinkedIn organization scope, send emails/DMs, or claim any social provider outcome. Deploy via the protected release. Only genuine provider IDs/public URLs can close the daily publication obligation.
