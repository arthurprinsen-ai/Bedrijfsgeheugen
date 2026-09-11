import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hardening = await readFile(new URL('../supabase/migrations/20260830132843_safe_security_hardening.sql', import.meta.url), 'utf8');
const serverOnly = await readFile(new URL('../supabase/migrations/20260830133125_internal_views_server_only.sql', import.meta.url), 'utf8');
const views = ['benchmark_branche','benchmark_niveaus','benchmark_offertes'];

test('stand_bijgewerkt uses a fixed search_path', () => { assert.match(hardening, /alter\s+function\s+public\.stand_bijgewerkt\(\)\s+set\s+search_path\s*=\s*public\s*,\s*pg_temp/i); });
test('benchmark views retain read-only access for client and service roles', () => { for (const view of views) assert.match(hardening, new RegExp(`public\\.${view}`)); assert.match(hardening, /revoke\s+all[\s\S]*from\s+anon\s*,\s*authenticated\s*,\s*service_role/i); assert.match(hardening, /grant\s+select[\s\S]*to\s+anon\s*,\s*authenticated\s*,\s*service_role/i); assert.doesNotMatch(hardening, /grant[^;]*(insert|update|delete|truncate|trigger|references)/i); });
test('later canonical migration closes internal pricing and reuse views to server-only access', () => { for (const view of ['prijsadvies','hergebruik_rendement']) assert.match(serverOnly, new RegExp(`public\\.${view}`)); assert.match(serverOnly, /revoke\s+all[\s\S]*from\s+anon\s*,\s*authenticated\s*,\s*service_role/i); assert.match(serverOnly, /grant\s+select[\s\S]*to\s+service_role/i); assert.doesNotMatch(serverOnly, /grant[^;]*(anon|authenticated)/i); });
