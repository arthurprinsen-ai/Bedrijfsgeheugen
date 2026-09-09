const STYLE_ID='v2-interaction-parity-style';
const CSS=`
.v2strategygrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:14px 0}.v2strategycard{background:#fff;border:1px solid #e3e9f5;border-radius:16px;padding:14px;box-shadow:0 8px 24px rgba(30,62,126,.05)}.v2strategycard.dragging,.v2strategycard.dragover{border-color:#1769ff;box-shadow:0 0 0 3px rgba(23,105,255,.12)}.v2strategycardhead{display:flex;align-items:center;gap:8px;margin-bottom:8px}.v2strategydrag,.v2overviewdrag{cursor:grab;color:#7180a0;font-weight:900}.v2strategycardhead small{font-weight:900;color:#182248;flex:1}.v2strategycard textarea{width:100%;min-height:96px;resize:vertical;border:1px solid #dfe6f2;border-radius:11px;padding:10px;font:inherit;color:#243153;box-sizing:border-box}.v2strategycard p{margin:7px 0 0;color:#7180a0;font-size:10px;line-height:1.4}.v2strategycontrols{display:flex;gap:6px}.v2strategycontrols button{min-width:44px;min-height:44px;border:1px solid #dce5f3;border-radius:10px;background:#f8faff;color:#1d4fa8;font-weight:900;cursor:pointer}.v2strategycontrols button:disabled{opacity:.35;cursor:default}
[data-overview-block]{position:relative}.v2overviewcontrols{position:absolute;top:8px;right:8px;z-index:6;display:flex;align-items:center;gap:6px;padding:5px 7px;border:1px solid #d8e2f1;border-radius:11px;background:rgba(248,250,255,.96);box-shadow:0 6px 18px rgba(30,62,126,.08);color:#607092}.v2overviewlabel{font-size:9px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}.v2overviewcontrols button{min-width:44px;min-height:44px;border:1px solid #dce5f3;border-radius:10px;background:#fff;color:#1d4fa8;font-weight:900;cursor:pointer}.v2overviewcontrols button:disabled{opacity:.35;cursor:default}[data-overview-block].dragging,[data-overview-block].dragover{outline:3px solid rgba(23,105,255,.18);outline-offset:4px;border-radius:16px}
@media(max-width:760px){.v2strategygrid{grid-template-columns:1fr}.v2strategydrag,.v2overviewdrag{display:none}.v2overviewlabel{display:none}.v2overviewcontrols{top:6px;right:6px;padding:4px;gap:4px}}
`;

export function ensureInteractionParityStyles(doc=globalThis.document){
  if(!doc?.head||doc.getElementById(STYLE_ID))return;
  const style=doc.createElement('style');style.id=STYLE_ID;style.textContent=CSS;doc.head.appendChild(style);
}

export { CSS as INTERACTION_PARITY_CSS };
