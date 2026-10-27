import { deriveNeedProfile, NEED_DISCOVERY_STAGES } from '../../brain/revenue/need-discovery.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function mountNeedDiscovery(root,{state={}}={}){
  const source=state?.powerhouse?.need_discovery||state?.commercial?.need_discovery||{};
  const profile=deriveNeedProfile(source.answers||source);
  const items=NEED_DISCOVERY_STAGES.map(stage=>{
    const answer=profile.answers[stage.field];
    return `<article class="pvmodule"><small>${esc(stage.label)}</small><h3>${answer?'Bevestigd':'Nog te vragen'}</h3><p>${esc(answer||stage.question)}</p></article>`;
  }).join('');
  root.innerHTML=`<section data-need-discovery>
    <div class="pvmetricgrid">
      <article><small>Volledigheid</small><strong>${Math.round(profile.readiness*100)}%</strong></article>
      <article><small>Fase</small><strong>${esc(profile.stageLabel)}</strong></article>
      <article><small>Aanbod</small><strong>${esc(profile.recommendedOffer.replaceAll('_',' '))}</strong></article>
    </div>
    <section class="pvmodule"><div class="pvmodulehead"><span>✦</span><h3>Volgende beste vraag</h3></div><p>${esc(profile.nextQuestion)}</p><p><b>Verkoopregel:</b> ${profile.mayPitch?'De behoefte, impact en urgentie zijn bevestigd; een passende vervolgstap mag worden besproken.':'Eerst doorvragen en het antwoord in de woorden van de klant vastleggen.'}</p></section>
    <div class="pvgrid">${items}</div>
    <section class="pvmodule"><h3>Kanaalbreed gebruikt</h3><p>Website, posts, e-mail, echte LinkedIn-DM, gesprekken en portal gebruiken dezelfde fasering. Likes, klikken en opens tellen alleen als interesse; zij bevestigen geen probleem of koopbehoefte.</p></section>
  </section>`;
}
