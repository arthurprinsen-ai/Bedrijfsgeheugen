import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('pw-mo14-1/zaalplanner/coach-ui.js','utf8');
const start=source.indexOf('function validateCoachBackupSafety(next){');
const end=source.indexOf("\nconst BACKUP_MAGIC=",start);
assert.ok(start>0&&end>start,'Back-up safety validator must be present');
const validate=new Function(source.slice(start,end)+';return validateCoachBackupSafety;')();
const base=()=>({half:20,step:10,selectedMatch:0,roster:Array.from({length:6},(_,i)=>({id:'p'+i,name:'Speler '+i,roles:i?['A','M','V']:[]})),matches:[{fixtureId:'game-1',keeper:'p0',absent:[],date:'2026-12-06',time:'12:00',opponent:'Tegenstander',coachNotes:'Eerste helft',coachBoard:{strokes:[{tool:'pen',color:'#123456',width:6,points:[[0.1,0.2],[0.4,0.8]]}],tokens:{p1:[0.4,0.2]}}}]});
const reject=(fn,msg)=>{const d=base();fn(d);assert.throws(()=>validate(d),/Ongeldige back-up/,msg)};
test('valid offline coach backup remains importable',()=>assert.doesNotThrow(()=>validate(base())));
test('malicious drawing payload, nonfinite coordinates and prototype keys fail closed',()=>{
 reject(d=>d.matches[0].coachBoard.strokes=[{tool:'pen',color:'#123456',width:6,points:Array.from({length:401},()=>[.3,.3])}],'stroke capacity');
 reject(d=>d.matches[0].coachBoard.strokes[0].points[0]=[NaN,.2],'nonfinite coordinate');
 reject(d=>d.matches[0].coachBoard.strokes[0].points[0]=[100,.2],'out-of-field coordinate');
 reject(d=>Object.defineProperty(d.matches[0].coachBoard.tokens,'__proto__',{enumerable:true,value:[.2,.3],configurable:true}),'prototype key');
 reject(d=>d.matches[0].coachBoard.strokes[0].color='url(javascript:alert(1))','unsafe colour');
 reject(d=>d.matches[0].coachBoard.strokes[0].tool='script','invalid tool');
});
test('notes, minutes and imported position data are bounded',()=>{
 reject(d=>d.matches[0].coachNotes='x'.repeat(5001),'oversized notes');
 reject(d=>d.step=0,'invalid step');
 reject(d=>d.selectedMatch=99,'index must exist');
 reject(d=>d.roster[1].id='constructor','reserved object key');
 reject(d=>d.matches[0].firstLineup={AL:'p0'},'keeper cannot play outfield');
 reject(d=>d.matches[0].actualConfirmed=true,'unverified actual minute totals');
});
test('guard is invoked before overwrite authorization and state assignment',()=>{
 const guard=source.indexOf('validateCoachBackupSafety(next);');
 const confirm=source.indexOf("if(!confirm('Herstel");
 const assign=source.indexOf('state=next;',confirm);
 assert.ok(guard>=0&&confirm>guard&&assign>confirm);
 assert.match(source,/file.size>5\*1024\*1024/);
});
