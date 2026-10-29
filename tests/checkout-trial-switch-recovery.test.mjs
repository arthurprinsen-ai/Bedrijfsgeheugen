import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Regression: the production page transformer may omit a presentational
// container even when source HTML contains it. Checkout must still expose
// the paid/trial mode switch without throwing a browser exception.
const html=readFileSync(new URL('../afsluiten.html',import.meta.url),'utf8');
const begin=html.indexOf('function setTrialLink(text,href){');
const end=html.indexOf("if(q.get('success')",begin);
assert.ok(begin>=0 && end>begin,'Checkout trial-link function must exist');
const functionSource=html.slice(begin,end).trim();

function createDocument({withTrialSwitch}){
  const elements=new Map();
  const makeElement=tag=>({
    tagName:tag.toUpperCase(),
    id:'',
    className:'',
    attributes:{},
    children:[],
    setAttribute(key,value){this.attributes[key]=value;},
    replaceChildren(...nodes){this.children=nodes;},
  });
  const form=makeElement('form');
  form.id='form';
  form.appendChild=function(element){
    this.children.push(element);
    elements.set(element.id,element);
  };
  elements.set('form',form);
  if(withTrialSwitch){
    const trialSwitch=makeElement('p');
    trialSwitch.id='trialSwitch';
    elements.set('trialSwitch',trialSwitch);
  }
  return {
    document:{
      getElementById(id){return elements.get(id)||null;},
      createElement:makeElement,
    },
    elements,
    form,
  };
}

for(const withTrialSwitch of [false,true]){
  test(`checkout preserves the trial mode switch when container exists=${withTrialSwitch}`,()=>{
    const {document,elements,form}=createDocument({withTrialSwitch});
    vm.runInNewContext(`${functionSource}\nsetTrialLink('Try 30 days free','?plan=starter&trial=1');`,{document});
    const switchElement=elements.get('trialSwitch');
    assert.ok(switchElement,'trialSwitch must exist after initialization');
    assert.equal(switchElement.children.length,1);
    assert.equal(switchElement.children[0].tagName,'A');
    assert.equal(switchElement.children[0].textContent,'Try 30 days free');
    assert.equal(switchElement.children[0].attributes.href,'?plan=starter&trial=1');
    assert.equal(form.children.length,withTrialSwitch?0:1);
  });
}
