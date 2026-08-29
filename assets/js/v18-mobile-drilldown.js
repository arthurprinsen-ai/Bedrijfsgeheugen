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
    var views=Array.prototype.slice.call(nav.querySelectorAll('[data-bg-mobile-view]'));
    var root=nav.querySelector('[data-bg-mobile-view="root"]');

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
