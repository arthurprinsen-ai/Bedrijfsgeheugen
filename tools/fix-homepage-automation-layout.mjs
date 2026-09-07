import { readFile, writeFile } from 'node:fs/promises';

// Keep the live automation visual in normal document flow so it can never cover the copy.
const HOME = 'index.html';
const STYLE_ID = 'homepage-automation-layout-style';
const SCRIPT_ID = 'homepage-automation-layout-script';

export function applyHomepageAutomationLayout(html) {
  const source = String(html || '');
  if (source.includes(`id="${SCRIPT_ID}"`)) return source;

  for (const marker of [
    'Terwijl jij je bedrijf runt.',
    'Nieuwe CAO-regel gevonden',
    'Offerteflow geoptimaliseerd',
    'Proces zonder eigenaar',
    '3 kennisitems bijgewerkt',
    'Bedrijfsgezondheid',
  ]) {
    if (!source.includes(marker)) {
      throw new Error(`Homepage automation layout: vereiste marker ontbreekt: ${marker}`);
    }
  }

  if (!source.includes('</head>') || !source.includes('</body>')) {
    throw new Error('Homepage automation layout: ongeldige HTML-shell');
  }

  const css = `<style id="${STYLE_ID}">
/* The homepage must use one metric-stable font stack from first paint onward.
   This prevents external webfont swaps from moving hero copy, navigation and CTAs. */
html,
body,
body *{
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}
[data-bg-automation-layout]{
  display:grid!important;
  grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr)!important;
  column-gap:clamp(3rem,5vw,5.5rem)!important;
  row-gap:2.25rem!important;
  align-items:center!important;
}
[data-bg-automation-copy]{
  min-width:0!important;
  width:100%!important;
  max-width:36rem!important;
  position:relative!important;
  z-index:2!important;
}
[data-bg-automation-copy] h1,
[data-bg-automation-copy] h2{
  max-width:100%!important;
  text-wrap:balance!important;
}
[data-bg-automation-visual]{
  min-width:0!important;
  width:100%!important;
  max-width:46rem!important;
  justify-self:end!important;
  position:relative!important;
  inset:auto!important;
  left:auto!important;
  right:auto!important;
  top:auto!important;
  bottom:auto!important;
  transform:none!important;
  translate:none!important;
  margin:0!important;
  z-index:1!important;
}
@media(max-width:1180px){
  [data-bg-automation-layout]{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important;column-gap:2.5rem!important}
}
@media(max-width:980px){
  [data-bg-automation-layout]{grid-template-columns:1fr!important;row-gap:2rem!important}
  [data-bg-automation-copy]{max-width:42rem!important}
  [data-bg-automation-visual]{max-width:46rem!important;justify-self:start!important}
}
</style>`;

  const js = `<script id="${SCRIPT_ID}">
(function(){
  function text(el){return (el && el.textContent || '').replace(/\\s+/g,' ').trim();}
  function findExact(selector,value){
    return Array.prototype.find.call(document.querySelectorAll(selector),function(el){return text(el)===value;})||null;
  }
  function findContaining(value){
    return Array.prototype.find.call(document.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,p,span,div'),function(el){
      return text(el)===value;
    })||null;
  }
  function commonAncestor(a,b){
    var seen=[];var n=a;
    while(n){seen.push(n);n=n.parentElement;}
    n=b;
    while(n){if(seen.indexOf(n)!==-1)return n;n=n.parentElement;}
    return null;
  }
  function branchBelow(root,node){
    var n=node;
    while(n && n.parentElement && n.parentElement!==root)n=n.parentElement;
    return n && n.parentElement===root ? n : null;
  }
  function init(){
    if(document.documentElement.dataset.bgAutomationLayoutReady==='1')return;
    var heading=findExact('h1,h2,h3,h4','Terwijl jij je bedrijf runt.');
    var signal=findContaining('Nieuwe CAO-regel gevonden');
    if(!heading||!signal)return;

    var root=commonAncestor(heading,signal);
    if(!root||root===document.body||root===document.documentElement)return;
    var copy=branchBelow(root,heading);
    var visual=branchBelow(root,signal);
    if(!copy||!visual||copy===visual)return;

    var rootText=text(root);
    if(rootText.indexOf('Offerteflow geoptimaliseerd')===-1 ||
       rootText.indexOf('Proces zonder eigenaar')===-1 ||
       rootText.indexOf('3 kennisitems bijgewerkt')===-1 ||
       rootText.indexOf('Bedrijfsgezondheid')===-1) return;

    root.setAttribute('data-bg-automation-layout','');
    copy.setAttribute('data-bg-automation-copy','');
    visual.setAttribute('data-bg-automation-visual','');
    document.documentElement.dataset.bgAutomationLayoutReady='1';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
</script>`;

  return source.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
}

export async function fixHomepageAutomationLayout() {
  const html = await readFile(HOME, 'utf8');
  const next = applyHomepageAutomationLayout(html);
  await writeFile(HOME, next, 'utf8');
  console.log('Homepage automation layout guarded against text/visual overlap');
  return true;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await fixHomepageAutomationLayout();
}
