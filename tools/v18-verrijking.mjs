// Interactie, mensen en vindbaarheid — voor elke pagina gelijk.
//
// Drie dingen:
// 1. beweging: onderdelen komen op bij het scrollen, kaarten en knoppen reageren op de muis
// 2. mensen: een gezicht bij het verhaal, want daar kijken bezoekers naar
// 3. vindbaarheid: kruimelpad, vragen, artikel en organisatie als schema, zodat
//    Google en AI-antwoordmachines weten wat er op de pagina staat

export const INTERACTIE_CSS = `<style id="v18-interactie">
/* Verbergen gebeurt alleen als het script het ook weer kan onthullen. Zonder
   die voorwaarde blijft de inhoud onzichtbaar zodra er iets misgaat. */
html.bgx-beweegt [data-op]{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
html.bgx-beweegt [data-op].bgx-zichtbaar{opacity:1;transform:none}
html.bgx-beweegt [data-op]:nth-child(2){transition-delay:.05s}
html.bgx-beweegt [data-op]:nth-child(3){transition-delay:.1s}
html.bgx-beweegt [data-op]:nth-child(4){transition-delay:.15s}
@media(prefers-reduced-motion:reduce){html.bgx-beweegt [data-op]{opacity:1;transform:none;transition:none}}

/* op een telefoon bestaat hover niet: dan reageert de kaart op de aanraking */
@media(hover:none){
  .inhoud-body .kaart:active,.inhoud-body .p-kaart:active,.inhoud-body .tegel:active,
  .inhoud-body .blok:active,.inhoud-body .stap:active,.bgx-staptegel:active{transform:scale(.985)}
}

.inhoud-body .kaart,.inhoud-body .p-kaart,.inhoud-body .tegel,.inhoud-body .blok,.inhoud-body .stap{
  transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.inhoud-body .kaart:hover,.inhoud-body .p-kaart:hover,.inhoud-body .tegel:hover,.inhoud-body .blok:hover,.inhoud-body .stap:hover{
  transform:translateY(-4px);box-shadow:0 30px 80px rgba(7,21,35,.16);border-color:rgba(39,66,214,.35)}
.inhoud-body .btn,.inhoud-body .knop,.inhoud-body a.cta{transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
.inhoud-body .btn:hover,.inhoud-body .knop:hover,.inhoud-body a.cta:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(7,21,35,.18)}
.inhoud-body p a{background-image:linear-gradient(var(--blue),var(--blue));background-size:0% 2px;background-position:0 100%;
  background-repeat:no-repeat;transition:background-size .3s ease;text-decoration:none;padding-bottom:2px}
.inhoud-body p a:hover{background-size:100% 2px}
.inhoud-body tbody tr{transition:background .2s ease}
.inhoud-body tbody tr:hover{background:rgba(39,66,214,.05)}

/* vraag en antwoord: klik om open te klappen */
.bgx-vraag{width:100%;text-align:left;background:none;border:0;padding:0;font:inherit;font-weight:750;color:var(--ink);
  display:flex;justify-content:space-between;gap:16px;align-items:center;cursor:pointer}
.bgx-vraag::after{content:"+";font-size:22px;color:var(--blue);transition:transform .25s ease}
.bgx-vraag[aria-expanded=true]::after{transform:rotate(45deg)}
.bgx-antwoord{overflow:hidden;max-height:0;transition:max-height .3s ease}
.bgx-antwoord[data-open=ja]{max-height:900px}

/* op deze pagina */
.bgx-opdezepagina{position:sticky;top:88px;float:right;width:230px;margin:0 0 24px 32px;padding:16px 18px;background:var(--white);
  border:1px solid var(--line);border-radius:18px;font-size:14px;box-shadow:var(--shadow)}
.bgx-opdezepagina b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.bgx-opdezepagina a{display:block;padding:5px 0;color:var(--ink2);text-decoration:none;border-left:2px solid transparent;padding-left:10px}
.bgx-opdezepagina a:hover{color:var(--blue)}
.bgx-opdezepagina a.bgx-hier{color:var(--blue);border-left-color:var(--blue);font-weight:700}
@media(max-width:1100px){.bgx-opdezepagina{display:none}}

/* de mensen achter het werk */
.bgx-mensen{max-width:none!important;display:flex;gap:22px;align-items:center;margin:56px 0 0;padding:26px;
  background:var(--white);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
.bgx-mensen img{width:96px;height:96px;border-radius:50%;object-fit:cover;flex-shrink:0;margin:0}
.bgx-mensen .bgx-wie{font-weight:800;font-size:18px}
.bgx-mensen .bgx-wat{color:var(--muted);font-size:15px;margin:2px 0 8px}
.bgx-mensen p{margin:0;font-size:16px}
@media(max-width:600px){.bgx-mensen{flex-direction:column;text-align:center}}

.bgx-omhoog{position:fixed;right:18px;bottom:18px;z-index:70;width:46px;height:46px;border-radius:50%;border:1px solid var(--line);
  background:var(--white);color:var(--ink);font-size:20px;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .3s ease,transform .2s ease;
  box-shadow:var(--shadow)}
.bgx-omhoog.bgx-zichtbaar{opacity:1;pointer-events:auto}
.bgx-omhoog:hover{transform:translateY(-3px)}
.bgx-leesbalk{position:fixed;top:0;left:0;height:3px;width:0;background:var(--blue);z-index:100;transition:width .1s linear}
</style>`;

//__DEEL2__ (vervolg volgt)
