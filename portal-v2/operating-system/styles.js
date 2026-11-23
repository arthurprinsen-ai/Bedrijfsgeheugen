const CSS=`
.os-executive{margin:0 0 24px;padding:24px;border:1px solid rgba(15,23,42,.12);border-radius:20px;background:linear-gradient(180deg,#fff,#f8fafc);box-shadow:0 18px 45px rgba(15,23,42,.06)}
.os-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.os-head h2{margin:3px 0 6px;font-size:clamp(26px,4vw,40px);line-height:1.05}.os-head>span{font-size:12px;padding:7px 10px;border:1px solid rgba(15,23,42,.12);border-radius:999px;white-space:nowrap}.os-subtitle{margin:0;max-width:760px;opacity:.72}
.os-mobile-decision-flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:10px;margin:0 0 14px}.os-mobile-decision-flow article{border:1px solid rgba(15,23,42,.1);border-radius:14px;background:#fff;padding:14px;display:grid;gap:5px}.os-mobile-decision-flow small{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#115be8}.os-mobile-decision-flow strong{font-size:16px}.os-mobile-decision-flow span{font-size:13px;line-height:1.4;opacity:.72}.os-mobile-decision-flow article[data-steering-stage]{border-color:rgba(17,91,232,.22);background:rgba(17,91,232,.025)}.os-mobile-decision-flow button{justify-self:start;border:1px solid rgba(17,91,232,.2);background:#fff;color:#1647ae;border-radius:9px;padding:7px 9px;font:inherit;font-size:12px;cursor:pointer}.os-mobile-decision-flow button:focus-visible{outline:3px solid #115be8;outline-offset:2px}
.os-attention{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 16px}.os-attention-card,.os-attention-empty{border:1px solid rgba(15,23,42,.12);border-radius:16px;background:#fff;padding:16px;min-height:148px}.os-attention-card h3{margin:12px 0 7px;font-size:18px}.os-attention-card p{margin:0 0 10px;opacity:.76}.os-attention-card>small{opacity:.65}.os-attention-top{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.os-attention-empty{grid-column:1/-1;display:flex;flex-direction:column;justify-content:center;gap:5px;min-height:92px}
.os-problem-card{position:relative;overflow:hidden}.os-problem-card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:linear-gradient(90deg,#115be8,#7c3aed,#f59e0b)}.os-problem-context{margin:12px 0;padding:12px;border-radius:12px;background:rgba(17,91,232,.045);border:1px solid rgba(17,91,232,.12)}.os-context-chips,.os-problem-symptoms{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}.os-context-chips span,.os-problem-symptoms span{font-size:11px;font-weight:700;padding:4px 7px;border-radius:999px;background:#fff;border:1px solid rgba(15,23,42,.1)}.os-problem-symptoms span{font-weight:600;background:rgba(245,158,11,.08)}.os-signal-grid{display:grid;grid-template-columns:1fr;gap:6px}.os-signal-meter{display:grid;grid-template-columns:88px 1fr 28px;gap:7px;align-items:center;font-size:11px}.os-signal-meter i{height:6px;background:rgba(15,23,42,.08);border-radius:999px;overflow:hidden}.os-signal-meter i b{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#115be8,#7c3aed)}.os-signal-meter em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums}.os-context-note{margin:9px 0 0!important;font-size:12px;line-height:1.45}.os-context-strip{margin:0 0 12px;padding:14px;border:1px solid rgba(17,91,232,.14);border-radius:14px;background:linear-gradient(180deg,rgba(17,91,232,.04),rgba(124,58,237,.025))}.os-context-strip-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:10px}.os-context-strip-head small{max-width:620px;opacity:.68}.os-context-strip-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.os-context-strip-grid article{background:#fff;border:1px solid rgba(15,23,42,.09);border-radius:11px;padding:11px}.os-context-strip-grid article>div{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px}.os-context-strip-grid span,.os-context-strip-grid em{font-size:10px;font-style:normal;font-weight:900;letter-spacing:.04em}.os-context-strip-grid em{opacity:.6}.os-context-strip-grid strong{display:block;font-size:13px;line-height:1.3}.os-context-strip-grid small{display:block;margin-top:6px}.os-context-strip-grid p{font-size:12px;line-height:1.4;margin:6px 0 0;opacity:.72}
.os-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 16px}.os-metrics article,.os-card,.os-health,.os-page-card,.os-page-empty,.os-executive-scan>section{border:1px solid rgba(15,23,42,.1);border-radius:14px;background:#fff;padding:16px}.os-metrics small,.os-card small,.os-list small,.os-graph-list small,.os-executive-scan small{display:block;opacity:.7}.os-metrics b{display:block;margin-top:5px;font-size:25px}
.os-executive-scan{display:grid;grid-template-columns:1.25fr .75fr;gap:12px;margin-bottom:12px}.os-executive-scan h3{margin:0 0 10px}.os-executive-scan ol{margin:0;padding-left:20px}.os-executive-scan li{padding:7px 0}
.os-detail{border-top:1px solid rgba(15,23,42,.08);padding-top:12px}.os-detail summary{cursor:pointer;font-weight:800;padding:8px 0}.os-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px}.os-card h3,.os-health h3,.os-page-card h3{margin:0 0 10px}.os-card ol{margin:0;padding-left:20px}.os-card li{padding:7px 0}.os-evidence{margin-top:4px}.os-health{margin-top:12px}.os-health p,.os-muted,.os-empty,.os-page-empty p{margin:0;opacity:.72}.os-module-tabs,.os-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.os-module-tabs button,.os-actions button,.os-graph-list button{appearance:none;border:1px solid rgba(15,23,42,.16);background:#fff;border-radius:10px;padding:10px 12px;font:inherit;cursor:pointer;text-align:left}.os-module-tabs button[aria-pressed="true"]{font-weight:700;border-color:currentColor}.os-module-detail{margin-top:12px}.os-page-card+.os-page-card{margin-top:12px}.os-list{display:grid;gap:10px}.os-list article{border-top:1px solid rgba(15,23,42,.08);padding-top:10px}.os-list article:first-child{border-top:0;padding-top:0}.os-impact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.os-impact-grid article{padding:12px;border:1px solid rgba(15,23,42,.08);border-radius:12px}.os-impact-grid b{display:block;font-size:20px;margin:6px 0}.os-scenario-result pre{white-space:pre-wrap;overflow:auto;padding:12px;border-radius:10px;background:rgba(15,23,42,.05)}.os-graph-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.os-graph-list button{display:flex;flex-direction:column;gap:3px}.os-module-tabs button:focus-visible,.os-actions button:focus-visible,.os-graph-list button:focus-visible,.os-detail summary:focus-visible{outline:3px solid currentColor;outline-offset:2px}


/* Strategic consultant-quality decision framing, with no new data or decisions. */
.os-strategy-advisor{margin:0 0 18px;padding:20px;border-radius:18px;background:linear-gradient(128deg,#eef4ff,#fff);border:1px solid #c8d8f2;color:#17243b}
.os-strategy-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}
.os-strategy-head small{display:block;color:#1549a6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.065em}
.os-strategy-head h3{font-size:clamp(18px,2.6vw,26px);margin:5px 0 0;line-height:1.2}
.os-strategy-head p{max-width:350px;margin:0;color:#475569;font-size:13px;line-height:1.5}
.os-strategy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:12px}
.os-strategy-card,.os-strategy-empty{background:#fff;border:1px solid #dbe6f5;border-radius:15px;padding:16px;min-width:0;box-shadow:0 8px 20px #0f172a08}
.os-strategy-card-header{display:flex;justify-content:space-between;gap:12px;color:#1647ae;font-size:11px;font-weight:700}
.os-strategy-card h4{margin:10px 0;font-size:18px;line-height:1.3}
.os-strategy-card p{font-size:13px;line-height:1.55;margin:8px 0;color:#334155}
.os-strategy-impact{display:grid;gap:4px;background:#f3f7fc;border-radius:12px;padding:12px;margin:12px 0}
.os-strategy-impact>span{font-size:11px;color:#475569;font-weight:700}
.os-strategy-impact>strong{font-size:18px}
.os-strategy-impact>small{font-size:12px;color:#475569}
.os-strategy-card details{border-top:1px solid #e2e8f0;padding:9px 0}
.os-strategy-card details summary{cursor:pointer;font-size:13px;color:#1647ae;font-weight:800}
.os-strategy-card details ul{margin:8px 0;padding-left:20px}.os-strategy-card details li{margin-bottom:8px;font-size:13px}
.os-strategy-card details li span{display:block;color:#475569}
.os-strategy-card .os-strategy-status{font-size:12px;color:#475569}
.os-strategy-card button,.os-strategy-empty button{border:1px solid #1647ae;border-radius:10px;background:#1647ae;color:#fff;padding:10px 12px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;min-height:44px;margin-top:10px}
.os-strategy-card button:focus-visible,.os-strategy-empty button:focus-visible,.os-strategy-card summary:focus-visible{outline:3px solid #115be8;outline-offset:3px}
.os-strategy-empty{display:grid;gap:8px}.os-strategy-empty p{margin:0;font-size:13px}.os-strategy-empty button{justify-self:start}
@media(max-width:700px){.os-strategy-advisor{padding:14px}.os-strategy-head{display:block}.os-strategy-head p{margin-top:8px}.os-strategy-grid{grid-template-columns:1fr}}

/* Entrepreneur result feedback: consistent progressive disclosure on mobile/desktop. */
.os-outcome-feedback{margin:16px 0;padding:20px;border:1px solid rgba(17,91,232,.24);border-radius:18px;background:linear-gradient(145deg,#f0f6ff,#fff);color:#0f172a}
.os-outcome-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px}
.os-outcome-intro small{display:block;color:#1647ae;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.os-outcome-intro h3{margin:4px 0;font-size:clamp(18px,2.5vw,24px)}
.os-outcome-intro p{max-width:340px;margin:0;font-size:13px;line-height:1.5;color:#334155}
.os-outcome-empty{margin:0;padding:12px 14px;border:1px dashed #94a3b8;border-radius:12px;background:#fff;font-size:14px}
.os-outcome-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:12px}
.os-outcome-card{padding:16px;border:1px solid #dbe4f0;border-radius:14px;background:#fff;min-width:0}
.os-outcome-card[data-outcome-verified="true"]{border-color:#73a899}
.os-outcome-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.os-outcome-card-head small{font-size:11px;color:#475569}
.os-outcome-card-head h4{font-size:16px;line-height:1.35;margin:4px 0 0}
.os-outcome-card-head>span{font-size:11px;font-weight:700;line-height:1.35;border-radius:8px;padding:6px 8px;background:#eff6ff;color:#1647ae;max-width:130px}
.os-outcome-card[data-outcome-verified="true"] .os-outcome-card-head>span{background:#e8f6ed;color:#14532d}
.os-outcome-action{margin:8px 0 0;color:#475569;font-size:12px;overflow-wrap:anywhere}
.os-outcome-compare{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:14px 0}
.os-outcome-compare>div{padding:10px;border-radius:10px;background:#f8fafc;min-width:0}
.os-outcome-compare dt{font-size:11px;color:#475569}
.os-outcome-compare dd{margin:6px 0 0;font-size:15px;font-weight:800;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.os-outcome-next{margin:0 0 12px;font-size:13px;line-height:1.5;color:#334155}
.os-outcome-card details{border-top:1px solid #e2e8f0;padding-top:10px;font-size:12px}
.os-outcome-card summary{cursor:pointer;font-weight:800;padding:5px 0;color:#1647ae}
.os-outcome-card summary:focus-visible{outline:3px solid #115be8;outline-offset:3px}
.os-outcome-card details p{overflow-wrap:anywhere;line-height:1.5}
.os-outcome-more{display:block;width:100%;margin-top:12px;border:1px solid #1647ae;background:#fff;color:#1647ae;border-radius:10px;padding:10px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:center}.os-outcome-more:focus-visible{outline:3px solid #115be8;outline-offset:3px}

@media(max-width:700px){.os-outcome-intro{display:block}.os-outcome-intro p{margin-top:7px}.os-outcome-feedback{padding:14px}.os-outcome-compare{grid-template-columns:1fr}.os-outcome-card-head{display:block}.os-outcome-card-head>span{display:inline-block;margin-top:8px;max-width:none}}

@media(max-width:900px){.os-attention{grid-template-columns:1fr}.os-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.os-impact-grid{grid-template-columns:1fr 1fr}.os-executive-scan{grid-template-columns:1fr}.os-context-strip-grid{grid-template-columns:1fr}}
@media(max-width:640px){
 .os-executive{padding:16px;border-radius:14px;margin-bottom:14px}
 .os-head{display:block;margin-bottom:14px}
 .os-head h2{font-size:28px;line-height:1.02}
 .os-head>span{display:inline-block;margin-top:10px}
 .os-mobile-decision-flow{grid-template-columns:1fr}
 .os-attention{display:none}
 .os-metrics{grid-template-columns:1fr 1fr}
 .os-metrics article{padding:12px}
 .os-metrics b{font-size:21px}
 .os-grid,.os-impact-grid,.os-graph-list{grid-template-columns:1fr}
 .os-executive-scan{grid-template-columns:1fr}
 .os-module-tabs button{flex:1 1 46%}
 .os-context-strip-head{display:block}.os-context-strip-head small{display:block;margin-top:4px}.os-signal-meter{grid-template-columns:76px 1fr 26px}
}
.os-cms-workstream{margin:14px 0;padding:18px;border:1px solid #cbd5e1;border-radius:14px;background:linear-gradient(120deg,#f4f8ff,#fff)}.os-cms-workstream h3{font-size:18px;line-height:1.25;margin:0 0 8px}.os-cms-workstream p{margin:0 0 10px;font-size:14px;line-height:1.5}.os-cms-workstream a{display:inline-block;font-weight:800;color:#214bd4;text-decoration:underline;margin-bottom:7px}.os-cms-workstream small{display:block;color:#64748b;font-size:12px}
`;

export function ensureOperatingSystemStyles(doc=document){
 if(!doc?.head||doc.getElementById('bg-os-styles'))return;
 const style=doc.createElement('style');style.id='bg-os-styles';style.textContent=CSS;doc.head.appendChild(style);
}