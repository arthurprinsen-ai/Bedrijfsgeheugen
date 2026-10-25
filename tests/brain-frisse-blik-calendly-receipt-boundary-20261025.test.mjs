import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../frisse-blik.html',import.meta.url),'utf8');
const start=html.indexOf('function isTrustedCalendlyScheduledMessage(e){');
const end=html.indexOf('function showCalStep(lead){',start);
assert.ok(start>=0&&end>start,'original UI has a separately testable origin guard');

const source={value:{contentWindow:{}}};
const context={URL,$:name=>name==='calWidget'?{querySelector:tag=>tag==='iframe'?source.value:null}:null};
const valid={
 origin:'https://calendly.com',source:source.value.contentWindow,
 data:{event:'calendly.event_scheduled',payload:{
 event:{uri:'https://api.calendly.com/scheduled_events/evt123'},
 invitee:{uri:'https://api.calendly.com/scheduled_events/evt123/invitees/inv123'}}}
};
function validate(message){
 return runInNewContext(html.slice(start,end)+'\nisTrustedCalendlyScheduledMessage(e)',{...context,e:message});
}
test('authentic Calendly iframe-origin and event/invitee URI shape only',()=>{
 assert.equal(validate(valid),true);
 assert.equal(validate({...valid,origin:'https://calendly.com.attacker.example'}),false);
 assert.equal(validate({...valid,origin:'https://example.org'}),false);
 assert.equal(validate({...valid,source:{}}),false);
 assert.equal(validate({...valid,data:{...valid.data,event:'calendly.date_and_time_selected'}}),false);
 assert.equal(validate({...valid,data:{...valid.data,payload:{}}}),false);
 assert.equal(validate({...valid,data:{...valid.data,payload:{...valid.data.payload,event:{uri:'https://api.calendly.com.evil.example/scheduled_events/evt123'}}}}),false);
 assert.equal(validate({...valid,data:{...valid.data,payload:{...valid.data.payload,invitee:{uri:'https://api.calendly.com/scheduled_events/other/invitees/inv123'}}}}),false);
 assert.equal(validate({...valid,data:{...valid.data,payload:{...valid.data.payload,event:{uri:'http://api.calendly.com/scheduled_events/evt123'}}}}),false);
});
test('browser notification cannot independently certify a booking or payment',()=>{
 assert.ok(html.includes("onBooked('calendly-ui-pending',e.data.payload)"));
 assert.ok(html.includes("booking_status:'PENDING_PROVIDER_READBACK'"));
 assert.doesNotMatch(html,/GESPREK GEBOEKT:/);
 assert.doesNotMatch(html,/Je adviesgesprek is geboekt/);
 assert.ok(html.includes("!$('ldOk').checked"),'mandatory explicit consent remains enforced');
 assert.ok(html.includes("id=\"scanAdviceBooking\" onclick=\"openLead()\""),'existing CTA and booking vendor reused');
});
