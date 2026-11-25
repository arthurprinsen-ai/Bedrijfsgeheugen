# First Time Right: eerst voorbereiden, dan pas publiceren

De oorspronkelijke social-publisher `powerhouse-social-publisher` heeft nu de originele modus `prepare_only` als niet-verzendende voorbereiding. Hij voert dezelfde onafhankelijke redactionele controle en geautoriseerde LinkedIn-providerpreflight vroeg uit, zodat een afkeuring binnen de originele uur-loop zelf kan worden hersteld. Het oorspronkelijke `powerhouse-content-loop` controleert exact `ready_for_final_recheck` voordat het per social-kanaal de normale `publish_only` aanroept. De finale onafhankelijke reviewer blijft verplicht en opnieuw actief vóór provider-create. Voor Mira blijven onafhankelijke identity- en media-guards ongewijzigd; voor blog behoudt de beschermde GitHub-writer de echte editorial release.

Nooit voortijdig provider-create, bronverzinsel, dubbele post, nieuwe cron, Make/Buffer fallback, verlaagde identiteit, fake approval of verzonnen provider-readback. Het bestaande archief van incidenten en leerregels bewaart oorzaak, eigenaar, regressie en vervolgbewijs.

Bewijsfasen: SOURCE → READY_FOR_FINAL_RECHECK → FINAL REVIEW → PROVIDER ACK → INDEPENDENT LIVE PROVEN → MEASURED → LEARNED. Een groene voorbereiding betekent niet dat een externe publicatie gelukt is. Canonieke specificatie: `brain/contracts/original-social-first-time-right-prepublish-v1.json`.
