(function(){
  function init(){
    var toggle=document.getElementById('mobileToggle');
    var nav=document.getElementById('bgMobileNav');
    if(!toggle||!nav)return;

    if(!toggle.querySelector('.bg-mobile-menu-label')){
      toggle.innerHTML='<span class="bg-mobile-menu-label">Menu</span><span class="bg-mobile-menu-icon" aria-hidden="true"></span>';
    }
    toggle.setAttribute('aria-controls','bgMobileNav');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');

    var label=toggle.querySelector('.bg-mobile-menu-label');
    var root=nav.querySelector('[data-bg-mobile-view="root"]');

    function primaryLink(href,text){
      var a=document.createElement('a');
      a.className='bg-mobile-row';
      a.href=href;
      a.innerHTML='<span>'+text+'</span><span class="bg-mobile-arrow" aria-hidden="true">→</span>';
      return a;
    }

    function overviewLink(viewName,href,text,description){
      var view=nav.querySelector('[data-bg-mobile-view="'+viewName+'"]');
      if(!view||view.querySelector('a[href="'+href+'"]'))return;
      var title=view.querySelector('.bg-mobile-subtitle');
      var a=document.createElement('a');
      a.className='bg-mobile-link';
      a.href=href;
      a.innerHTML='<span>'+text+(description?'<small>'+description+'</small>':'')+'</span><span aria-hidden="true">→</span>';
      if(title&&title.nextSibling)view.insertBefore(a,title.nextSibling);else view.appendChild(a);
    }

    function ensurePrimaryCatalog(){
      if(!root||root.getAttribute('data-bg-primary-catalog')==='v2')return;
      var solutions=root.querySelector('[data-bg-mobile-target="oplossingen"]');
      var platform=root.querySelector('[data-bg-mobile-target="bedrijfsgeheugen"]');
      var integrations=root.querySelector('[data-bg-mobile-target="koppelingen"]');
      var knowledge=root.querySelector('[data-bg-mobile-target="kennis"]');
      var about=root.querySelector('a[href="/over-ons"]');
      var expertises=root.querySelector('a[href="/expertises"]');
      var cta=root.querySelector('.bg-mobile-cta');
      var meta=root.querySelector('.bg-mobile-meta');

      if(platform)platform.innerHTML='Platform <span class="bg-mobile-arrow" aria-hidden="true">→</span>';

      var ordered=[
        primaryLink('/problemen','Problemen'),
        solutions,
        platform,
        primaryLink('/prijzen','Prijzen'),
        primaryLink('/cases','Cases'),
        knowledge,
        about,
        integrations,
        expertises
      ].filter(Boolean);
      ordered.forEach(function(item){root.appendChild(item);});

      var login=primaryLink('/inloggen','Inloggen');
      login.classList.add('bg-mobile-secondary');
      var signup=primaryLink('/aanmelden','Aanmelden');
      signup.classList.add('bg-mobile-secondary');
      root.appendChild(login);
      root.appendChild(signup);
      if(cta)root.appendChild(cta);
      if(meta)root.appendChild(meta);
      root.setAttribute('data-bg-primary-catalog','v2');

      overviewLink('oplossingen','/oplossingen','Alle oplossingen','Organisatie, automatisering, data en AI in samenhang');
      overviewLink('kennis','/kennis','Kennisoverzicht','Vraag, lees en vertaal kennis naar je eigen bedrijf');
    }

    ensurePrimaryCatalog();
    var views=Array.prototype.slice.call(nav.querySelectorAll('[data-bg-mobile-view]'));

    function showView(name){
      views.forEach(function(view){
        if(view.getAttribute('data-bg-mobile-view')===name)view.removeAttribute('hidden');
        else view.setAttribute('hidden','');
      });
      var active=nav.querySelector('[data-bg-mobile-view="'+name+'"]');
      if(active)active.scrollTop=0;
    }

    function closeMenu(){
      nav.setAttribute('aria-hidden','true');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Open menu');
      if(label)label.textContent='Menu';
      document.documentElement.style.overflow='';
      document.body.style.overflow='';
      showView('root');
    }

    function openMenu(){
      nav.setAttribute('aria-hidden','false');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Sluit menu');
      if(label)label.textContent='Sluit';
      document.documentElement.style.overflow='hidden';
      document.body.style.overflow='hidden';
      showView('root');
    }

    document.addEventListener('click',function(event){
      var clickedToggle=event.target.closest&&event.target.closest('#mobileToggle');
      if(clickedToggle){
        event.preventDefault();
        event.stopImmediatePropagation();
        if(nav.getAttribute('aria-hidden')==='false')closeMenu();else openMenu();
        return;
      }
      var target=event.target.closest&&event.target.closest('[data-bg-mobile-target]');
      if(target&&nav.contains(target)){
        event.preventDefault();
        showView(target.getAttribute('data-bg-mobile-target'));
        return;
      }
      var back=event.target.closest&&event.target.closest('[data-bg-mobile-back]');
      if(back&&nav.contains(back)){
        event.preventDefault();
        showView('root');
      }
    },true);

    nav.addEventListener('click',function(event){
      var link=event.target.closest&&event.target.closest('a[href]');
      if(link)closeMenu();
    });

    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&nav.getAttribute('aria-hidden')==='false'){
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener('resize',function(){
      if(window.innerWidth>1100&&nav.getAttribute('aria-hidden')==='false')closeMenu();
    });

    nav.setAttribute('aria-hidden','true');
    showView('root');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
