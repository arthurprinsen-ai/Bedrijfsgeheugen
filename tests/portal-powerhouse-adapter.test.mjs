import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRuntimeSnapshotToPortalFlow } from '../portal-next/portal-powerhouse-adapter.js';
test('success zonder execution evidence wordt niet verified',()=>{const s=mapRuntimeSnapshotToPortalFlow({agents:[{id:'a',status:'success',evidence:[]}]});assert.notEqual(s.powerhouse[0].status,'verified')});
test('team paused limit resulteert in blocked + open recovery',()=>{const s=mapRuntimeSnapshotToPortalFlow({agents:[{id:'brain-writeback',status:'paused',errorCode:'brain-writeback-make-team-paused-limit-v1',recoveryOpen:true}]});assert.equal(s.powerhouse[0].status,'blocked');assert.equal(s.powerhouse[0].recoveryObligation.open,true)});
