import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldMarkup} from '../portal-v2/form-primitives.js';
import {allPageIds} from '../portal-v2/page-registry.js';
import {functionalSchema} from '../portal-v2/modules/functional-suite.js';
import {companyInputSchema} from '../portal-v2/modules/company-input.js';
import {fullCompanyInputSchema} from '../portal-v2/modules/full-company-input.js';

const schemas=page=>[
 ...functionalSchema(page),
 ...(page==='profiel'?companyInputSchema('profiel'):[]),
 ...(page==='gegevens-invullen'?fullCompanyInputSchema():[])
];
const escapeAttribute=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

test('every native customer input renders its unchanged canonical portal path alongside exact field id',()=>{
 let checked=0;
 for(const page of allPageIds())for(const field of schemas(page)){
   assert.ok(field.path?.startsWith('portal.'),page+':'+field.id);
   const markup=fieldMarkup(field);
   assert.ok(markup.includes('data-field-id="'+escapeAttribute(field.id)+'"'),page+':'+field.id);
   assert.ok(markup.includes('data-field-path="'+escapeAttribute(field.path)+'"'),page+':'+field.id);
   assert.equal((markup.match(/data-field-path=/g)||[]).length,1,'exact one provenance attribute per native field: '+field.id);
   checked++;
 }
 assert.ok(checked>=370,'unexpected loss of native form surface declarations: '+checked);
});

test('unmapped fields are not falsely labeled canonical and HTML special characters are never executable',()=>{
 const missing=fieldMarkup({id:'no-path',label:'Pending customer ownership',type:'text'});
 assert.match(missing,/data-field-path=""/);
 assert.doesNotMatch(missing,/data-field-path="portal\./);
 const injected=fieldMarkup({id:'danger',path:'portal.profile." onfocus="evil',label:'Unsafe <script>',type:'text'});
 assert.match(injected,/data-field-path="portal\.profile\.&quot; onfocus=&quot;evil"/);
 assert.doesNotMatch(injected,/data-field-path="portal\.profile\." onfocus="evil"/);
 assert.ok(injected.includes('Unsafe &lt;script&gt;'),'unsafe label must be escaped, never emitted as HTML');
});

test('repeatable groups preserve path lineage even before dynamic rows are enumerated',()=>{
 const markup=fieldMarkup({id:'test-repeatable',type:'repeatable',path:'portal.people.educationHistory',columns:[{id:'year'}]});
 assert.match(markup,/role="group"/);
 assert.match(markup,/data-field-path="portal\.people\.educationHistory"/);
 // This does not claim the dynamic added rows are already inventoried.
 assert.doesNotMatch(markup,/data-field-id="year"/);
});
