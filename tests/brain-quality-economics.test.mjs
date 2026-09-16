import test from 'node:test'; import assert from 'node:assert/strict'; import {recommendLane} from '../scripts/brain/quality/test-economics.mjs';
test('critical remains required regardless runtime',()=>assert.equal(recommendLane({critical:true,runtime_ms:9999999,defect_yield:0}).lane,'required'));
test('unknown is not treated as zero risk',()=>assert.equal(recommendLane({risk:'unknown',runtime_ms:1,defect_yield:null}).lane,'required'));
