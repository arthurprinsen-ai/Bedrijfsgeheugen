# Dagelijkse blog — SEO, performance en canonical URL geborgd

De dagelijkse blogrenderer erfde metadata en externe render-resources uit een oudere template. Daardoor kon een inhoudelijk correct artikel toch falen op titel/meta, focuswoord, structured data, functionele figuren en Lighthouse-performance. Daarnaast kon een latere SEO-titel een nieuwe slug afleiden voor een blogclaim die al een bestaande canonical URL had.

Deze reparatie maakt de renderer data-gedreven: begrensde SEO-title/meta, consistente focuskeyword-verwerking, zichtbare FAQ die overeenkomt met FAQPage JSON-LD, twee toegankelijke functionele SVG-figuren en static-first rendering zonder render-kritische third-party fonts/analytics. De publicatie-identiteit is daarnaast write-once gemaakt: titel- of copywijzigingen mogen een bestaande content_id, slug of canonical URL niet meer veranderen.

De Blog Technical SEO Gate, Canonical brand shell contract en CodeQL zijn groen op de kandidaat. Productie/live wordt hier bewust nog niet geclaimd; dat volgt uitsluitend na protected merge, Netlify production en publieke readback.
