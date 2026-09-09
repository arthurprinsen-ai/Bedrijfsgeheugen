import test from 'node:test';
import assert from 'node:assert/strict';
import { CLUSTER_CSS } from '../tools/clusters.mjs';

test('desktop Chrome mag publieke data-op inhoud nooit onzichtbaar maken', () => {
  assert.match(
    CLUSTER_CSS,
    /html\.bgx-beweegt \[data-op\]\s*\{[^}]*opacity:\s*1\s*!important[^}]*transform:\s*none\s*!important/s,
    'fail-safe ontbreekt: data-op inhoud kan opacity:0 blijven tot een resize/DevTools repaint'
  );
});
