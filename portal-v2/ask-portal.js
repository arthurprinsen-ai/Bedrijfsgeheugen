/**
 * "Vraag het je portaal" — teruggebracht uit het vorige portaal (veld `vbIn`).
 * Praat met de bestaande, tenantgebonden functie op /api/portaalvraag; de
 * browser stuurt alleen de vraag, de context wordt server-side bepaald.
 */

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export async function askPortal(question,{fetchImpl=globalThis.fetch,page='overzicht'}={}){
  const clean=String(question||'').trim();
  if(!clean)throw new Error('VRAAG_LEEG');
  if(clean.length>500)throw new Error('VRAAG_TE_LANG');
  const response=await fetchImpl('/api/portaalvraag',{
    method:'POST',
    headers:{'content-type':'application/json'},
    credentials:'same-origin',
    body:JSON.stringify({question:clean,context:{page}})
  });
  if(!response.ok)throw new Error(`PORTAALVRAAG_${response.status}`);
  const payload=await response.json();
  return String(payload?.answer||payload?.text||'').trim();
}

export function mountAskPortal(root,{fetchImpl=globalThis.fetch,currentPage=()=>'overzicht'}={}){
  if(!root||root.querySelector('[data-ask-portal]'))return ()=>{};
  const block=document.createElement('section');
  block.className='v2ask';
  block.dataset.askPortal='true';
  block.innerHTML=`<div class="v2askhead"><b>Vraag het je portaal</b><span>Antwoord op basis van je eigen gegevens en project — niets anders.</span></div>`
    +`<div class="v2askrow"><input type="text" data-ask-input maxlength="500" placeholder="Bijvoorbeeld: wanneer is het directiescherm klaar?" aria-label="Stel een vraag over je eigen portaal"><button type="button" class="primary" data-ask-send>Vraag</button></div>`
    +`<output class="v2askout" data-ask-output aria-live="polite"></output>`;
  root.appendChild(block);

  const input=block.querySelector('[data-ask-input]');
  const button=block.querySelector('[data-ask-send]');
  const output=block.querySelector('[data-ask-output]');

  const ask=async()=>{
    const question=input.value.trim();
    if(!question){output.textContent='Stel eerst een vraag.';return;}
    button.disabled=true;output.textContent='Bezig met opzoeken in je eigen gegevens…';
    try{
      const answer=await askPortal(question,{fetchImpl,page:currentPage()});
      output.innerHTML=answer?`<p>${esc(answer)}</p>`:'<p>Daar staat nog niets over in je portaal.</p>';
    }catch(error){
      output.innerHTML=`<p>Geen antwoord opgehaald (${esc(error.message)}). Log in of probeer het opnieuw.</p>`;
    }finally{button.disabled=false;}
  };

  button.addEventListener('click',ask);
  input.addEventListener('keydown',event=>{if(event.key==='Enter')ask();});
  return ()=>block.remove();
}
