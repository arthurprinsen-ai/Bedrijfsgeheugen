import { readFile, writeFile } from 'node:fs/promises';

const HOME = 'index.html';
const STYLE_ID = 'homepage-platform-expertise-toggle-style';
const SCRIPT_ID = 'homepage-platform-expertise-toggle-script';

export function applyHomepagePlatformExpertiseToggle(html) {
  const source = String(html || '');
  if (source.includes(`id="${SCRIPT_ID}"`)) return source;

  for (const marker of [
    'Platform',
    'Expertise',
    'AI-copilot',
    'Organisatiebeheersing',
    'Externe signalen &amp; acties',
    'Frisse Blik',
    'Launch',
    'Continuous Improvement',
  ]) {
    if (!source.includes(marker) && !(marker === 'Externe signalen &amp; acties' && source.includes('Externe signalen & acties'))) {
      throw new Error(`Homepage Platform/Expertise toggle: vereiste marker ontbreekt: ${marker}`);
    }
  }

  if (!/<button\b[^>]*>\s*Platform\s*<\/button>/i.test(source)) {
    throw new Error('Homepage Platform/Expertise toggle: Platform-knop niet gevonden');
  }
  if (!/<button\b[^>]*>\s*Expertise\s*<\/button>/i.test(source)) {
    throw new Error('Homepage Platform/Expertise toggle: Expertise-knop niet gevonden');
  }

  const css = `<style id="${STYLE_ID}">
[data-bg-home-tab][aria-selected="true"]{background:#fff!important;color:#14171A!important}
[data-bg-home-tab][aria-selected="false"]{background:transparent!important;color:#9AA4AE!important}
[data-bg-home-panel][hidden]{display:none!important}
</style>`;

  const js = `<script id="${SCRIPT_ID}">
(function(){
  function txt(el){return (el && el.textContent || '').replace(/\\s+/g,' ').trim();}
  function hasAll(el,labels){var t=txt(el);return labels.every(function(label){return t.indexOf(label)!==-1;});}
  function deepestPanel(anchor,labels,opposite){
    var el=anchor;
    var best=null;
    while(el && el!==document.body){
      if(hasAll(el,labels)){
        if(opposite && txt(el).indexOf(opposite)!==-1) break;
        best=el;
      }
      el=el.parentElement;
    }
    return best;
  }
  function closestCommon(a,b){
    var seen=[];var n=a;
    while(n){seen.push(n);n=n.parentElement;}
    n=b;
    while(n){if(seen.indexOf(n)!==-1)return n;n=n.parentElement;}
    return null;
  }
  function findByExactText(root,selector,value){
    return Array.prototype.find.call((root||document).querySelectorAll(selector),function(el){return txt(el)===value;})||null;
  }
  function init(){
    if(document.documentElement.dataset.bgHomeToggleReady==='1')return;
    var buttons=Array.prototype.slice.call(document.querySelectorAll('button'));
    var platform=buttons.find(function(b){return txt(b)==='Platform';});
    var expertise=buttons.find(function(b){return txt(b)==='Expertise';});
    if(!platform||!expertise)return;

    var root=closestCommon(platform,expertise);
    while(root && root!==document.body && !(txt(root).indexOf('AI-copilot')!==-1 && txt(root).indexOf('Frisse Blik')!==-1)) root=root.parentElement;
    if(!root)return;

    var platformAnchor=findByExactText(root,'h1,h2,h3,h4,h5,h6,strong,b,div,span,p','AI-copilot');
    var expertiseAnchor=findByExactText(root,'h1,h2,h3,h4,h5,h6,strong,b,div,span,p','Frisse Blik');
    if(!platformAnchor||!expertiseAnchor)return;

    var platformPanel=deepestPanel(platformAnchor,['AI-copilot','Organisatiebeheersing','Externe signalen & acties'],'Frisse Blik') ||
                      deepestPanel(platformAnchor,['AI-copilot','Organisatiebeheersing','Externe signalen &amp; acties'],'Frisse Blik');
    var expertisePanel=deepestPanel(expertiseAnchor,['Frisse Blik','Launch','Continuous Improvement'],'AI-copilot');
    if(!platformPanel||!expertisePanel||platformPanel===expertisePanel)return;

    platform.id='homepage-platform-tab';
    expertise.id='homepage-expertise-tab';
    platformPanel.id='homepage-platform-panel';
    expertisePanel.id='homepage-expertise-panel';

    [platform,expertise].forEach(function(btn){btn.setAttribute('role','tab');btn.setAttribute('data-bg-home-tab','');btn.setAttribute('tabindex','-1');});
    platform.setAttribute('aria-controls',platformPanel.id);
    expertise.setAttribute('aria-controls',expertisePanel.id);
    [platformPanel,expertisePanel].forEach(function(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('data-bg-home-panel','');});
    platformPanel.setAttribute('aria-labelledby',platform.id);
    expertisePanel.setAttribute('aria-labelledby',expertise.id);
    var tablist=closestCommon(platform,expertise);
    if(tablist)tablist.setAttribute('role','tablist');

    function select(which,focus){
      var isPlatform=which==='platform';
      platform.setAttribute('aria-selected',isPlatform?'true':'false');
      expertise.setAttribute('aria-selected',isPlatform?'false':'true');
      platform.tabIndex=isPlatform?0:-1;
      expertise.tabIndex=isPlatform?-1:0;
      platformPanel.hidden=!isPlatform;
      expertisePanel.hidden=isPlatform;
      platform.classList.toggle('active',isPlatform);
      expertise.classList.toggle('active',!isPlatform);
      if(focus)(isPlatform?platform:expertise).focus();
    }

    platform.addEventListener('click',function(){select('platform',false);});
    expertise.addEventListener('click',function(){select('expertise',false);});
    [platform,expertise].forEach(function(btn){
      btn.addEventListener('keydown',function(e){
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
          e.preventDefault();
          select(btn===platform?'expertise':'platform',true);
        }else if(e.key==='Home'){
          e.preventDefault();select('platform',true);
        }else if(e.key==='End'){
          e.preventDefault();select('expertise',true);
        }
      });
    });

    select('platform',false);
    document.documentElement.dataset.bgHomeToggleReady='1';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
</script>`;

  if (!source.includes('</head>') || !source.includes('</body>')) {
    throw new Error('Homepage Platform/Expertise toggle: ongeldige HTML-shell');
  }
  return source.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
}

const html = await readFile(HOME, 'utf8');
const next = applyHomepagePlatformExpertiseToggle(html);
await writeFile(HOME, next, 'utf8');
console.log('Homepage Platform/Expertise toggle wired and guarded');
