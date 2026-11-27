import base64,io,segno,os
SC='/tmp/claude-0/-home-claude/01f1c6f3-5845-5e83-93d0-35c9370a3026/scratchpad/'
FD='../fonts/node_modules/@fontsource/'
def IMG(p):return 'data:image/jpeg;base64,'+base64.b64encode(open(p,'rb').read()).decode()
TRIAL="https://www.bedrijfsgeheugen.nl/afsluiten?plan=starter&trial=1&code=KLOOF-Q4"
PORTAL="https://www.bedrijfsgeheugen.nl/frisse-blik?utm_source=magazine&utm_medium=pdf&utm_campaign=de-kloof-no04"
def qr(u,dark):
    b=io.BytesIO();segno.make(u,error='m').save(b,kind='svg',scale=4,border=0,dark=dark,light=None,omitsize=True,xmldecl=False);return b.getvalue().decode()
CSS="""
@font-face{font-family:Ser;font-style:normal;src:url(@F@instrument-serif/files/instrument-serif-latin-400-normal.woff2)}
@font-face{font-family:Ser;font-style:italic;src:url(@F@instrument-serif/files/instrument-serif-latin-400-italic.woff2)}
@font-face{font-family:Inst;font-weight:400;src:url(@F@instrument-sans/files/instrument-sans-latin-400-normal.woff2)}
@font-face{font-family:Inst;font-weight:600;src:url(@F@instrument-sans/files/instrument-sans-latin-600-normal.woff2)}
@font-face{font-family:Inst;font-weight:700;src:url(@F@instrument-sans/files/instrument-sans-latin-700-normal.woff2)}
@page{size:210mm 297mm;margin:0}
:root{--ink:#0a1630;--cr:#f6f0e3;--gd:#e8c46e;--gt:#9a7418;--mut:#5b6478;--ln:rgba(10,22,48,.18)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inst,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.5}
.p{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:var(--cr);padding:20mm 17mm 16mm}
.dk{background:var(--ink);color:#f4ecdc}
.hd{position:absolute;left:17mm;right:17mm;top:10mm;display:flex;justify-content:space-between;font-size:6.5pt;letter-spacing:.3em;text-transform:uppercase;color:var(--gt)}
.dk .hd{color:var(--gd)}
.k{font-size:7pt;letter-spacing:.3em;text-transform:uppercase;color:var(--gt);font-weight:600;margin-bottom:3mm}
.dk .k{color:var(--gd)}
h1{font-family:Ser;font-weight:400;font-size:40pt;line-height:1.02;margin-bottom:4mm}
h1 i,h2 i{color:var(--gt)}
.dk h1 i,.dk h2 i{color:var(--gd)}
h2{font-family:Ser;font-weight:400;font-size:25pt;line-height:1.05;margin-bottom:3mm}
h3{font-size:7pt;letter-spacing:.24em;text-transform:uppercase;color:var(--gt);font-weight:700;margin-bottom:1.5mm}
.dk h3{color:var(--gd)}
p{margin-bottom:3mm;font-size:10.5pt}
.big{font-family:Ser;font-size:84pt;line-height:.9;color:var(--gt);letter-spacing:-.01em}
.bigrow{display:flex;gap:7mm;align-items:flex-end;border-top:.3mm solid var(--ink);padding-top:4mm;margin-top:2mm}
.cap{font-size:12pt;line-height:1.4;max-width:92mm;padding-bottom:1.5mm}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:7mm}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm}
.bar{margin-bottom:2.1mm}.bar .l{display:flex;justify-content:space-between;font-size:9.8pt;margin-bottom:.8mm}
.bar .t{height:4.2mm;background:rgba(10,22,48,.08)}.bar .f{height:100%;background:var(--ink)}.bar.h .f{background:var(--gt)}
.ch{margin:3.5mm 0 3mm;padding:3.8mm 5mm;border:.3mm solid var(--ln);background:rgba(255,255,255,.45)}
.ch .ct{font-size:6.8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);margin-bottom:2.5mm;font-weight:600}
.mon{background:var(--ink);color:#f4ecdc;padding:4.5mm 6mm;margin:3mm 0}
.mon h3{color:var(--gd)}
.st{display:flex;gap:3mm;margin-bottom:2.2mm;align-items:flex-start;font-size:10.6pt;line-height:1.38}
.st .n{font-family:Ser;font-size:15pt;color:var(--gd);line-height:1;flex:none;width:5mm}
.cbx{display:inline-block;width:4.2mm;height:4.2mm;border:.3mm solid var(--gd);flex:none;margin-top:.4mm}
.lab{display:inline-block;font-size:6.5pt;letter-spacing:.16em;text-transform:uppercase;font-weight:700;padding:.7mm 2.2mm;border:.3mm solid var(--ink);margin-right:2mm}
.ft{position:absolute;left:17mm;right:17mm;bottom:9mm;font-size:7.4pt;line-height:1.35;color:var(--mut);border-top:.2mm solid var(--ln);padding-top:2mm}
.fld{display:inline-block;height:6.2mm;border-bottom:.3mm solid var(--ink);vertical-align:bottom;background:rgba(232,196,110,.18)}
.fb{display:block;width:100%;height:12mm;border:.3mm solid var(--ln);background:rgba(255,255,255,.6);margin-bottom:2mm}
.mv{display:grid;grid-template-columns:22mm 1fr;gap:5mm;border-top:.3mm solid var(--ink);padding:3mm 0}
.mv .m{font-family:Ser;font-size:28pt;line-height:.95;color:var(--gt)}
.mv .m small{display:block;font-family:Inst;font-size:6.5pt;letter-spacing:.2em;text-transform:uppercase;color:var(--mut)}
.tl{display:flex;margin:3mm 0}.tl div{flex:1;padding-right:2.5mm;border-top:.6mm solid var(--gt);padding-top:2mm;font-size:8.6pt;line-height:1.3}.tl b{display:block;font-family:Ser;font-weight:400;font-size:13pt;color:var(--ink)}
table{border-collapse:collapse;width:100%;font-size:7.2pt;line-height:1.3}td,th{border-bottom:.2mm solid var(--ln);padding:.9mm 1.5mm;text-align:left;vertical-align:top}th{font-size:6.3pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.mini{font-size:10pt;line-height:1.5}
@font-face{font-family:Hand;font-weight:500;src:url(@F@caveat/files/caveat-latin-500-normal.woff2)}
.p:not(.dk){background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .15  0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.note{font-family:Hand;font-weight:500;font-size:15pt;line-height:1.05;color:#7a5a0c;transform:rotate(-1.6deg);border-left:.6mm solid var(--gd);padding:1mm 0 1mm 4mm;margin:3mm 0 1mm;max-width:130mm}
.note b{font-weight:500;text-decoration:underline;text-decoration-color:var(--gd);text-decoration-thickness:.7mm;text-underline-offset:1mm}
.alt .bigrow{flex-direction:row-reverse;text-align:right;justify-content:space-between}
.alt .cap{max-width:100mm}
.card{border:.3mm solid var(--ln);padding:4mm 5mm;background:rgba(255,255,255,.5)}
.card h4{font-family:Ser;font-weight:400;font-size:15pt;line-height:1.08;margin-bottom:1.5mm}
.card .n{font-family:Ser;font-size:30pt;line-height:1;color:var(--gt)}
.card p{font-size:9.2pt;line-height:1.42;margin-bottom:1.5mm}
.tg{font-size:6.2pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);font-weight:700}
.l8{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.l8 .card{padding:3.5mm 4.5mm}
.l8 .card h4{font-size:14pt}.l8 .card p{font-size:8.5pt;line-height:1.36}

.q{font-family:Ser;font-style:italic;font-size:15pt;line-height:1.25;border-left:.8mm solid var(--gd);padding-left:5mm;margin:4mm 0}
""".replace("@F@",FD)
pages=[];N=[0]
def pg(body,cls='',hd=True):
    N[0]+=1
    h=f"<div class='hd'><span>De Kloof &middot; No. 04</span><span>{N[0]:02d}</span></div>" if hd else ''
    pages.append(f"<div class='p {cls}'>{h}{body}</div>")
def bar(l,v,mx=None,h=False,u='%',dec=1):
    mx=mx or 100;s=f"{v:.{dec}f}".replace('.',',')
    return f"<div class='bar{' h' if h else ''}'><div class='l'><span>{l}</span><b>{s}{u}</b></div><div class='t'><div class='f' style='width:{min(100,v/mx*100):.1f}%'></div></div></div>"
def chart(t,rows,mx=None,note='',u='%',dec=1):
    return f"<div class='ch'><div class='ct'>{t}</div>{''.join(bar(*r[:2],mx=mx,h=(len(r)>2 and r[2]),u=u,dec=dec) for r in rows)}{('<div class=mini style=color:var(--mut);margin-top:1mm>'+note+'</div>') if note else ''}</div>"
BN=[0]
BK={1:('Type 2','Decide with what you know: note your team size and pick your comparison group.'),
2:('Type 2','Reversible. Rule: start with a task that takes more than two hours a week.'),
3:('Type 2','After 30 days, evaluate which barrier you removed first.'),
4:('Type 2','One team rule in one sentence; review date: your next ritual.'),
5:('Type 1','Hard to reverse. Get a second opinion (lawyer or trade association) before you decide.'),
6:('Type 2','Do not wait for more information: switch on two-factor authentication now.'),
7:('Type 2','Assumption to write down: customers accept an AI draft that you check.'),
8:('Type 1','Pre-mortem: what if the price doubles? Do not lock into a provider for three years.'),
9:('Type 2','One number, one review date in ninety days.')}
NOTES={1:'Our first reaction: this gap is <b>smaller than it feels</b>. It is not technology, it is a beginning.',2:'Boring is good. Whoever starts with work nobody would miss <b>loses nothing</b>.',3:'Note: knowledge is at the top, money far below. That is <b>good news</b>.',4:'Your team is far ahead of you. <b>Stand beside them</b>, not in front.',5:'Delay is not a free pass. The rules on <b>training people</b> already apply.',6:'This is not an IT problem. It is a <b>habit problem</b>.',7:'People want a human, but not <b>waiting</b>. That is your chance.',8:'Price is not the question. <b>Usage</b> is the question.',9:'Measure what you hope to see <b>at the end of the week</b>, not what sounds nice.'}
def block(mv,title,big,cap,charts,means,risk,steps,tool,label,src,foot):
    BN[0]+=1
    nt=NOTES.get(BN[0],'')
    nt=f"<div class='note'>{nt}</div>" if nt else ''
    st=''.join(f"<div class='st'><span class='cbx' data-f='b{BN[0]}s{i+1}'></span><span>{s}</span></div>" for i,s in enumerate(steps))
    pg(f"""<div class='k'>Building block {BN[0]:02d} &middot; Move {mv}</div><h2>{title}</h2>
<div class='bigrow'><div class='big'>{big}</div><div class='cap'>{cap}</div></div>{charts}
<div class='g2'><div><h3>What it means</h3><p class='mini'>{means}</p></div><div><h3>Risk</h3><p class='mini'>{risk}</p></div></div>
<div class='mini' style='margin-top:2mm;border-top:.25mm solid var(--ln);padding-top:1.5mm'><span class='lab'>Decision card &middot; {BK[BN[0]][0]}</span>{BK[BN[0]][1]}</div>
{nt}<div class='mon'><h3>Do this Monday</h3>{st}<div class='mini' style='color:#cfc7b2;margin-top:2mm'><b style='color:var(--gd)'>Tool:</b> {tool}</div></div>
<div class='ft'><span class='lab'>{label}</span>{foot}<br>Source: {src}</div>""",'alt' if BN[0]%2==0 else '')

# ---- 1 cover
cv=IMG(SC+'mag/cover_a.jpg')
pg(f"""<img src='{cv}' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 55%'>
<div style='position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,12,30,.88) 0%,rgba(6,12,30,.35) 22%,rgba(6,12,30,0) 40%,rgba(6,12,30,.15) 60%,rgba(6,12,30,.92) 100%)'></div>
<div style='position:absolute;inset:10mm;border:.25mm solid rgba(232,196,110,.55)'></div>
<div style='position:absolute;left:18mm;right:18mm;top:17mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.32em;text-transform:uppercase;color:#e8c46e'><span>Quarterly magazine</span><span>No. 04 &middot; Winter 2026</span></div>
<div style='position:absolute;left:0;right:0;top:27mm;text-align:center;font-family:Ser;font-size:112pt;line-height:1;letter-spacing:.02em;color:#f7efdc'>De <i style='color:#e8c46e'>Kloof</i></div>
<div style='position:absolute;left:0;right:0;top:75mm;text-align:center;font-size:7.5pt;letter-spacing:.42em;text-transform:uppercase;opacity:.9'>For entrepreneurs who don&rsquo;t wait</div>
<div style='position:absolute;right:18mm;width:56mm;top:112mm;text-align:right;font-size:8.5pt;line-height:1.45;text-shadow:0 0 6px rgba(6,12,30,.9)'><div style='font-size:6.5pt;letter-spacing:.25em;text-transform:uppercase;color:#e8c46e;margin-bottom:1.5mm'>The number</div><div style='font-family:Ser;font-size:30pt;line-height:1;color:#e8c46e;margin-bottom:2mm'>13,8%</div>of micro businesses (2–10 employees) use AI. Large companies: 66.2%. <i>This gap is your head start.</i></div>
<div style='position:absolute;right:18mm;width:58mm;text-align:right;font-size:8.5pt;line-height:1.45;top:158mm;text-shadow:0 0 6px rgba(6,12,30,.9)'><div style='font-size:6.5pt;letter-spacing:.25em;text-transform:uppercase;color:#e8c46e;margin-bottom:1.5mm'>Exclusive</div><div style='font-family:Ser;font-size:20pt;line-height:1.05;color:#f7efdc;margin-bottom:2mm'>The Quarterly Ritual</div>90 minutes. Five moves. Your business, weighed against the evidence.</div>
<div style='position:absolute;left:18mm;top:96mm;width:26mm;height:26mm;border-radius:50%;background:#e8c46e;color:#0a1630;display:flex;align-items:center;justify-content:center;text-align:center;font-size:6pt;letter-spacing:.14em;text-transform:uppercase;font-weight:600;line-height:1.35;transform:rotate(8deg)'>Free<br>introduction<br>No. 04</div>
<div style='position:absolute;left:18mm;right:18mm;bottom:20mm'><div style='font-family:Ser;font-size:44pt;line-height:1;color:#f7efdc;max-width:150mm'>What everyone wants,<br>but almost nobody <i style='color:#e8c46e'>dares.</i></div>
<div style='display:flex;justify-content:space-between;align-items:flex-end;margin-top:6mm;padding-top:4mm;border-top:.25mm solid rgba(232,196,110,.55);font-size:7pt;letter-spacing:.2em;text-transform:uppercase'><span style='color:#e8c46e'>Personal copy &middot; For: <span class='fld' data-f='naam' style='width:52mm;background:rgba(232,196,110,.25);border-color:#e8c46e'></span></span><span>bedrijfsgeheugen.nl</span></div></div>
<div style='position:absolute;right:18mm;bottom:12.5mm;font-size:5pt;letter-spacing:.14em;text-transform:uppercase;opacity:.6'>Image: AI-generated</div>""",'dk',hd=False)

# ---- 2 welkom
pg(f"""<div class='k'>Welcome</div><h1>An appointment with <i>yourself.</i></h1>
<p style='font-size:11.5pt;line-height:1.5;max-width:150mm'>Almost every entrepreneur wants to know what AI can do for their business. Almost nobody has a quiet moment for it. That is why this magazine is not a report. It is a ritual: ninety minutes per quarter, with coffee, a pen and honest numbers.</p>
<div class='q'>The gap is not technology. The gap is time, knowledge and a first small step.</div>
<p style='max-width:150mm'>We laid public data from Europe, the Netherlands and the world side by side: Eurostat, Statistics Netherlands (CBS), UWV, Stanford, McKinsey, Verizon and the AI Act. Every number has a source, an evidence level and a label. Then we calculated the relationships ourselves and distilled them into nine building blocks that you can read without prior knowledge and use the same week.</p>
<div class='card' style='margin-top:5mm'><div class='tg'>Not for everyone</div><p style='margin:0'>This magazine is free, but it is written for entrepreneurs who really set aside a morning for it. A new edition every quarter, with our own analysis of European and Dutch data. One entrepreneur, one copy, ninety minutes.</p></div>
<h3 style='margin-top:6mm'>How to read a building block</h3>
<div class='g3' style='margin-top:2mm'>
<div class='ch' style='margin:0'><div class='ct'>1 &middot; The number</div><p class='mini'>One figure, with source and year.</p></div>
<div class='ch' style='margin:0'><div class='ct'>2 &middot; What it means</div><p class='mini'>In plain language, plus the risk you need to know.</p></div>
<div class='ch' style='margin:0'><div class='ct'>3 &middot; Do this Monday</div><p class='mini'>Three steps you can tick off. Tool included.</p></div></div>
<h3 style='margin-top:6mm'>Three labels</h3>
<p class='mini'><span class='lab'>Fact</span>Measured, with source. <span class='lab'>Link</span>Measured, but not proven for your type of business. <span class='lab'>Our view</span>Our conclusion. Read the difference.</p>
<div style='position:absolute;left:17mm;right:17mm;bottom:20mm;font-size:8.5pt;color:var(--mut)'>Arthur &middot; Bedrijfsgeheugen &middot; 18 November 2026<br>Your company name: <span class='fld' data-f='bedrijf' style='width:80mm'></span></div>""")
# ---- 3 ritueel + inhoud
pg(f"""<div class='k'>The Quarterly Ritual</div><h1>Ninety minutes. <i>Five moves.</i></h1>
<p style='max-width:150mm'>Plan one morning per quarter. Phone away, door closed. Work through the five moves in this order. Each move has building blocks in this magazine and a place on the worksheet on page 17.</p>
<div class='mv'><div class='m'>I<small>10 min</small></div><div><b>Look</b> &middot; Where do you stand in the gap?<br><span class='mini'>Building block 01 &middot; page 8</span></div></div>
<div class='mv'><div class='m'>II<small>15 min</small></div><div><b>Choose</b> &middot; One task, one barrier.<br><span class='mini'>Building blocks 02 and 03 &middot; pages 9 and 10</span></div></div>
<div class='mv'><div class='m'>III<small>25 min</small></div><div><b>Set rules</b> &middot; Team, law and security.<br><span class='mini'>Building blocks 04, 05 and 06 &middot; pages 11 to 13</span></div></div>
<div class='mv'><div class='m'>IV<small>30 min</small></div><div><b>Build</b> &middot; Build an AI first, instead of yet another Excel sheet.<br><span class='mini'>Building blocks 07 and 08 &middot; pages 14 and 15</span></div></div>
<div class='mv'><div class='m'>V<small>10 min</small></div><div><b>Measure</b> &middot; One number, back in 90 days.<br><span class='mini'>Building block 09 &middot; page 16</span></div></div>
<div class='card' style='margin-top:6mm'><div class='tg'>Make it a moment &middot; For yourself</div><h4>This hour is yours.</h4>
<p>An entrepreneur who plans their quarter does something nobody else will do for them. Treat it as an appointment with your best client.</p>
<div class='g2' style='gap:4mm;margin-top:2mm'><div><p class='mini'><b>Place.</b> Pick a place where you rarely work: a café, the garden, the sofa.<br><b>Drink.</b> Coffee, tea, whatever you like.<br><b>Silence.</b> Phone in airplane mode, email closed.</p></div>
<div><p class='mini'><b>Pen.</b> Write by hand; it slows you down and forces choices.<br><b>Ending.</b> Close with one sentence: what I will do differently this quarter.<br><b>Reward.</b> Plan something pleasant afterwards.</p></div></div>
<div class='g2' style='gap:4mm;margin-top:3mm'><div><p class='mini' style='margin:0'>My ritual date</p><span class='fb' data-f='r_datum' style='height:8mm'></span></div><div><p class='mini' style='margin:0'>My place</p><span class='fb' data-f='r_plek' style='height:8mm'></span></div></div></div>
<div class='mv' style='border-bottom:.3mm solid var(--ink)'><div class='m'>&#8734;<small>before</small></div><div class='mini'>Worksheet page 17, your plan page 18, sources page 19, decision card pages 23 and 24, your moment page 25. On the last page you will find a free month of help with the ritual.</div></div>""")
# ---- 4 kloof in een blik
pg(f"""<div class='k'>The gap at a glance</div><h1 style='font-size:34pt'>The Netherlands leads. <i>Small business doesn&rsquo;t.</i></h1>
<p style='max-width:150mm'>One in five European companies with 10 or more employees uses AI. The Netherlands ranks sixth. The smaller the company, the wider the gap.</p>
<div class='g2'><div>{chart('Europe, 2025 &middot; companies 10+ &middot; % using AI',[('Denmark',42.0),('Finland',37.8),('Sweden',35.0),('Belgium',34.5),('Luxembourg',33.6),('Netherlands',33.2,True),('EU average',20.0,True),('Romania',5.2)],mx=45)}</div>
<div>{chart('EU by size, 2025 &middot; % using AI',[('Small (10–49)',17.0),('Medium (50–249)',30.4),('Large (250+)',55.0,True)],mx=60)}
{chart('EU over time &middot; % using AI',[('2023',8.1),('2024',13.5),('2025',20.0,True)],mx=45)}</div></div>
<div class='ch'><div class='ct'>Netherlands (CBS), 2025 &middot; % using AI, different scope: 2+ employees</div>{bar('Micro businesses (2–10)',13.8,mx=70)}{bar('SMEs (10–250)',29.8,mx=70)}{bar('Large companies',66.2,mx=70,h=True)}</div>
<div class='g2'><div><h3>Note</h3><p class='mini'>Eurostat measures companies with 10+ employees, CBS also micro businesses. Not directly comparable.</p></div><div><h3>Our view</h3><p class='mini'>The fastest growth is in text and administration. Whoever starts now is not behind, but ahead in their own street.</p></div></div>
<div class='ft'><span class='lab'>Fact</span>Eurostat KS-01-26-009 (2026), Eurostat news 11-12-2025, CBS via ICTMagazine 16-3-2026.</div>""")

# ---- analyse 1: afhankelijkhedenkaart
def lab(x,y,t,col='#0a1630'):
    w=len(t)*1.55+3
    return f'<rect x="{x-w/2}" y="{y-2.6}" width="{w}" height="4.6" fill="#f6f0e3"/><text x="{x}" y="{y+.7}" font-size="2.9" font-family="Inst" fill="{col}" text-anchor="middle">{t}</text>'
def edge(x1,y1,x2,y2,w,dash=False,col='#0a1630'):
    d=' stroke-dasharray="2.4 1.8"' if dash else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="{w}"{d} stroke-linecap="round"/>'
def node(x,y,w,t,hi=False):
    f='#0a1630' if hi else '#f6f0e3';c='#f4ecdc' if hi else '#0a1630'
    return f'<rect x="{x-w/2}" y="{y-5}" width="{w}" height="10" rx="1" fill="{f}" stroke="#0a1630" stroke-width=".35"/><text x="{x}" y="{y+1.1}" font-size="3" font-family="Inst" font-weight="600" fill="{c}" text-anchor="middle">{t}</text>'
G='#9a7418'
svg=f'''<svg viewBox="0 0 176 96" width="170mm" xmlns="http://www.w3.org/2000/svg">
{edge(53,14,71,42,2.6,False,G)}{edge(53,46,71,46,1.5,False,G)}{edge(53,78,71,50,.5,True)}
{edge(123,14,105,42,1.8,False,G)}{edge(123,46,105,46,.5,True)}{edge(123,78,105,50,.5,True)}
{lab(60,24,'ρ 0,997')}{lab(62,41.5,'ρ 0,89')}{lab(60,67,'ρ 0,36 (n.s.)')}
{lab(116,24,'ρ 0,89')}{lab(114,41.5,'|ρ| ≤ 0,32 (n.s.)')}{lab(116,67,'ρ 0,18 (n.s.)')}
{node(88,46,32,'AI per country',True)}
{node(28,14,50,'AI at small companies')}{node(28,46,50,'AI at large companies')}{node(28,78,50,'Large, given small')}
{node(148,14,50,'Small/large ratio')}{node(148,46,50,'Mix of purposes')}{node(148,78,50,'Private use of gen-AI')}
<text x="88" y="93" font-size="2.7" font-family="Inst" fill="#5b6478" text-anchor="middle">Thick line: strong and significant. Dashed line: not demonstrable (n.s.). 27 EU countries, Eurostat 2025; private use n=15.</text></svg>'''
pg(f"""<div class='k'>Own analysis &middot; Bedrijfsgeheugen</div><h1 style='font-size:34pt'>What goes with <i>what?</i></h1>
<p style='max-width:155mm'>Most reports count and rank. We tested the Eurostat figures of 27 countries and the CBS figures of 12 sectors for dependencies, with confidence intervals. This is what held up, and what didn&rsquo;t.</p>
<div class='ch' style='padding:3mm 3mm 1mm'>{svg}</div>
<div class='l8'>
<div class='card'><div class='tg'>Finding 1 &middot; Our view</div><h4>It starts with the smallest.</h4><p>Countries with a lot of AI are countries where <b>small</b> companies take part: 28.9% against 8.1% in the bottom nine (3.6 times). For large companies the difference is 1.8 times. Note: this is partly arithmetic, because small companies weigh heavily in the total.</p></div>
<div class='card'><div class='tg'>Finding 2 &middot; Fact</div><h4>Leaders close the ranks.</h4><p>In the top nine, small companies reach on average 43% of the level of large companies. In the bottom nine it is 22% (ρ = 0.89, interval 0.74 to 0.95). This is not arithmetic.</p></div>
<div class='card'><div class='tg'>Finding 3 &middot; Fact</div><h4>What you do doesn&rsquo;t count. <i>That</i> you start does.</h4><p>The mix of purposes (administration, marketing, production) is unrelated to the level in every test (all p &gt; 0.1).</p></div>
<div class='card'><div class='tg'>Finding 4 &middot; Fact</div><h4>No catching up.</h4><p>Laggards do not grow faster in relative terms (ρ = −0.12, p = 0.56). So the gap in percentage points widens: 14.4 to 19.0 for the same countries.</p></div></div>
<div class='ft'><span class='lab'>Own analysis</span>Spearman rank correlation with bootstrap (5,000 draws). Correlation is not causation. Source: Eurostat KS-01-26-009; own calculation, see page 6.</div>""")
# ---- analyse 2: bewijs
import sqlite3 as _sq
_c=_sq.connect(SC+'groot/ai_mkb.db')
def _r(n):
    r=_c.execute("select value,ci_low,ci_high,n,note from analysis_results where name like ? order by id desc limit 1",(n+'%',)).fetchone();return r
def _row(lbl,n,read,p=None):
    v,lo,hi,nn,note=_r(n)
    ci=f"{lo:.2f} to {hi:.2f}".replace('.',',') if lo is not None else '—'
    return f"<tr><td>{lbl}</td><td>{nn}</td><td><b>{v:.2f}</b></td><td>{ci}</td><td>{p or ''}</td><td>{read}</td></tr>".replace('.',',') if False else f"<tr><td>{lbl}</td><td>{nn}</td><td><b>{(('%.3f' if abs(v)>0.99 else '%.2f')%v).replace('.',',')}</b></td><td>{ci}</td><td>{p or ''}</td><td>{read}</td></tr>"

def forest():
    items=[('Total ~ small','totaal vs small'),('Total ~ large','totaal vs large'),('Large, given small','partieel T~groot | klein'),('Small/large ratio','totaal vs ratio klein/groot'),('Share marketing','totaal vs aandeel marketing/verkoop'),('Share administration','totaal vs aandeel administratie/management'),('Growth pp ~ level','groei 2024-25 (pp) vs niveau 2024'),('Relative growth ~ level','relatieve groei vs niveau 2024'),('Private use of gen-AI','bedrijfsadoptie vs individueel'),('Sector: growth ~ level','sector: groei 2023-25 (pp) vs niveau 2023')]
    x0,x1=-0.7,1.0;X=lambda v:58+(v-x0)/(x1-x0)*112
    o=f'<svg viewBox="0 0 176 {len(items)*6.4+12}" width="170mm" xmlns="http://www.w3.org/2000/svg"><line x1="{X(0)}" y1="3" x2="{X(0)}" y2="{len(items)*6.4+4}" stroke="#0a1630" stroke-width=".3" stroke-dasharray="1.5 1.2"/>'
    for k,(l,n) in enumerate(items):
        v,lo,hi,nn,_=_r(n[:40]) if False else _c.execute("select value,ci_low,ci_high,n,note from analysis_results where name like ? order by id desc limit 1",(n+'%',)).fetchone()
        y=8+k*6.4;col='#9a7418' if (lo>0 or hi<0) else '#8a91a3'
        o+=f'<text x="2" y="{y+1}" font-size="3" font-family="Inst" fill="#0a1630">{l}</text><line x1="{X(lo)}" y1="{y}" x2="{X(hi)}" y2="{y}" stroke="{col}" stroke-width="1.1" stroke-linecap="round"/><circle cx="{X(v)}" cy="{y}" r="1.4" fill="{col}"/>'
    for t in (-0.5,0,0.5,1.0):
        o+=f'<text x="{X(t)}" y="{len(items)*6.4+10}" font-size="2.8" font-family="Inst" fill="#5b6478" text-anchor="middle">{str(t).replace(".",",")}</text>'
    return o+'</svg>'

rows=''.join([
_row('Total ~ small (countries)','totaal vs small','Strong; partly arithmetic','&lt; 0,001'),
_row('Total ~ large (countries)','totaal vs large','Strong, but weaker than small','&lt; 0,001'),
_row('Total ~ large, given small','partieel T~groot | klein (Spearman)','Interval includes 0: no independent role shown','n.s.'),
_row('Total ~ small/large ratio','totaal vs ratio klein/groot','Strong, not arithmetic','&lt; 0,001'),
_row('Total ~ share marketing','totaal vs aandeel marketing/verkoop','No relationship','0,49'),
_row('Total ~ share administration','totaal vs aandeel administratie/management','No relationship','0,44'),
_row('Growth (pp) ~ level 2024','groei 2024-25 (pp) vs niveau 2024','High starters gain more pp','0,0005'),
_row('Relative growth ~ level 2024','relatieve groei vs niveau 2024','No catching up','0,56'),
_row('Companies ~ private use gen-AI','bedrijfsadoptie vs individueel gen-AI-gebruik','No relationship (small n)','0,52'),
_row('Sectors: level 2025 ~ 2023','sector: niveau 2025 vs niveau 2023','Ranking stays the same','0,0002'),
_row('Sectors: growth ~ level 2023','sector: groei 2023-25 (pp) vs niveau 2023','High starters grow more','0,004')])
pg(f"""<div class='k'>Own analysis &middot; The evidence</div><h2>How strong what we <i>found</i> is</h2>
<table><tr><th>Relationship</th><th>n</th><th style='text-transform:none'>rho</th><th>95% interval</th><th>p</th><th>Read as</th></tr>{rows}</table>
<div class='g2' style='margin-top:6mm'><div><h3>Method</h3><p class='mini'>Rank correlation (Spearman), confidence interval via 5,000 bootstrap draws. Countries: 27 EU member states, companies with 10+ employees, 2025 (Eurostat). Sectors: 12 CBS sectors, 2+ employees, 2023–2025. Private use: 15 countries with Microsoft data.</p></div>
<div><h3>What this is not</h3><p class='mini'>Not cause and effect. A small n makes intervals wide. &ldquo;Not significant&rdquo; does not mean &ldquo;no relationship&rdquo;, but: not demonstrable with this data. Eurostat and CBS measure different groups, so we did not mix them.</p></div></div>
<h3 style='margin-top:6mm'>How sure we are: correlation with 95% interval</h3><div class='ch' style='margin:1mm 0 0;padding:3mm 3mm 1mm'>{forest()}</div><p class='mini' style='color:var(--mut);margin-top:1mm'>Gold: interval is clear of zero. Grey: no demonstrable relationship.</p><div class='note' style='margin-top:4mm'>We do not claim nobody has ever seen this. We show <b>how sure</b> we are. That is the difference.</div>
<div class='ft'><span class='lab'>Own analysis</span>All calculations and raw figures are in the database that comes with the magazine (tables country_ai, sector_ai, analysis_results).<br>Source: Eurostat KS-01-26-009, CBS (sectors), own calculation Bedrijfsgeheugen, November 2026.</div>""")
# ---- acht lenzen
def lens(t,n,txt,imp,lab,src):
    return f"<div class='card'><div class='tg'>{t} &middot; {lab}</div><div class='n'>{n}</div><p>{txt}</p><p><b>For you:</b> {imp}</p><div class='tg' style='margin-top:1mm;text-transform:none;letter-spacing:.02em;font-weight:400'>{src}</div></div>"
L=[lens('Psychology','75.4%','of Dutch people (18+) expect certain jobs to disappear. Only 18% know that AI reasons differently from a human.','fear and ignorance are team topics. Talk about them before you roll out tools.','Fact / indication','CBS 2025; Conclusion, 1,000 Dutch respondents, 2026'),
lens('Strategy','6%','of (large) organisations get at least 5% of profit from AI. The winners change their work, not just their tools.','pick one process and redesign it, instead of trying ten tools.','Fact','McKinsey 2026 (via The Register)'),
lens('Law','Dec 2027','new date for high-risk AI. AI literacy already applies: support rather than guarantee.','record your AI use and teach your people to work with it.','Fact','Regulation (EU) 2026/1744'),
lens('Labour market','64%','of Dutch companies have vacancies they cannot fill. About 30% of them choose automation as their main answer.','small companies (5–50) mainly choose attractive employment terms. Automation complements that, it does not replace it.','Link','CBS via NL Times, June 2026'),
lens('Politics','6 Nov','2026: the Dutch cabinet adopts the vision &ldquo;Choosing AI for everyone&rdquo;. Barriers for SMEs should go, guided experimentation becomes possible. The announcement names no amounts.','follow the roll-out of AI infrastructure in early 2027. Do not count on money yet.','Fact','Dutch national government, 6-11-2026'),
lens('Energy','±10%','of peak electricity demand in the Netherlands could go to data centres if all planned projects are built. Amsterdam paused new projects because of grid scarcity.','AI runs in other people&rsquo;s data centres. Ask where your data is and what a price increase means for your subscription.','Link (scenario)','IEA, November 2025'),
lens('Technology','13×','per year the price falls for the same AI performance. But compute grows 3.3 times per year, and power and chips remain scarce.','do not lock into a provider for three years. Keep your data portable.','Link','Epoch AI; Stanford AI Index 2026'),
lens('Processes','39.3%','of Dutch companies with AI use it for administration and operations, the most common purpose. Then marketing and sales (37.2%).','start with the process with the most repetition and the least glamour.','Fact','Eurostat KS-01-26-009')]
pg(f"""<div class='k'>Eight lenses</div><h2>The same gap, <i>eight sides</i></h2>
<p class='mini' style='max-width:155mm'>A gap has no single cause. That is why we looked at psychology, strategy, law, the labour market, politics, energy, technology and processes. One number per lens and what it means for you.</p>
<div class='l8' style='margin-top:3mm'>{''.join(L)}</div>
<div class='ft'>Every lens is in the database with source and evidence level. Secondary sources and vendor research are labelled as indications. No legal or financial advice.</div>""")

block('I · Look','Where do <i>you</i> stand in the gap?','13.8%','of micro businesses (2–10 employees) used AI in 2025. SMEs (10–250): 29.8%. Large companies: 66.2%.',
 chart('Netherlands (CBS), 2025',[('Micro',13.8),('SMEs',29.8),('Large',66.2,True)],mx=70)+chart('EU (Eurostat), 2025, 10+ employees',[('Small',17.0),('Medium',30.4),('Large',55.0,True)],mx=70),
 'The smaller the company, the less AI. That also means: more than eight in ten micro businesses are still watching. A small step is already a head start.',
 'The average says nothing about your sector. Compare with companies like yours, not with large companies.',
 ['Note your team size and find your row in the chart.','Write down the three tasks that cost you the most time last week.','Put a cross next to every task that already involves AI or automation.'],
 'the Self-test from the report &ldquo;The AI gap in SMEs&rdquo; or a Fresh Look conversation.','Fact','CBS (via ICTMagazine, 16-3-2026), Eurostat KS-01-26-009.','CBS and Eurostat use different company sizes. Do not compare, do read. ')
block('II · Choose','Start where the <i>most boring work</i> is','39.3%','of Dutch AI-using companies (10+) use AI for administration and operations, the most common purpose. Marketing and sales: 37.2%.',
 chart('Purposes of AI, Netherlands 2025 (% of AI users, 10+)',[('Administration and operations',39.3,True),('Marketing and sales',37.2),('ICT security',19.9)],mx=45)+chart('Micro businesses with AI (CBS), 2025',[('Marketing and sales',32.7),('Administration and management',25.9)],mx=45),
 'Whoever starts smart picks repeatable work with text and numbers: quotes, emails, invoices, reports. That is no coincidence, it is where AI costs the least and helps the fastest.',
 'The Dutch figure for marketing has a series break in the Eurostat series. Read it as a direction, not as exact.',
 ['Pick one repetitive task that takes more than two hours a week.','Write the desired result in one sentence, for example: &ldquo;a draft quote in ten minutes&rdquo;.','Decide who checks the result before it leaves the building.'],
 'start with the assistant in your existing email or accounting package before you buy anything new.','Fact','Eurostat KS-01-26-009; CBS (via ICTMagazine).','Percentages are a share of the companies that use AI. ')
block('II · Choose','What holds you back? <i>Everyone the same.</i>','70.3%','of companies that considered AI name lack of knowledge as a barrier (EU, 10+, 2025). Costs: 38.4%.',
 chart('Barriers (% of companies that considered AI), EU 2025',[('Lack of knowledge',70.3,True),('Unclear law and rules',53.6),('Privacy and data',52.7),('Data quality',43.5),('Does not fit our systems',41.6),('Costs too high',38.4),('Ethical concerns',24.6)],mx=75),
 'The first obstacle is knowledge, not money. And you solve knowledge with an hour a week, not a big budget. Of the companies that do not yet use AI, 14.2% had considered it.',
 'Whoever waits until it becomes &ldquo;clear&rdquo; is waiting for somebody else. Unclear rules are partly resolved: see building block 05.',
 ['Circle your two biggest barriers from the list above.','Write one action of at most thirty minutes for each barrier.','Put those thirty minutes in your calendar now, this week.'],
 'one learning source per barrier: an hour of tuition, a colleague who is ahead, or short coaching.','Fact','Eurostat KS-01-26-009 (2026).','Only companies that considered AI were asked about barriers. ')
block('III · Set rules','Your team is <i>already</i> using it.','42.9%','of employed people in the Netherlands used AI for work in 2025. University: 55.5%. Basic/pre-vocational: 19.7%.',
 chart('AI use for work, Netherlands 2025 (% of employed)',[('All employed',42.9),('Higher education',55.5,True),('Upper secondary / vocational 2–4',32.0),('Basic / pre-vocational',19.7)],mx=60)+chart('Employers that use AI and offer guidance (UWV, autumn 2025, 3,551 employers)',[('Six in ten',60.0,True)],mx=100,note='UWV says &ldquo;only six in ten&rdquo;.'),
 'The use is already there, the guidance lags behind. Whoever sets no rules gets AI in the organisation anyway, just without agreements. Education decides who benefits.',
 'Shadow AI: employees paste company data into a private account. See building block 06.',
 ['Ask your team anonymously which AI they already use, and for what.','Agree three rules: what may and what may never go into an AI.','Plan one hour of learning per person this quarter.'],
 'SLIM MKB, Dutch subsidy for learning and development. The 2026 application windows have closed (7 April to 4 May, 19 August to 7 September). Follow the announcement for the next window.','Fact','CBS longread AI in society (25-2-2026); UWV (March 2026); Dutch national government (31-3-2026).','SLIM is not AI-specific. ')
block('III · Set rules','The law has shifted, <i>not disappeared</i>','2027','is the new year for high-risk AI (Annex III): 2 December 2027, previously 2 August 2026. Regulation (EU) 2026/1744, in force since 27 July 2026.',
 f"""<div class='ch'><div class='ct'>AI Act timeline, what applies now</div><div class='tl'><div><b>Feb 2025</b>prohibited practices and AI literacy</div><div><b>Aug 2025</b>rules for AI models (GPAI)</div><div><b>Aug 2026</b>transparency: show that it is AI</div><div><b>Dec 2026</b>watermarking for existing systems</div><div><b>Dec 2027</b>high-risk (Annex III)</div><div><b>Aug 2028</b>high-risk (Annex I)</div></div></div>""",
 'For most SMEs two things matter now: support your people in learning to work with AI (Article 4, now &ldquo;support&rdquo; instead of &ldquo;guarantee&rdquo;) and be open when something was made by AI.',
 'This is not legal advice. Whether your application is high-risk depends on its use. If in doubt, ask a lawyer.',
 ['List all AI tools your company uses.','Note per tool who uses it and for what, and whether customers notice.','Agree that AI-made content is labelled as such.'],
 'a simple AI register: tool, user, purpose, date. A spreadsheet is enough.','Fact','White &amp; Case, EU AI Omnibus enters into force (July 2026); Gibson Dunn (27-5-2026).','Legal summaries, not statute text. ')
block('III · Set rules','The weakest link <i>wears a badge</i>','67%','of AI users open AI services through non-business accounts on work devices (Verizon DBIR 2026, all organisations).',
 chart('Verizon DBIR 2026 (all organisations, no SME breakdown)',[('AI via private account on work device',67.0,True),('Human involved in breach',62.0),('Third parties involved in breach (was 30%)',48.0),('Employees use AI tools (tripled)',45.0)],mx=75),
 'AI use grows faster than agreements. The risk is rarely in the technology and often in a paste action: customer data in a private account.',
 'The figures apply to all organisations, not specifically to SMEs. Read them as a direction.',
 ['Switch on two-factor authentication for email, accounting and AI accounts.','Set up one business AI account for the team instead of private accounts.','Install a password manager and have every employee use it.'],
 'a business team account with your AI provider with the setting that data is not used for training.','Link','Verizon DBIR 2026 (via Cyber Readiness Institute).','Secondary summary of the DBIR. ')
block('IV · Build','Customers want a human, <i>and speed</i>','7%','choose AI over a human for customer service. But if the human keeps them waiting, 44% choose AI.',
 chart('Consumers on AI customer service (1,083 consumers, 8 countries, 2026)',[('Choose AI over human',7.0),('Choose AI if the human keeps them waiting',44.0,True),('Do not trust AI with complex matters',24.0)],mx=50),
 'AI is not a replacement for the human, but for the waiting time. Let AI handle the simple questions and the first draft, and keep the human for trust.',
 'This is research from a vendor of customer service software. Take it as an indication, not as a measurement of the market.',
 ['Write down your ten most frequent customer questions.','Have an AI draft an answer for each. You read and send.','State in every message that the customer can always ask for a human.'],
 'build an AI first instead of an Excel sheet: a fixed assistant with your answers, for example in your own knowledge base.','Link','Lorikeet consumer research (11-5-2026), vendor research.','Evidence level C. ')
block('IV · Build','It gets cheaper. <i>Your bill doesn&rsquo;t, by itself.</i>','13×','per year the market price falls for the same AI performance (Epoch AI). MIT arrives at 5 to 10 times per year.',
 chart('One question to an AI, same score (Epoch AI)',[('Early 2025 (OpenAI o3), US cents',30.0,True),('±18 months later, US cents',0.04)],mx=32,u=' ct',dec=2),
 'Waiting for cheaper pays off less than learning. But the best models can become more expensive per question, because they compute more. And 20% of large organisations say costs limit their use.',
 'Prices at a fixed score fall, not automatically your total bill. More use means a higher invoice.',
 ['Set a monthly budget for AI, however small.','Write down what one task costs now in time and in subscription.','Pick the smallest model that still does the task well.'],
 'a subscription with a fixed price per user is more predictable for small teams than pay-per-use.','Link','Epoch AI and MIT (via The Decoder, 2026); McKinsey State of AI 2026 (via The Register).','Epoch calls the measurement rough. ')
block('V · Measure','Use is not a <i>result</i>','6%','of (large) organisations get at least 5% of profit from AI. While 80% of AI users feel more productive.',
 chart('McKinsey State of AI 2026 (1,719 respondents, mostly large organisations)',[('AI users feel more productive',80.0),('Organisations with any effect on profit',37.0),('Organisations with at least 5% profit contribution',6.0,True)],mx=90),
 'Personal gain only becomes company profit when the work changes. In studies (Stanford AI Index 2026) the gain is around 14–15% in customer service and 26% in software. Whether that applies to you is our judgement, not a measurement.',
 'Self-reported and large organisations. There are no comparable figures for SMEs.',
 ['Choose one number in advance: hours per quote, lead time, or number of errors.','Measure that number now, for two weeks.','Measure it again after ninety days and write down what changed.'],
 'a simple measurement sheet: task, baseline, follow-up after 90 days. Your plan on page 18 already has the fields.','Our view','McKinsey (via The Register, 25-8-2026); Stanford AI Index 2026 (via UNU-C3).','Secondary summaries. ')

# ---- 14 werkblad
mvs=[('I','Look','10 min','Where do I stand? My team size and my three time-wasters.'),('II','Choose','15 min','The one task and the barrier I remove.'),('III','Set rules','25 min','Three team rules, my AI register, my security step.'),('IV','Build','30 min','My first AI assistant: for which question, with whose answers.'),('V','Measure','10 min','My one number, now and in 90 days.')]
w=''.join(f"<div class='mv'><div class='m'>{r}<small>{t}</small></div><div><b>{n}</b> &middot; <span class='mini'>{d}</span><span class='fb' style='margin-top:1.5mm' data-f='w{i+1}'></span></div></div>" for i,(r,n,t,d) in enumerate(mvs))
pg(f"""<div class='k'>Worksheet</div><h1>Your <i>ninety minutes.</i></h1><p class='mini' style='max-width:150mm'>Fill this in directly in this PDF file. Save it and keep it with your quarterly planning.</p>{w}
<div class='ft'>Tip: start with the building block that chafes the most. You do not have to do everything this quarter.</div>""")
# ---- 15 plan
pg(f"""<div class='k'>Your plan</div><h1>One task. <i>One number.</i> Ninety days.</h1>
<div class='g2' style='margin-top:6mm'><div><h3>The task</h3><span class='fb' data-f='p_taak'></span><h3 style='margin-top:4mm'>Owner</h3><span class='fb' data-f='p_eigenaar'></span><h3 style='margin-top:4mm'>Start date</h3><span class='fb' data-f='p_start'></span></div>
<div><h3>My number (now)</h3><span class='fb' data-f='p_nu'></span><h3 style='margin-top:4mm'>Target in 90 days</h3><span class='fb' data-f='p_doel'></span><h3 style='margin-top:4mm'>Next ritual (date)</h3><span class='fb' data-f='p_volgend'></span></div></div>
<h3 style='margin-top:6mm'>The barrier I remove</h3><span class='fb' data-f='p_drempel' style='height:18mm'></span>
<h3 style='margin-top:3mm'>What I stop doing</h3><span class='fb' data-f='p_stop' style='height:18mm'></span>
<div class='q' style='margin-top:8mm'>Whoever takes ninety minutes every quarter is four steps ahead of those who wait after a year.</div>
<div style='margin-top:6mm;font-size:8.5pt'><span class='cbx' data-f='p_akkoord' style='border-color:var(--ink)'></span> I made this plan and am putting it in my calendar.</div>""")
# ---- 16 verantwoording
import sqlite3
c=sqlite3.connect(SC+'groot/ai_mkb.db')
rows=c.execute("select id,publisher,name,published,tier,caveat from sources where id like 'M%' order by id").fetchall()
_EN={'M01':('Eurostat','Eurostat news release 20251211-2 (isoc_eb_ai)','No NL figure in text'),'M02':('CBS (secondary via ICTMagazine)','CBS: AI in micro businesses (via ICTMagazine 16-3-2026)','CBS report itself not consulted; SME class 10-250'),'M03':('CBS','CBS longread AI in society: labour market','Sample size not in text'),'M04':('UWV','UWV: strong increase in AI use on the shop floor','No usage percentage in article'),'M05':('Stanford HAI / UNU-C3','Stanford AI Index 2026 (via UNU-C3 summary)','Secondary summary'),'M06':('McKinsey / The Register','McKinsey State of AI 2026 (via The Register 25-8-2026)','Self-reported; secondary'),'M07':('White & Case','White & Case: EU AI Omnibus enters into force','Legal summary, not legal advice'),'M08':('Verizon / CRI','Verizon DBIR 2026 (via Cyber Readiness Institute)','DBIR-wide figures, not SME-specific'),'M09':('Epoch AI / MIT','Epoch AI price decline (via The Decoder)','Rough measurement; peak performance can cost more'),'M10':('Lorikeet (vendor)','Lorikeet consumer research on AI customer service','Vendor research; indicative'),'M11':('Dutch government','Dutch government: SLIM MKB application windows','Learning and development, not AI-specific; 2027 windows unknown'),'M12':('Eurostat','Eurostat KS-01-26-009 (barriers, purposes, NL purposes)','NL: series break'),'M13':('Conclusion','Conclusion AI assessment Netherlands (8-9-2026)','Own research of an IT service provider; fieldwork date not stated'),'M14':('CBS (secondary via NL Times)','CBS research on staff shortage and automation (via NL Times, 3-6-2026)','Approximate figure; underlying CBS/KVK/EIB research not consulted'),'M15':('Dutch government','Cabinet vision on AI: Choosing AI for everyone (Dutch government 6-11-2026)','News release, no amounts named'),'M16':('IEA','IEA: energy constraints and Europe data centre goals','Scenario, not all projects will be built'),'M17':('Bedrijfsgeheugen','Own analysis Bedrijfsgeheugen on Eurostat country data','Correlations, not causation; small n; partly arithmetic'),'M18':('CBS (with KVK, EIB, MKB-Nederland, VNO-NCW)','CBS Business Cycle Survey: companies invest more in automation due to staff shortage','Survey, \"automation\" = incl. robotics or AI support; not AI use as such'),'M19':('CBS','CBS Labour productivity commercial sector rises 2.5 percent','2024 and 2025 provisional; no causal link with AI shown'),'M20':('CBS','CBS Bankruptcies October 2026','Monthly figures volatile; cumulative is own summation'),'M21':('Microsoft AI Economy Institute','Microsoft: The continued state of global AI diffusion in 2026','Telemetry from own products; method changes next edition'),'M22':('CBS','CBS AI in society: experiences and opinions','Self-reported; people, not companies'),'M23':('INE Spain','Companies: use of ICT and AI, first quarter 2026 (ETICCE)','No formal definition on the press release page'),'M24':('Istat Italy','Enterprises and ICT, year 2025','National definition, same Eurostat survey'),'M25':('MIC Japan','Information and Communications White Paper 2026 (Reiwa 8), generative AI use','Not comparable with Eurostat/CBS: different question and base; sample size unknown'),'M26':('Bitkom Research','Bitkom: AI in business (press release)','Total AI-use percentage not on this page; margins at small percentages'),'M27':('De Nederlandsche Bank','The economic consequences of defence spending (Feb 2026)','No quantitative NL GDP effect; European results as upper bound')}
rows=[(r[0],_EN[r[0]][0],_EN[r[0]][1],r[3],r[4],_EN[r[0]][2]) for r in rows]
_cut=lambda t,n:(t if len(t)<=n else t[:n-1].rsplit(' ',1)[0]+'…')
tr=''.join(f"<tr><td>{_cut(r[1],26)}</td><td>{_cut(r[2],62)}<br><span style='color:var(--mut)'>{r[3]}</span></td><td><b>{r[4]}</b></td><td>{_cut(r[5],70)}</td></tr>" for r in rows)
pg(f"""<div class='k'>Accountability</div><h2>Sources and <i>evidence</i></h2>
<p class='mini'>Level A: official statistics or law. B: summary or research with open method. C: vendor research, indicative. For every figure we noted the population and the limitation.</p>
<table style='font-size:6.4pt;line-height:1.22'><tr><th>Source</th><th>Title</th><th>Level</th><th>Note</th></tr>{tr}</table>
<p class='mini' style='margin-top:2mm;font-size:6.6pt;line-height:1.3'>Not used: figures we could not trace to the primary source. Cover image: AI-generated. No legal or financial advice.</p>""")
# ---- datalab: wie meet wat
pg(f"""<div class='k'>Own analysis &middot; Measurement difference</div><h1 style='font-size:32pt'>How many Dutch companies use AI? <i>It depends on who counts.</i></h1>
<p style='max-width:160mm'>The same question, eight answers between 14% and 70%. No single number is wrong: they measure different companies, different questions and different people. Whoever mixes them up draws the wrong conclusion.</p>
{chart('AI use in the Netherlands, eight measurements (2025-2026)',[('CBS micro (2-10 employees)',13.8),('CBS all companies (2+)',17.0),('CBS SMEs (10-250 employees)',29.8),('CBS/Eurostat companies 10+',33.2),('Employed people who use AI for work (CBS)',42.9),('People 15-64, gen-AI (Microsoft)',43.5),('Large companies (250+, CBS)',66.2),('SMEs say they use AI (Exact, self-reported)',70.0)],note='Rows: business statistics (CBS, Eurostat), person measurements (CBS, Microsoft) and a self-reported survey (Exact). Do not add up or equate.')}
<div class='l8'>
<div class='card'><div class='tg'>Rule 1 &middot; Fact</div><h4>Do you count from two or from ten?</h4><p>CBS 2+ gives 17%, 10+ gives 33.2%. The difference lies in the very smallest companies, not in the technology.</p></div>
<div class='card'><div class='tg'>Rule 2 &middot; Fact</div><h4>Do you use it, or do you say so?</h4><p>The Exact barometer reports 70% in 2026, after 33% and 6% earlier. That is self-reporting among customers of an accounting package. Statistics and survey are not one series.</p></div>
<div class='card'><div class='tg'>Rule 3 &middot; Fact</div><h4>People are not companies.</h4><p>42.9% of employed people use AI for work (CBS 2025), while 29.8% of SME companies officially do. Your team is ahead of your company.</p></div>
<div class='card'><div class='tg'>Our view</div><h4>Only compare within one measurement.</h4><p>For your own trend: choose one definition and measure it every quarter. That is why from now on we store every series with definition and population.</p></div></div>
<div class='ft'><span class='lab'>Own analysis</span>Sources: CBS (S02, M02, M22), Eurostat (M12), Microsoft (S11), Exact (S04). Population and definition per figure in the trend bank (page 21).</div>""")
# ---- trendbank
def _o(sid,seg=None):
    q="select period,value from observations where series_id=? "+("and segment=? " if seg else "")+"order by period"
    return _db.execute(q,(sid,seg) if seg else (sid,)).fetchall()
_db=_sq.connect(SC+'groot/ai_mkb.db')
_n=_db.execute('select count(*),count(distinct series_id) from observations').fetchone()
_pr=_db.execute("select value from observations where series_id='nl_labour_productivity_growth' order by period").fetchall()
_pr=[v[0] for v in _pr]
_r1=_db.execute("select value,ci_low,ci_high,note from analysis_results where name like 'Automatisering als maatregel: persistentie%'").fetchone()
_r2=_db.execute("select value,ci_low,ci_high,note from analysis_results where name like 'Automatisering als maatregel: verandering%'").fetchone()
f=lambda x,d=2:f"{x:.{d}f}".replace('.',',')
pg(f"""<div class='k'>Trend bank &middot; Edition 2026-Q4</div><h1 style='font-size:32pt'>What we record now, <i>we compare later.</i></h1>
<p style='max-width:160mm'>Every edition we record the data points with definition, population and source. That way No. 05 can show what has shifted, not just where we stand. Below the hand-picked core: <b>{_n[0]} data points in {_n[1]} series</b> (CSV and JSON). In addition, page 22 holds the Atlas with the full corpus.</p>
<div class='l8'>
<div class='card'><div class='tg'>New &middot; Fact</div><h4>Automating against staff shortage: 24.7% to 29.7%.</h4><p>64% of companies have a staff shortage (CBS, April 2026). Large companies choose it most often (40.4%), small companies least (20.1%). Information and communication: 28.5% to 44.1%. Still no measurement of AI use itself: automation also includes robotics.</p></div>
<div class='card'><div class='tg'>New &middot; Fact</div><h4>Productivity +2.5% in 2025, after two years of decline.</h4><p>Commercial sector, value added per hour worked (CBS, provisional). In 2023 it was -2.0%, in 2024 -0.4%. No evidence that AI causes this: the contribution is mainly in trade and industry, information and communication contributed -0.15 points.</p></div>
<div class='card'><div class='tg'>New &middot; Fact</div><h4>Bankruptcies: October +27%.</h4><p>322 against 253 a year earlier, but Jan-Oct stands at 2,983 against 3,063 (own summation). The month says little, the series more. We keep tracking the series.</p></div>
<div class='card'><div class='tg'>New &middot; Own analysis</div><h4>Whoever starts high stays high. Catching up not shown.</h4><p>Across 12 sectors the ranking stayed almost the same (rho {f(_r1[0])}, interval {f(_r1[1])} to {f(_r1[2])}). Whether low sectors grow faster: rho {f(_r2[0])}, interval {f(_r2[1])} to {f(_r2[2])}, so not demonstrable. 11 of 12 sectors rose.</p></div></div>
<div class='ch'><div class='ct'>What the trend bank contains</div><p class='mini' style='margin:0'>Eurostat AI use per country and company size (2024, 2025) &middot; CBS AI use per sector (2023-2025) &middot; CBS labour productivity 2000-2025 &middot; CBS automation and staff shortage per sector (Apr 2025, Apr 2026) &middot; CBS bankruptcies per month and sector &middot; Microsoft AI use per country (Q2 2026) &middot; CBS AI among employed people &middot; Exact SME Barometer &middot; NL measurement differences (eight definitions).</p></div>
<div class='ft'><span class='lab'>Own analysis</span>Spearman rank correlation with bootstrap (5,000 draws), n = 12 sectors, CBS Business Cycle Survey (M18). Download: portal-v2/reports/trendbank/. Only compare series with the same definition.</div>""")
# ---- atlas
_t=_sq.connect(SC+'bulk/tb.sqlite')
_fam=[('Eurostat','eurostat_%','Macro, labour, energy prices, R&amp;D, cloud and AI per EU country'),('OECD','oecd_%','ICT and AI in business, SME financing, FDI, forecasts, digital trade'),('IMF','imf_%','132 indicators for 190+ countries, forecasts to 2031, AI Preparedness'),('World Bank','wb_%','Digital, entrepreneurship, energy, trade, defence, credit'),('ECB','ecb_%','Interest rates, exchange rates, lending to companies'),('CBS','cbs_%','Netherlands: ICT/AI, vacancies, confidence, innovation, labour costs'),('Our World in Data','owid_%','AI investment, compute, energy prices, democracy')]
_tr=''.join(f"<tr><td><b>{n}</b></td><td style='text-align:right'>{_t.execute('select count(*) from observations where series_id like ?',(p,)).fetchone()[0]:,}</td><td style='text-align:right'>{_t.execute('select count(distinct series_id) from observations where series_id like ?',(p,)).fetchone()[0]:,}</td><td>{d}</td></tr>".replace(',','.') for n,p,d in _fam)
_tot=_t.execute('select count(*),count(distinct series_id) from observations').fetchone()
_srcn=_t.execute('select count(*) from sources').fetchone()[0]
_an=_db.execute("select name,value,ci_low,ci_high,n,note from analysis_results where name like 'AI-gebruik 2025 vs %' order by value desc").fetchall()
_KN={'BBP per inwoner (EUR)':'GDP per capita (EUR)','Uurloonkosten':'Hourly labour costs','R&D (% BBP)':'R&D (% of GDP)','Minimumloon':'Minimum wage','Werkloosheid':'Unemployment','Aandeel hernieuwbaar':'Share renewable','Elektriciteitsprijs bedrijven':'Electricity price for companies','Overheidsschuld (% BBP)':'Government debt (% of GDP)','Inflatie':'Inflation'}
_ar=''.join(f"<tr><td>{_KN[a[0].replace('AI-gebruik 2025 vs ','').replace(' (27 EU-landen)','')]}</td><td style='text-align:right'><b>{f(a[1])}</b></td><td>{f(a[2])} to {f(a[3])}</td><td>{a[5].split('Holm-gecorrigeerd p=')[1].split(';')[0]}</td></tr>" for a in _an)
pg(f"""<div class='k'>The Atlas &middot; Edition 2026-Q4</div><h1 style='font-size:32pt'>{_tot[0]:,} data points. <i>One question.</i></h1>
<p style='max-width:162mm'>From Eurostat, OECD, IMF, World Bank, ECB, CBS and Our World in Data we collected everything that touches business: macro, labour, energy, trade, politics, geopolitics, technology and finance. Together {_tot[1]:,} series from {_srcn} sources and datasets, recorded with definition and source. Next edition we hold them against each other.</p>
<table style='margin-bottom:3mm'><tr><th>Source</th><th style='text-align:right'>Data points</th><th style='text-align:right'>Series</th><th>What is in it</th></tr>{_tr}</table>
<div class='card' style='margin-bottom:3mm'><div class='tg'>First test &middot; 27 EU countries &middot; Own analysis</div><h4>What goes with AI use by companies?</h4>
<table><tr><th>Country characteristic</th><th style='text-align:right'>rho</th><th>Interval 95%</th><th>p (Holm)</th></tr>{_ar}</table>
<p class='mini' style='margin-top:1.5mm'>AI use in 2025 (Eurostat) against the latest year of each characteristic. Holm correction for {len(_an)} tests. Correlation, not causation: rich countries have a lot in common.</p></div>
<div class='l8'>
<div class='card'><div class='tg'>Our view</div><h4>AI follows labour, not energy.</h4><p>Countries with expensive labour and a lot of R&amp;D use more AI. The price of electricity for companies does not matter (rho {f(_db.execute("select value from analysis_results where name like '%Elektriciteitsprijs%'").fetchone()[0])}).</p></div>
<div class='card'><div class='tg'>What did not work</div><h4>Honest about the gaps.</h4><p>Eight World Bank series (including governance quality) and eight CBS tables (including entrepreneur confidence) we could not retrieve. News, languages outside the sources used and paid data are missing. We will fill in next edition.</p></div></div>
<div class='card' style='margin-top:3mm'><div class='tg'>Beyond the Netherlands &middot; Fact</div><h4>Spain 33.6%, Italy 16.4%, Netherlands 33.2%.</h4><p>Companies 10+ using AI: Spain Q1 2026 (INE), Italy and Netherlands 2025. Italy: SMEs 15.7%, large 53.1%. Japan reports 86.4% (gen-AI, at least one task): different question and base, not comparable.</p></div>
<div class='ft'><span class='lab'>Own analysis</span>Spearman with bootstrap (3,000 draws). Download: portal-v2/reports/trendbank/ (catalogue and full database). Only compare series with the same definition.</div>""".replace(f"{_tot[0]:,}",f"{_tot[0]:,}".replace(',','.')).replace(f"{_tot[1]:,}",f"{_tot[1]:,}".replace(',','.')))
# ---- besluitkaart
pg("""<div class='k'>The decision card &middot; Framework</div><h1 style='font-size:30pt'>What do you <i>actually</i> decide every day?</h1>
<p style='max-width:165mm'>AI only helps once you know which choices you make, how you make them and what you base them on. This framework gives every decision a fixed form, so you can see which ones you can leave to a rule or an assistant and which stay with you.</p>
<div class='l8' style='margin-top:3mm'>
<div class='card'><div class='tg'>Step 1 &middot; How reversible?</div><h4>Type 1 or Type 2.</h4><p><b>Type 2</b>: reversible, cheap to repair. Decide fast, with about 70% of the information, and set a rule. <b>Type 1</b>: hard or expensive to reverse (dismissal, big investment, pricing strategy). Take your time, ask for a second opinion and write down your assumptions.</p><span class='lab'>Working rule</span></div>
<div class='card'><div class='tg'>Step 2 &middot; On what basis?</div><h4>Intuition only where learning is possible.</h4><p>Kahneman and Klein (2009): trust your gut only in a regular environment with fast, clear feedback. For rare or slow decisions (hiring, pricing, investing), data or a checklist is preferable.</p><span class='lab'>Research</span></div></div>
<div class='card' style='margin-top:3mm'><div class='tg'>Step 3 &middot; Who are you as a decision-maker?</div><h4>Five types in Dutch SMEs.</h4>
<table><tr><th>Type</th><th style='text-align:right'>Share</th><th>Characteristic</th></tr>
<tr><td><b>Informers' friends</b></td><td style='text-align:right'>~33%</td><td>Decides on the advice of others, few alternatives (26%)</td></tr>
<tr><td><b>Daredevils</b></td><td style='text-align:right'>~22%</td><td>Lots of information (77%) and consultation (97%), high risk, innovative</td></tr>
<tr><td><b>Lone rangers</b></td><td style='text-align:right'>~21%</td><td>Decides alone, little information (49%), longest experience</td></tr>
<tr><td><b>Doubtful minds</b></td><td style='text-align:right'>~20%</td><td>Most information (86%) and alternatives (89%), keeps doubting</td></tr>
<tr><td><b>Busy bees</b></td><td style='text-align:right'>~6%</td><td>Most decisions, always consults, big investments</td></tr></table>
<p class='mini' style='margin-top:1.5mm'>Panteia (Gibcus, Vermeulen &amp; De Jong, 2009): 646 Dutch entrepreneurs, survey year 2004. Hospitality is over-represented and the research is old and not representative: treat it as a conversation starter (which type are you?), not as a label.</p></div>
<div class='card' style='margin-top:3mm'><div class='tg'>How Dutch entrepreneurs decide &middot; Fact / indication</div>
<table><tr><td>Data is rarely leading: <b>12%</b> of SME owners (Exact, article Jan 2024; edition not stated, still to be verified)</td></tr>
<tr><td>Almost three quarters of entrepreneurs (5+ employed persons) experience more uncertainty (CBS, Sept 2025)</td></tr>
<tr><td>69% sometimes lie awake; 70% use AI, but 47% do not really know how (Exact SME Barometer 2026, 1,719 entrepreneurs; self-reported)</td></tr></table>
<p class='mini' style='margin-top:1.5mm'>For most entrepreneurs, deciding is lonely work with incomplete information. That is why a fixed card helps more than yet another number.</p></div>
<div class='l8' style='margin-top:3mm'>
<div class='card'><div class='tg'>What we measure &middot; Fact</div><h4>The Netherlands uses AI: 33.2%.</h4><p>Companies with 10+ employees, 2025 (Eurostat): place 6 of 35 countries, EU27 20.0%. At 10&ndash;49 employees 28.8%, at 250+ 67.6%. So small still decides most often without AI.</p></div>
<div class='card'><div class='tg'>Worldwide &middot; Fact</div><h4>OECD: 61% use AI, 76% are beginners.</h4><p>D4SME 2026: 2,018 SMEs in 12 countries. Starting out is the norm, not the exception.</p></div></div>
<div class='ft'><span class='lab'>Open gap</span>We found no Dutch study of the daily decisions themselves, and no comparable data for China, India, Brazil, Africa and the Middle East. Also: a Type 1/Type 2 split is a thinking model, not a measurement.</div>""")
# ---- besluitkaart invulbaar
pg("""<div class='k'>The decision card &middot; Worksheet</div><h1>One decision. <i>One card.</i></h1><p class='mini' style='max-width:150mm'>Pick a decision you will certainly make this month. Fill in the card before you decide and again on the review date.</p>
<h3 style='margin-top:4mm'>The decision</h3><span class='fb' data-f='b_beslissing'></span>
<div class='g2'><div><h3>Domain</h3><span class='fb' data-f='b_domein' style='height:9mm'></span></div><div><h3>Who decides?</h3><span class='fb' data-f='b_wie' style='height:9mm'></span></div></div>
<div style='margin:2mm 0 3mm;font-size:9pt'><span class='cbx' data-f='b_type1' style='border-color:var(--ink)'></span> Type 1 (hard to reverse) &nbsp;&nbsp; <span class='cbx' data-f='b_type2' style='border-color:var(--ink)'></span> Type 2 (reversible)</div>
<div class='g2'><div><h3>Rule or threshold</h3><span class='fb' data-f='b_regel' style='height:16mm'></span></div><div><h3>Data needed</h3><span class='fb' data-f='b_data' style='height:16mm'></span></div></div>
<h3>My assumptions (what must be true?)</h3><span class='fb' data-f='b_aanname' style='height:16mm'></span>
<h3>Pre-mortem: suppose it fails, why?</h3><span class='fb' data-f='b_premortem' style='height:16mm'></span>
<div class='g2'><div><h3>Expected outcome</h3><span class='fb' data-f='b_uitkomst' style='height:12mm'></span></div><div><h3>Review date</h3><span class='fb' data-f='b_datum' style='height:12mm'></span></div></div>
<h3>What did I learn? (fill in at review)</h3><span class='fb' data-f='b_geleerd' style='height:16mm'></span>
<div class='ft'>Keep your cards with the quarterly ritual. After a year you will see which decisions you can leave to a rule or an AI assistant.</div>""")
# ---- jouw moment
pg("""<div class='k'>Your moment &middot; Closing</div><h1 style='font-size:32pt'>Put the numbers <i>down</i> for a moment.</h1>
<p style='max-width:155mm'>Ninety minutes is long enough to decide something and short enough to feel something. Answer these questions for yourself, not for your team or your customers. Nobody reads them but you.</p>
<div class='q'>A business rarely grows faster than its owner has time to think.</div>
<h3>What am I proud of this quarter?</h3><span class='fb' data-f='m_trots' style='height:15mm'></span>
<h3>What gives me energy in my work?</h3><span class='fb' data-f='m_energie' style='height:15mm'></span>
<h3>What costs me energy, and can it go or shrink?</h3><span class='fb' data-f='m_kost' style='height:15mm'></span>
<h3>What would I do with one extra free day a week?</h3><span class='fb' data-f='m_dag' style='height:15mm'></span>
<h3>What do I let go of?</h3><span class='fb' data-f='m_los' style='height:15mm'></span>
<div style='margin-top:5mm;font-size:9pt'><span class='cbx' data-f='m_gedaan' style='border-color:var(--ink)'></span> I took my hour. See you next quarter.</div>
<div class='ft'>You are not the only one who needs this: 11.8% of self-employed people had burnout symptoms in 2025 (TNO, NEA/ZEA). AI is a means; the goal is more time for what you find important.</div>""")
# ---- advertentie
QP=qr(PORTAL,'#0a1630')
CI=IMG(SC+'groot/img/consult.jpg')
pg(f"""<img src='{CI}' style='position:absolute;left:0;top:0;width:210mm;height:128mm;object-fit:cover;object-position:50% 40%'>
<div style='position:absolute;left:0;top:0;width:210mm;height:128mm;background:linear-gradient(180deg,rgba(10,22,48,.55) 0%,rgba(10,22,48,0) 35%,rgba(10,22,48,.0) 60%,rgba(10,22,48,.95) 100%)'></div>
<div style='position:absolute;right:17mm;top:10mm;font-size:6.5pt;letter-spacing:.3em;text-transform:uppercase;color:#e8c46e'>Advertisement</div>
<div style='position:absolute;left:17mm;right:17mm;top:98mm'><div style='font-family:Ser;font-size:46pt;line-height:1;color:#f7efdc'>Your company knows everything.<br><i style='color:#e8c46e'>Just not where.</i></div></div>
<div style='position:absolute;left:17mm;right:17mm;top:138mm'>
<p style='font-size:11.5pt;max-width:150mm;color:#e9e1cc'>Bedrijfsgeheugen is your company&rsquo;s memory: documents, systems and agreements in one place, connectable, searchable and queryable by AI. So knowledge stays when someone leaves, and your team gets answers faster than it can search.</p>
<div class='g3' style='margin-top:6mm'>
<div><h3>Find</h3><p class='mini'>Ask a question in plain language. Get the answer from your own documents and systems, with source.</p></div>
<div><h3>Connect</h3><p class='mini'>Link your accounting, email and files. Set it up once, then it keeps running.</p></div>
<div><h3>Keep</h3><p class='mini'>Record how it works and why, before it stays in somebody&rsquo;s head.</p></div></div>
<div style='display:flex;gap:7mm;align-items:center;margin-top:7mm;padding-top:6mm;border-top:.25mm solid rgba(232,196,110,.5)'>
<div style='background:#f6f0e3;padding:2.5mm;width:30mm;flex:none'>{QP}</div>
<div><div style='font-family:Ser;font-size:22pt;line-height:1.05;color:#f7efdc'>Start with a <i style='color:#e8c46e'>Fresh Look.</i></div><p class='mini' style='color:#cfc7b2;margin-top:2mm'>A one-hour introduction. Together we look at where the gap sits in your business. Scan the code or go to bedrijfsgeheugen.nl/frisse-blik. (Dutch-language service.)</p></div></div></div>
<div style='position:absolute;right:17mm;bottom:10mm;font-size:5pt;letter-spacing:.14em;text-transform:uppercase;opacity:.6'>Image: AI-generated</div>""",'dk')
# ---- 17 achterkant
QT=qr(TRIAL,'#0a1630')
pg(f"""<div class='k'>Do it together</div><h1>Rather not sit <i>alone</i> at the table?</h1>
<p style='font-size:11pt;max-width:150mm'>The ritual works best with someone looking along. Bedrijfsgeheugen keeps your quarterly plan, links it to your own business data and shows what has changed after ninety days. And if you want, an expert thinks along.</p>
<div class='g3' style='margin:6mm 0'><div class='ch' style='margin:0;background:transparent;border-color:rgba(232,196,110,.5)'><div class='ct' style='color:var(--gd)'>Yourself</div><p class='mini'>Use the portal and your plan.</p></div><div class='ch' style='margin:0;background:transparent;border-color:rgba(232,196,110,.5)'><div class='ct' style='color:var(--gd)'>Together</div><p class='mini'>An expert does the ritual with you.</p></div><div class='ch' style='margin:0;background:transparent;border-color:rgba(232,196,110,.5)'><div class='ct' style='color:var(--gd)'>Have it done</div><p class='mini'>We build the first AI assistant.</p></div></div>
<div style='display:flex;gap:8mm;align-items:center;background:#f6f0e3;color:var(--ink);padding:7mm;margin-top:4mm'><div style='flex:1'><div class='k' style='color:var(--gt)'>One month free</div><div style='font-family:Ser;font-size:26pt;line-height:1;margin-bottom:2mm'>Code <i style='color:var(--gt)'>KLOOF-Q4</i></div><p class='mini'>No payment method needed, once per email address. Scan the code, it is already filled in.<br><b>bedrijfsgeheugen.nl/afsluiten</b></p></div><div style='width:34mm;flex:none'>{QT}</div></div>
<p class='mini' style='margin-top:8mm;color:#cfc7b2'>Book an introduction: bedrijfsgeheugen.nl/frisse-blik. Editorial: Bedrijfsgeheugen, November 2026.</p>""",'dk')

html0=f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>The Gap No. 04</title><style>{CSS}</style></head><body>{''.join(pages)}</body></html>"
import re as _re
def _num(m):
    t=m.group(1)
    t=_re.sub(r'(?<![\d.,])([1-9]\d{0,2})((?:\.\d{3})+)(?![\d])',lambda k:k.group(1)+k.group(2).replace('.',','),t)
    t=_re.sub(r'(?<![\d.,])(\d+),(\d+)(?!\d)',lambda k:(k.group(1)+'.'+k.group(2)) if (k.group(1) in('0',) or len(k.group(2))<=2) else k.group(0),t)
    return '>'+t+'<'
html=_re.sub(r'>([^<>]+)<',_num,html0)
open('de-kloof-no04-en.html','w').write(html)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg_=b.new_page();pg_.goto('file://'+os.path.abspath('de-kloof-no04-en.html'));pg_.wait_for_timeout(900)
    over=pg_.evaluate("""()=>[...document.querySelectorAll('.p')].map((p,i)=>{const pr=p.getBoundingClientRect();let m=-1e9,w='';p.querySelectorAll('*').forEach(e=>{if(e.closest('.hd'))return;const r=e.getBoundingClientRect();if(r.height&&r.bottom>m&&!e.closest('.ft')&&getComputedStyle(e).position!=='absolute'){m=r.bottom;w=e.className||e.tagName}});const ft=p.querySelector('.ft');const fr=ft?ft.getBoundingClientRect().top:pr.bottom;return [i+1,Math.round((fr-m)*.2646*10)/10,w]})""")
    print(over)
    pg_.pdf(path='de-kloof-no04-en.pdf',width='210mm',height='297mm',print_background=True);b.close()
