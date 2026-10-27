# Approved blog index marker recovery — 2 oktober 2026

De dagelijkse approved-blog publisher bleef fail-closed doordat de blogindex een historische letterlijke `\\n` bevatte waar de publisher een echte newline verwachtte.

De reparatie doet twee dingen: de bestaande marker wordt genormaliseerd en de publisher accepteert voortaan beide representaties, waarna hij de output naar de canonieke newline-vorm schrijft. Als geen geldige artikelen-marker bestaat, blijft publicatie geblokkeerd.

Deze wijziging verandert geen publicatiebewijs of providerstatus. Een blog geldt pas als live na de bestaande protected delivery-keten en publieke readback.
