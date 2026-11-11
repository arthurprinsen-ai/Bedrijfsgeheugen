import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const targets=[
  ...fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.html')).map(e=>path.join(root,e.name))
];

for(const dirName of ['blog','en','pages','portal','portal-next','kennis','behoeftecheck','openai-ai-modellen','claude-ai-modellen','gemini-ai-modellen','mistral-ai-modellen','amazon-ai-modellen','chatgpt-vs-claude','chatgpt-vs-gemini','claude-vs-gemini']){
  const dir=path.join(root,dirName);
  if(fs.existsSync(dir))walk(dir,targets);
}

const mobileUiStyle='<style id="bg-sitewide-mobile-ui-20261111">\n'+fs.readFileSync(path.join(root,'assets/sitewide-mobile-ui-20261111.css'),'utf8')+'\n</style>';\nconst mobileUiScript='<script src="/assets/sitewide-mobile-ui-20261111.js?v=20261111a" defer data-bg-sitewide-mobile-ui="1"></script>';\n\nlet changed=0,covered=0;
for(const file of [...new Set(targets)]){
  if(path.basename(file)==='cms.html')continue;
  let html=fs.readFileSync(file,'utf8');
  if(!/<\/head>/i.test(html))continue;
  covered++;
  const before=html;
  if(!html.includes('/assets/cms-runtime.js')){
    html=html.replace(/<\/head>/i,'<script src="/assets/cms-runtime.js" defer data-bg-cms-runtime="1"></script>\n</head>');
  }
  if(!html.includes('/assets/mobile-viewport-cleanup.js')){
    html=html.replace(/<\/head>/i,'<script src="/assets/mobile-viewport-cleanup.js?v=20261015" defer data-bg-mobile-fix="1"></script>\n</head>');
  }
  // Public pages share one header/menu/CTA/slider repair, including nested /kennis.\n  // Keep portal/authenticated applications isolated from marketing-site CSS.\n  const rel=path.relative(root,file).replaceAll(path.sep,'/');\n  const publicPage=!/^(?:portal|portal-next|portal-v2|intern)\\//.test(rel);\n  if(publicPage){\n    if(!html.includes('id="bg-sitewide-mobile-ui-20261111"')){\n      html=html.replace(/<\\/head>/i,mobileUiStyle+'\\n</head>');\n    }\n    if(!html.includes('data-bg-sitewide-mobile-ui=')){\n      html=html.replace(/<\\/head>/i,mobileUiScript+'\\n</head>');\n    }\n  }\n  if(html!==before){fs.writeFileSync(file,html);changed++;}
}

const inventory={
  version:1,
  generatedAt:new Date().toISOString(),
  contract:'canonical-cms-runtime-coverage-v1',
  pages:[...new Set(targets)].filter(f=>path.basename(f)!=='cms.html').map(file=>{
    const rel=path.relative(root,file).replaceAll(path.sep,'/');
    const html=fs.readFileSync(file,'utf8');
    return {
      file:rel,
      route:routeFor(rel),
      cmsRuntime:html.includes('/assets/cms-runtime.js'),
      headings:(html.match(/<h[1-6]\b/gi)||[]).length,
      links:(html.match(/<a\b/gi)||[]).length,
      buttons:(html.match(/<button\b/gi)||[]).length,
      images:(html.match(/<img\b/gi)||[]).length,
      forms:(html.match(/<form\b/gi)||[]).length,
      meta:(html.match(/<meta\b/gi)||[]).length
    };
  }).sort((a,b)=>a.route.localeCompare(b.route))
};
fs.writeFileSync(path.join(root,'site','cms-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
console.log(JSON.stringify({contract:inventory.contract,covered,changed,inventory:inventory.pages.length}));

function walk(dir,out){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out); else if(e.isFile()&&e.name.endsWith('.html'))out.push(p);
  }
}
function routeFor(rel){
  if(rel==='index.html')return '/';
  let r='/'+rel.replace(/index\.html$/,'').replace(/\.html$/,'').replace(/\\/g,'/');
  r=r.replace(/\/+/g,'/');
  if(r.length>1&&r.endsWith('/'))r=r.slice(0,-1);
  return r;
}
