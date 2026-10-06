import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const delivery = fs.readFileSync('netlify/functions/social-publication-delivery.mjs', 'utf8');
const deployHook = fs.readFileSync('netlify/functions/social-publication-delivery-deploy.mjs', 'utf8');

test('social delivery supervisor retries at most ten minutes after a missed daily publication', () => {
  assert.match(delivery, /schedule:\s*'\*\/10 \* \* \* \*'/);
  assert.match(delivery, /triggerCanonicalPublisher/);
  assert.match(delivery, /runSocialPublicationDelivery/);
});

test('production deploys trigger the same canonical idempotent recovery path', () => {
  assert.match(deployHook, /runSocialPublicationDelivery/);
  assert.match(deployHook, /deploySucceeded/);
  assert.match(deployHook, /event\?\.deploy\?\.context\s*!==\s*'production'/);
  assert.doesNotMatch(deployHook, /LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH|createPost\(/);
});

test('recovery remains bounded by the publication window and canonical single-writer publisher', () => {
  assert.match(delivery, /local\.hour < 7 \|\| local\.hour > 20/);
  assert.match(delivery, /powerhouse-social-publisher/);
  assert.match(delivery, /canonical publication runs before any Buffer read/i);
});
