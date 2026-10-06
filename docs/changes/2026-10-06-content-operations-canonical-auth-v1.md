# Content publication recovery authority alignment

De social-publication recovery chain gebruikte twee verschillende interne autorisatiebronnen. Daardoor kon de delivery supervisor falen voordat de canonieke social publisher werd bereikt.

De wijziging laat `content-operations` dezelfde centrale database-backed scheduler authority gebruiken als de bestaande publisher. Een legacy environment fallback blijft alleen beschikbaar als bounded fallback; hij is niet langer de primaire authority.

Borging:
- de bestaande unified-content-operations test vereist de centrale authority lookup;
- de request-authorisatie blijft fail-closed;
- de publisher blijft de enige provider writer;
- provider-readback blijft verplicht voordat publicatie als live bewezen geldt.

Tijdens het incident waren daarnaast tijdelijke database-gateway timeouts zichtbaar. Daarom wordt de runtime pas terminal groen verklaard na herstelde database access én echte provider-side readback.
