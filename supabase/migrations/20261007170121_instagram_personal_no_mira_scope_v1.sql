insert into public.bg_schrijfregels
(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron,bijgewerkt_op)
values
(
  'instagram-personal-no-mira-v1',
  'Persoonlijk Instagram — geen Mira',
  'Mira hoort uitsluitend bij het Bedrijfsgeheugen-bedrijfsaccount op Instagram. Op een persoonlijk Instagram-account van Arthur mag Mira nooit worden gebruikt: geen Mira-afbeelding, video, avatar, caption, serieformat, naam, stem, meme-template of andere Mira-identiteit. Persoonlijk Instagram moet Arthur/persoonlijk blijven en krijgt een eigen kanaalidentiteit. Content of assets mogen niet tussen persoonlijk Instagram en de Mira/Bedrijfsgeheugen-Instagram worden hergebruikt alsof het hetzelfde kanaal is.',
  'Expliciete gebruikerscorrectie 2026-10-07: geen Mira op persoonlijk Instagram.',
  1,1.0,'actief','user_instruction+channel_identity',now()
)
on conflict (regel_id) do update set
  onderwerp=excluded.onderwerp,
  regel=excluded.regel,
  onderbouwing=excluded.onderbouwing,
  bewijs_n=excluded.bewijs_n,
  vertrouwen=excluded.vertrouwen,
  status=excluded.status,
  bron=excluded.bron,
  bijgewerkt_op=excluded.bijgewerkt_op;

update public.bg_schrijfregels
set regel='Instagram bedrijfsgeheugen.nl is MIRA-ONLY. Deze Mira-identiteit geldt uitsluitend voor het Bedrijfsgeheugen-bedrijfsaccount en nooit voor Arthurs persoonlijke Instagram. De mediaprovider is een experimentvariabele, geen identiteitseis: Powerhouse mag Mira-foto''s, stills, Reels en composities laten maken via een goedgekeurde generator. De exacte finale media moet zichtbaar en verifieerbaar Mira bevatten en de finale copy moet passen bij Mira''s daily-life narratief. Alt-tekst, caption, bestandsnaam of het woord Mira zijn nooit zelfstandig bewijs. Persoonlijk Instagram mag geen Mira-assets, Mira-copy of Mira-serieformats hergebruiken.',
    bijgewerkt_op=now(),
    bron='user_instruction+production_incident+channel_identity'
where regel_id='instagram-mira-daily-life-character-v1';
