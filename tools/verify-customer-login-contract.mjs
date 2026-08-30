import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function lees(pad) {
  return readFileSync(resolve(process.cwd(), pad), 'utf8');
}

function eis(voorwaarde, melding) {
  if (!voorwaarde) throw new Error(`[customer-login-contract] ${melding}`);
}

export function verifyCustomerLoginContract() {
  const login = lees('klant-login.html');
  const portal = lees('klantportaal.html');

  eis(login.includes('/auth/v1/token?grant_type=password'), 'klant-login.html moet via Supabase Auth inloggen');
  eis(login.includes("localStorage.setItem('bg_customer_auth'"), 'klant-login.html moet de Supabase sessie persistent bewaren');
  eis(login.includes("sessionStorage.setItem('bg_klant_' + slug"), 'klant-login.html moet de opgehaalde klantdata aan het portaal doorgeven');
  eis(login.includes("sessionStorage.setItem('bg_token'"), 'klant-login.html moet het access token voor de bestaande portalflow doorgeven');
  eis(login.includes("https://www.bedrijfsgeheugen.nl/klantportaal?klant="), 'klant-login.html moet na succes terugkeren naar het klantportaal');

  eis(portal.includes("https://www.bedrijfsgeheugen.nl/klant-login.html?klant="), 'klantportaal.html moet niet-ingelogde klanten naar de aparte login sturen');
  eis(!portal.includes('<input id="bgMail"'), 'klantportaal.html mag geen inline klant-e-mailveld renderen');
  eis(!portal.includes('<input id="bgWw"'), 'klantportaal.html mag geen inline klant-wachtwoordveld renderen');

  return 'Customer login contract verified: isolated login -> Supabase/RLS -> customer portal';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(verifyCustomerLoginContract());
}
