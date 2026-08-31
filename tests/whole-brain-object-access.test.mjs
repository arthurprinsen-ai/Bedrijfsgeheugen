import test from 'node:test';
import assert from 'node:assert/strict';
import {canAccessRecord,filterAuthorizedRecords,assertCanWriteRecord} from '../brain/operating-loop/object-access-policy.mjs';

const principal={userId:'u1',tenantId:'T1',roles:['manager'],attributes:{department:'sales'}};
const open={tenantId:'T1',id:'R1',payload:{}};
const restrictedRole={tenantId:'T1',id:'R2',payload:{access:{visibility:'restricted',roles:['manager']}}};
const restrictedOther={tenantId:'T1',id:'R3',payload:{access:{visibility:'restricted',roles:['finance']}}};
const restrictedUser={tenantId:'T1',id:'R4',payload:{access:{visibility:'restricted',users:['u1']}}};
const wrongTenant={tenantId:'T2',id:'R5',payload:{}};

test('object access always enforces tenant then object ABAC',()=>{
 assert.equal(canAccessRecord(open,principal),true);
 assert.equal(canAccessRecord(restrictedRole,principal),true);
 assert.equal(canAccessRecord(restrictedOther,principal),false);
 assert.equal(canAccessRecord(restrictedUser,principal),true);
 assert.equal(canAccessRecord(wrongTenant,principal),false);
 assert.deepEqual(filterAuthorizedRecords([open,restrictedRole,restrictedOther,restrictedUser,wrongTenant],principal).map(x=>x.id),['R1','R2','R4']);
});

test('write is fail-closed for denied object policy',()=>{
 assert.doesNotThrow(()=>assertCanWriteRecord({...open,payload:{access:{visibility:'restricted',roles:['manager']}}},principal));
 assert.throws(()=>assertCanWriteRecord(restrictedOther,principal),/OBJECT_ACCESS_DENIED/);
});
