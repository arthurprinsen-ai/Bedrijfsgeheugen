// Slot op /intern/* — Netlify Edge Function.
//
// Waarom: de interne pagina's stonden alleen op noindex. Dat houdt ze uit
// Google, maar iedereen met de link kon ze gewoon openen. Nu vraagt de server
// om een gebruikersnaam en wachtwoord voordat er ook maar iets geladen wordt.
//
// Het wachtwoord staat NIET in deze repo. Zet in Netlify onder
// Site configuration -> Environment variables twee variabelen:
//   INTERN_GEBRUIKER   bijvoorbeeld: arthur
//   INTERN_WACHTWOORD  iets langs, minstens twintig tekens
// Zonder die twee is de map dicht voor iedereen, ook voor jou.

export default async (request, context) => {
  const gebruiker = Deno.env.get("INTERN_GEBRUIKER");
  const wachtwoord = Deno.env.get("INTERN_WACHTWOORD");

  const weiger = (tekst) =>
    new Response(tekst, {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Intern - Bedrijfsgeheugen", charset="UTF-8"',
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow"
      }
    });

  if (!gebruiker || !wachtwoord) {
    return weiger("Deze map is afgesloten. De inloggegevens zijn nog niet ingesteld in Netlify.");
  }

  const meegestuurd = request.headers.get("authorization") || "";
  const verwacht = "Basic " + btoa(gebruiker + ":" + wachtwoord);

  // Vergelijking van gelijke lengte, zodat de reactietijd niets verraadt.
  let gelijk = meegestuurd.length === verwacht.length;
  for (let i = 0; i < verwacht.length; i++) {
    if (meegestuurd.charCodeAt(i) !== verwacht.charCodeAt(i)) { gelijk = false; }
  }

  if (!gelijk) {
    return weiger("Geen toegang.");
  }

  const antwoord = await context.next();
  antwoord.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  antwoord.headers.set("Cache-Control", "no-store");
  return antwoord;
};

export const config = { path: "/intern/*" };
