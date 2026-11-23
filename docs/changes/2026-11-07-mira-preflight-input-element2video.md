# Mira-producer: volledige preflight-invoer en element2video-formaatpoort

Op 7 november kon de dagelijkse Mira-producer geen Reel starten. De eerste preflight miste `scene`, `canonical_problem_id` en `recommendation_id` en kreeg HTTP 422. Met die velden slaagde de admissie, maar de formaatpoort kende `veo3-1` met `element2video` niet, terwijl het OpenArt-formulier voor die modus `aspectRatio` 9:16 en `generateAudio` biedt.

Wijziging: de formaatpoort accepteert die modus onder dezelfde voorwaarden als `image2video` (9:16, geen audio, 1080p, 8 seconden, één video, originele Mira-master). Het skill beschrijft nu de volledige invoer van de preflight.

Niet gewijzigd: de meting op 1080x1920, de gezichtscontrole van minimaal 0,940 op drie frames, de bewegingscontrole, het budget en het bewijs van Meta. Er zijn geen credits besteed en er is niets gepubliceerd. Het effect is pas bewezen na uitrol en een natuurlijke run met een echte, geverifieerde Reel.
