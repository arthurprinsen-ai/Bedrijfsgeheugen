import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const targets=[
  ...fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.html')).map(e=>path.join(root,e.name))
];

for(const dirName of ['blog','en','pages','portal','portal-next']){
  const dir=path.join(root,dirName);
  if(fs.existsSync(dir))walk(dir,targets);
}

let changed=0,covered=0;
for(const file of [...new Set(targets)]){
  if(path.basename(file)==='cms.html')continue;
  let html=fs.readFileSync(file,'utf8');
  if(!/<\/head>/i.test(html))continue;
  covered++;
  if(html.includes('/assets/cms-runtime.js'))continue;
  html=html.replace(/<\/head>/i,'<script src="/assets/cms-runtime.js" defer data-bg-cms-runtime="1"></script>\n</head>');
  fs.writeFileSync(file,html);
  changed++;
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
