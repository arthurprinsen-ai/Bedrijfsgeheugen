import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync(new URL('../assets/bg-app-experience.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/bg-app-experience.css',import.meta.url),'utf8');
function run(pathname,privateShell){
 const nodes=[],classes=[];
 const document={readyState:'complete',
  body:{appendChild(x){nodes.push(x);},classList:{add(x){classes.push(x);}}},
  querySelector(selector){
   if(selector==='[data-bg-app-public-dock]')return nodes.find(x=>x.dataset?.bgAppPublicDock==='1')||null;
   if(privateShell && selector.includes('#portalView'))return {id:'portalView'};
   return null;
  },
  createElement(tag){return {tag,dataset:{},children:[],attributes:{},classList:{add(){}},
   setAttribute(k,v){this.attributes[k]=v;},append(...x){this.children.push(...x);},appendChild(x){this.children.push(x);},addEventListener(){}};}
 };
 const location={origin:'https://www.bedrijfsgeheugen.nl',pathname,protocol:'https:',hostname:'www.bedrijfsgeheugen.nl'};
 const window={matchMedia(){return {matches:false};},addEventListener(){}};
 vm.runInNewContext(js,{document,location,window,navigator:{standalone:false}},{timeout:1000});
 return {nodes,classes};
}
test('real private portal shell excludes public dock even behind a public/rewrite URL',()=>{
 for(const path of ['/','/klantportaal','/portal-v2/']){
  const {nodes,classes}=run(path,true);
  assert.equal(nodes.filter(x=>x.dataset?.bgAppPublicDock==='1').length,0,path);
  assert.equal(classes.includes('bg-app-public-has-dock'),false,path);
 }
});
test('original public pages still get one public dock with absolute HTTPS links',()=>{
 const {nodes}=run('/',false), dock=nodes.find(x=>x.dataset?.bgAppPublicDock==='1');
 assert.ok(dock);assert.equal(dock.children.length,4);
 dock.children.forEach(x=>assert.match(x.href,/^https:\/\/www\.bedrijfsgeheugen\.nl\//));
});
test('late private hydration makes an already-created public dock non-interactive',()=>{
 assert.match(css,/body:has\(#portalView\) \.bg-app-public-dock/);
 assert.match(css,/body:has\(\[data-portal-mobile-primary\]\) \.bg-app-public-dock/);
 assert.match(css,/display:none!important;visibility:hidden!important;pointer-events:none!important/);
});
