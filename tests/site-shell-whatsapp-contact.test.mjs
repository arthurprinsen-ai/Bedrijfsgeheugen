import assert from 'node:assert/strict';
import { ensureWhatsAppContact, WHATSAPP_URL } from '../tools/site-shell/components.mjs';

const basis = '<!doctype html><html><body><main>inhoud</main></body></html>';
const eenKeer = ensureWhatsAppContact(basis);
const tweeKeer = ensureWhatsAppContact(eenKeer);

assert.equal(WHATSAPP_URL, 'https://wa.me/31627483345?text=Hoi%20Arthur%2C%20ik%20heb%20een%20vraag%20over%20Bedrijfsgeheugen.nl');
assert.ok(eenKeer.includes('data-bg-component="whatsapp-contact"'));
assert.ok(eenKeer.includes(`href="${WHATSAPP_URL}"`), 'WhatsApp href moet volledig en direct zijn');
assert.ok(eenKeer.includes('aria-label="WhatsApp met Arthur"'));
assert.ok(eenKeer.includes('target="_blank"'));
assert.ok(eenKeer.includes('rel="noopener noreferrer"'));
assert.ok(eenKeer.includes('@media(max-width:520px)'));
assert.equal((tweeKeer.match(/data-bg-component="whatsapp-contact"/g) || []).length, 1, 'injectie moet idempotent zijn');

console.log('sitewide WhatsApp contact: OK');
