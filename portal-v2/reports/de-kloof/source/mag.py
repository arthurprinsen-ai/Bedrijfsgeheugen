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
BK={1:('Type 2','Beslis met wat je weet: noteer je teamgrootte en kies je vergelijkingsgroep.'),
2:('Type 2','Terug te draaien. Regel: begin met een taak van meer dan twee uur per week.'),
3:('Type 2','Evalueer na 30 dagen welke belemmering je als eerste hebt weggenomen.'),
4:('Type 2','Eén teamregel in één zin; evaluatiedatum: je volgende ritueel.'),
5:('Type 1','Moeilijk terug te draaien. Vraag een tweede mening (jurist of branchevereniging) voor je beslist.'),
6:('Type 2','Niet wachten op meer informatie: zet tweestapsverificatie nu aan.'),
7:('Type 2','Aanname om op te schrijven: klanten accepteren een AI-concept dat jij controleert.'),
8:('Type 1','Pre-mortem: wat als de prijs verdubbelt? Kies geen aanbieder voor drie jaar.'),
9:('Type 2','Eén getal, één evaluatiedatum over negentig dagen.')}
NOTES={1:'Onze eerste reactie: dit gat is <b>kleiner dan het voelt</b>. Het is geen techniek, het is een begin.',2:'Saai is goed. Wie begint bij het werk dat niemand mist, <b>verliest niets</b>.',3:'Let op: kennis staat bovenaan, geld ver eronder. Dat is <b>goed nieuws</b>.',4:'Je team is je ver vooruit. <b>Ga ernaast staan</b>, niet ervoor.',5:'Uitstel is geen vrijbrief. De regels over <b>mensen opleiden</b> gelden al.',6:'Dit is geen IT-probleem. Het is een <b>gewoonteprobleem</b>.',7:'Mensen willen een mens, maar niet <b>wachten</b>. Daar zit je kans.',8:'Prijs is niet de vraag. <b>Gebruik</b> is de vraag.',9:'Meet wat je <b>aan het eind van de week</b> hoopt te zien, niet wat leuk klinkt.'}
def block(mv,title,big,cap,charts,means,risk,steps,tool,label,src,foot):
    BN[0]+=1
    nt=NOTES.get(BN[0],'')
    nt=f"<div class='note'>{nt}</div>" if nt else ''
    st=''.join(f"<div class='st'><span class='cbx' data-f='b{BN[0]}s{i+1}'></span><span>{s}</span></div>" for i,s in enumerate(steps))
    pg(f"""<div class='k'>Bouwblok {BN[0]:02d} &middot; Beweging {mv}</div><h2>{title}</h2>
<div class='bigrow'><div class='big'>{big}</div><div class='cap'>{cap}</div></div>{charts}
<div class='g2'><div><h3>Wat het betekent</h3><p class='mini'>{means}</p></div><div><h3>Risico</h3><p class='mini'>{risk}</p></div></div>
<div class='mini' style='margin-top:2mm;border-top:.25mm solid var(--ln);padding-top:1.5mm'><span class='lab'>Besluitkaart &middot; {BK[BN[0]][0]}</span>{BK[BN[0]][1]}</div>
{nt}<div class='mon'><h3>Doe dit maandag</h3>{st}<div class='mini' style='color:#cfc7b2;margin-top:2mm'><b style='color:var(--gd)'>Gereedschap:</b> {tool}</div></div>
<div class='ft'><span class='lab'>{label}</span>{foot}<br>Bron: {src}</div>""",'alt' if BN[0]%2==0 else '')

# ---- 1 cover
cv=IMG(SC+'mag/cover_a.jpg')
pg(f"""<img src='{cv}' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 55%'>
<div style='position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,12,30,.88) 0%,rgba(6,12,30,.35) 22%,rgba(6,12,30,0) 40%,rgba(6,12,30,.15) 60%,rgba(6,12,30,.92) 100%)'></div>
<div style='position:absolute;inset:10mm;border:.25mm solid rgba(232,196,110,.55)'></div>
<div style='position:absolute;left:18mm;right:18mm;top:17mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.32em;text-transform:uppercase;color:#e8c46e'><span>Kwartaalmagazine</span><span>No. 04 &middot; Winter 2026</span></div>
<div style='position:absolute;left:0;right:0;top:27mm;text-align:center;font-family:Ser;font-size:112pt;line-height:1;letter-spacing:.02em;color:#f7efdc'>De <i style='color:#e8c46e'>Kloof</i></div>
<div style='position:absolute;left:0;right:0;top:75mm;text-align:center;font-size:7.5pt;letter-spacing:.42em;text-transform:uppercase;opacity:.9'>Voor ondernemers die niet wachten</div>
<div style='position:absolute;right:18mm;width:56mm;top:112mm;text-align:right;font-size:8.5pt;line-height:1.45;text-shadow:0 0 6px rgba(6,12,30,.9)'><div style='font-size:6.5pt;letter-spacing:.25em;text-transform:uppercase;color:#e8c46e;margin-bottom:1.5mm'>Het cijfer</div><div style='font-family:Ser;font-size:30pt;line-height:1;color:#e8c46e;margin-bottom:2mm'>13,8%</div>van de microbedrijven (2–10 medewerkers) gebruikt AI. Grootbedrijven: 66,2%. <i>Dit gat is jouw voorsprong.</i></div>
<div style='position:absolute;right:18mm;width:58mm;text-align:right;font-size:8.5pt;line-height:1.45;top:158mm;text-shadow:0 0 6px rgba(6,12,30,.9)'><div style='font-size:6.5pt;letter-spacing:.25em;text-transform:uppercase;color:#e8c46e;margin-bottom:1.5mm'>Exclusief</div><div style='font-family:Ser;font-size:20pt;line-height:1.05;color:#f7efdc;margin-bottom:2mm'>Het Kwartaalritueel</div>90 minuten. Vijf bewegingen. Jouw bedrijf, gewogen op het bewijs.</div>
<div style='position:absolute;left:18mm;top:96mm;width:26mm;height:26mm;border-radius:50%;background:#e8c46e;color:#0a1630;display:flex;align-items:center;justify-content:center;text-align:center;font-size:6pt;letter-spacing:.14em;text-transform:uppercase;font-weight:600;line-height:1.35;transform:rotate(8deg)'>Gratis<br>kennismaking<br>No. 04</div>
<div style='position:absolute;left:18mm;right:18mm;bottom:20mm'><div style='font-family:Ser;font-size:44pt;line-height:1;color:#f7efdc;max-width:150mm'>Wat iedereen wil,<br>maar bijna niemand <i style='color:#e8c46e'>durft.</i></div>
<div style='display:flex;justify-content:space-between;align-items:flex-end;margin-top:6mm;padding-top:4mm;border-top:.25mm solid rgba(232,196,110,.55);font-size:7pt;letter-spacing:.2em;text-transform:uppercase'><span style='color:#e8c46e'>Persoonlijk exemplaar &middot; Voor: <span class='fld' data-f='naam' style='width:52mm;background:rgba(232,196,110,.25);border-color:#e8c46e'></span></span><span>bedrijfsgeheugen.nl</span></div></div>
<div style='position:absolute;right:18mm;bottom:12.5mm;font-size:5pt;letter-spacing:.14em;text-transform:uppercase;opacity:.6'>Beeld: AI-gegenereerd</div>""",'dk',hd=False)

# ---- 2 welkom
pg(f"""<div class='k'>Welkom</div><h1>Een afspraak met <i>jezelf.</i></h1>
<p style='font-size:11.5pt;line-height:1.5;max-width:150mm'>Bijna iedere ondernemer wil weten wat AI voor zijn bedrijf kan doen. Bijna niemand heeft er een rustig moment voor. Dit magazine is daarom geen rapport. Het is een ritueel: negentig minuten per kwartaal, met koffie, een pen en eerlijke cijfers.</p>
<div class='q'>Het gat is geen techniek. Het gat is tijd, kennis en een eerste kleine stap.</div>
<p style='max-width:150mm'>Wij hebben openbare data uit Europa, Nederland en de wereld naast elkaar gelegd: Eurostat, CBS, UWV, Stanford, McKinsey, Verizon en de AI Act. Elk cijfer heeft een bron, een bewijsniveau en een label. Daarna hebben we de verbanden zelf doorgerekend en teruggebracht tot negen bouwblokken die je zonder voorkennis kunt lezen en dezelfde week nog kunt gebruiken.</p>
<div class='card' style='margin-top:5mm'><div class='tg'>Niet voor iedereen</div><p style='margin:0'>Dit magazine is gratis, maar niet voor iedereen: het is geschreven voor ondernemers die er echt een ochtend voor nemen. Elke editie nieuw, met een eigen analyse op Europese en Nederlandse data. Eén ondernemer, één exemplaar, negentig minuten.</p></div>
<h3 style='margin-top:6mm'>Zo lees je een bouwblok</h3>
<div class='g3' style='margin-top:2mm'>
<div class='ch' style='margin:0'><div class='ct'>1 &middot; Het cijfer</div><p class='mini'>Eén getal, met bron en jaar.</p></div>
<div class='ch' style='margin:0'><div class='ct'>2 &middot; Wat het betekent</div><p class='mini'>In gewone taal, plus het risico dat je moet kennen.</p></div>
<div class='ch' style='margin:0'><div class='ct'>3 &middot; Doe dit maandag</div><p class='mini'>Drie stappen die je kunt afvinken. Gereedschap erbij.</p></div></div>
<h3 style='margin-top:6mm'>Drie labels</h3>
<p class='mini'><span class='lab'>Feit</span>Gemeten, met bron. <span class='lab'>Verband</span>Gemeten, maar niet voor jouw soort bedrijf bewezen. <span class='lab'>Ons oordeel</span>Onze conclusie. Lees het verschil.</p>
<div style='position:absolute;left:17mm;right:17mm;bottom:20mm;font-size:8.5pt;color:var(--mut)'>Arthur &middot; Bedrijfsgeheugen &middot; 18 november 2026<br>Naam van jouw bedrijf: <span class='fld' data-f='bedrijf' style='width:80mm'></span></div>""")
# ---- 3 ritueel + inhoud
pg(f"""<div class='k'>Het Kwartaalritueel</div><h1>Negentig minuten. <i>Vijf bewegingen.</i></h1>
<p style='max-width:150mm'>Plan één ochtend per kwartaal. Telefoon weg, deur dicht. Loop de vijf bewegingen door, in deze volgorde. Elke beweging heeft bouwblokken in dit magazine en een plek in het werkblad op pagina 17.</p>
<div class='mv'><div class='m'>I<small>10 min</small></div><div><b>Kijk</b> &middot; Waar sta je in de kloof?<br><span class='mini'>Bouwblok 01 &middot; pagina 8</span></div></div>
<div class='mv'><div class='m'>II<small>15 min</small></div><div><b>Kies</b> &middot; Eén taak, één drempel.<br><span class='mini'>Bouwblokken 02 en 03 &middot; pagina 9 en 10</span></div></div>
<div class='mv'><div class='m'>III<small>25 min</small></div><div><b>Regel</b> &middot; Team, wet en veiligheid.<br><span class='mini'>Bouwblokken 04, 05 en 06 &middot; pagina 11 tot 13</span></div></div>
<div class='mv'><div class='m'>IV<small>30 min</small></div><div><b>Bouw</b> &middot; Bouw eerst een AI, in plaats van weer een Excel.<br><span class='mini'>Bouwblokken 07 en 08 &middot; pagina 14 en 15</span></div></div>
<div class='mv'><div class='m'>V<small>10 min</small></div><div><b>Meet</b> &middot; Eén getal, over 90 dagen terug.<br><span class='mini'>Bouwblok 09 &middot; pagina 16</span></div></div>
<div class='card' style='margin-top:6mm'><div class='tg'>Maak er een moment van &middot; Voor jezelf</div><h4>Dit uur is van jou.</h4>
<p>Een ondernemer die zijn kwartaal plant, doet iets wat niemand anders voor hem doet. Behandel het als een afspraak met je beste klant.</p>
<div class='g2' style='gap:4mm;margin-top:2mm'><div><p class='mini'><b>Plek.</b> Kies een plek waar je zelden werkt: een café, de tuin, de bank.<br><b>Drinken.</b> Koffie, thee, wat jij lekker vindt.<br><b>Stilte.</b> Telefoon op vliegtuigstand, mail dicht.</p></div>
<div><p class='mini'><b>Pen.</b> Schrijf met de hand; dat vertraagt en dwingt keuzes af.<br><b>Einde.</b> Sluit af met één zin: wat ik dit kwartaal anders ga doen.<br><b>Beloning.</b> Plan er iets prettigs achteraan.</p></div></div>
<div class='g2' style='gap:4mm;margin-top:3mm'><div><p class='mini' style='margin:0'>Mijn ritueel-datum</p><span class='fb' data-f='r_datum' style='height:8mm'></span></div><div><p class='mini' style='margin:0'>Mijn plek</p><span class='fb' data-f='r_plek' style='height:8mm'></span></div></div></div>
<div class='mv' style='border-bottom:.3mm solid var(--ink)'><div class='m'>&#8734;<small>vooraf</small></div><div class='mini'>Werkblad pagina 17, jouw plan pagina 18, bronnen pagina 19, besluitkaart pagina 23 en 24, jouw moment pagina 25. Op de laatste pagina vind je een maand gratis hulp bij het ritueel.</div></div>""")
# ---- 4 kloof in een blik
pg(f"""<div class='k'>De kloof in één blik</div><h1 style='font-size:34pt'>Nederland loopt voor. <i>Het mkb niet.</i></h1>
<p style='max-width:150mm'>Eén op de vijf Europese bedrijven met 10 of meer medewerkers gebruikt AI. Nederland staat zesde. Hoe kleiner het bedrijf, hoe groter de kloof.</p>
<div class='g2'><div>{chart('Europa, 2025 &middot; bedrijven 10+ &middot; % met AI',[('Denemarken',42.0),('Finland',37.8),('Zweden',35.0),('België',34.5),('Luxemburg',33.6),('Nederland',33.2,True),('EU-gemiddelde',20.0,True),('Roemenië',5.2)],mx=45)}</div>
<div>{chart('EU naar omvang, 2025 &middot; % met AI',[('Klein (10–49)',17.0),('Middelgroot (50–249)',30.4),('Groot (250+)',55.0,True)],mx=60)}
{chart('EU door de tijd &middot; % met AI',[('2023',8.1),('2024',13.5),('2025',20.0,True)],mx=45)}</div></div>
<div class='ch'><div class='ct'>Nederland (CBS), 2025 &middot; % met AI, ander bereik: 2+ medewerkers</div>{bar('Microbedrijven (2–10)',13.8,mx=70)}{bar('Mkb (10–250)',29.8,mx=70)}{bar('Grootbedrijf',66.2,mx=70,h=True)}</div>
<div class='g2'><div><h3>Let op</h3><p class='mini'>Eurostat meet bedrijven met 10+ medewerkers, het CBS ook microbedrijven. Niet één op één vergelijkbaar.</p></div><div><h3>Ons oordeel</h3><p class='mini'>De snelste groei zit bij tekst en administratie. Wie nu begint, loopt niet achter, maar voorop in zijn eigen straat.</p></div></div>
<div class='ft'><span class='lab'>Feit</span>Eurostat KS-01-26-009 (2026), Eurostat nieuws 11-12-2025, CBS via ICTMagazine 16-3-2026.</div>""")

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
{node(88,46,32,'AI per land',True)}
{node(28,14,50,'AI bij kleine bedrijven')}{node(28,46,50,'AI bij grote bedrijven')}{node(28,78,50,'Groot, gegeven klein')}
{node(148,14,50,'Verhouding klein/groot')}{node(148,46,50,'Mix van doelen')}{node(148,78,50,'Privégebruik gen-AI')}
<text x="88" y="93" font-size="2.7" font-family="Inst" fill="#5b6478" text-anchor="middle">Dikke lijn: sterk en significant. Streeplijn: niet aantoonbaar (n.s.). 27 EU-landen, Eurostat 2025; privégebruik n=15.</text></svg>'''
pg(f"""<div class='k'>Eigen analyse &middot; Bedrijfsgeheugen</div><h1 style='font-size:34pt'>Wat hangt waarmee <i>samen?</i></h1>
<p style='max-width:155mm'>De meeste rapporten tellen en rangschikken. Wij hebben de Eurostat-cijfers van 27 landen en de CBS-cijfers van 12 sectoren op afhankelijkheden getoetst, met betrouwbaarheidsintervallen. Dit is wat overeind bleef, en wat niet.</p>
<div class='ch' style='padding:3mm 3mm 1mm'>{svg}</div>
<div class='l8'>
<div class='card'><div class='tg'>Bevinding 1 &middot; Ons oordeel</div><h4>Het begint bij de kleinste.</h4><p>Landen met veel AI zijn landen waar <b>kleine</b> bedrijven meedoen: 28,9% tegen 8,1% in de onderste negen (3,6 keer). Bij grote bedrijven is dat verschil 1,8 keer. Let op: dit is deels rekenkundig, omdat kleine bedrijven zwaar wegen in het totaal.</p></div>
<div class='card'><div class='tg'>Bevinding 2 &middot; Feit</div><h4>Leiders sluiten de rij.</h4><p>In de top negen halen kleine bedrijven gemiddeld 43% van het niveau van grote bedrijven. In de onderste negen is dat 22% (ρ = 0,89, interval 0,74 tot 0,95). Dit is niet rekenkundig.</p></div>
<div class='card'><div class='tg'>Bevinding 3 &middot; Feit</div><h4>Wat je doet, telt niet. Dát je begint wel.</h4><p>De mix van doelen (administratie, marketing, productie) hangt in geen enkele toets samen met het niveau (alle p &gt; 0,1).</p></div>
<div class='card'><div class='tg'>Bevinding 4 &middot; Feit</div><h4>Geen inhaalslag.</h4><p>Achterblijvers groeien niet harder, in verhouding (ρ = −0,12, p = 0,56). Dus het gat in procentpunten wordt groter: 14,4 naar 19,0 voor dezelfde landen.</p></div></div>
<div class='ft'><span class='lab'>Eigen analyse</span>Spearman-rangcorrelatie met bootstrap (5.000 trekkingen). Correlatie is geen oorzaak. Bron: Eurostat KS-01-26-009; eigen berekening, zie pagina 6.</div>""")
# ---- analyse 2: bewijs
import sqlite3 as _sq
_c=_sq.connect(SC+'groot/ai_mkb.db')
def _r(n):
    r=_c.execute("select value,ci_low,ci_high,n,note from analysis_results where name like ? order by id desc limit 1",(n+'%',)).fetchone();return r
def _row(lbl,n,read,p=None):
    v,lo,hi,nn,note=_r(n)
    ci=f"{lo:.2f} tot {hi:.2f}".replace('.',',') if lo is not None else '—'
    return f"<tr><td>{lbl}</td><td>{nn}</td><td><b>{v:.2f}</b></td><td>{ci}</td><td>{p or ''}</td><td>{read}</td></tr>".replace('.',',') if False else f"<tr><td>{lbl}</td><td>{nn}</td><td><b>{(('%.3f' if abs(v)>0.99 else '%.2f')%v).replace('.',',')}</b></td><td>{ci}</td><td>{p or ''}</td><td>{read}</td></tr>"

def forest():
    items=[('Totaal ~ klein','totaal vs small'),('Totaal ~ groot','totaal vs large'),('Groot, gegeven klein','partieel T~groot | klein'),('Klein/groot-verhouding','totaal vs ratio klein/groot'),('Aandeel marketing','totaal vs aandeel marketing/verkoop'),('Aandeel administratie','totaal vs aandeel administratie/management'),('Groei pp ~ niveau','groei 2024-25 (pp) vs niveau 2024'),('Relatieve groei ~ niveau','relatieve groei vs niveau 2024'),('Privégebruik gen-AI','bedrijfsadoptie vs individueel'),('Sector: groei ~ niveau','sector: groei 2023-25 (pp) vs niveau 2023')]
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
_row('Totaal ~ klein (landen)','totaal vs small','Sterk; deels rekenkundig','&lt; 0,001'),
_row('Totaal ~ groot (landen)','totaal vs large','Sterk, maar zwakker dan klein','&lt; 0,001'),
_row('Totaal ~ groot, gegeven klein','partieel T~groot | klein (Spearman)','Interval omvat 0: geen eigen rol aantoonbaar','n.s.'),
_row('Totaal ~ klein/groot-verhouding','totaal vs ratio klein/groot','Sterk, niet rekenkundig','&lt; 0,001'),
_row('Totaal ~ aandeel marketing','totaal vs aandeel marketing/verkoop','Geen verband','0,49'),
_row('Totaal ~ aandeel administratie','totaal vs aandeel administratie/management','Geen verband','0,44'),
_row('Groei (pp) ~ niveau 2024','groei 2024-25 (pp) vs niveau 2024','Wie hoog staat, wint meer pp','0,0005'),
_row('Relatieve groei ~ niveau 2024','relatieve groei vs niveau 2024','Geen inhaalslag','0,56'),
_row('Bedrijven ~ privégebruik gen-AI','bedrijfsadoptie vs individueel gen-AI-gebruik','Geen verband (n klein)','0,52'),
_row('Sectoren: niveau 2025 ~ 2023','sector: niveau 2025 vs niveau 2023','Rangorde blijft staan','0,0002'),
_row('Sectoren: groei ~ niveau 2023','sector: groei 2023-25 (pp) vs niveau 2023','Wie hoog staat, groeit meer','0,004')])
pg(f"""<div class='k'>Eigen analyse &middot; Het bewijs</div><h2>Zo sterk is wat we <i>vonden</i></h2>
<table><tr><th>Verband</th><th>n</th><th style='text-transform:none'>rho</th><th>95%-interval</th><th>p</th><th>Lees als</th></tr>{rows}</table>
<div class='g2' style='margin-top:6mm'><div><h3>Methode</h3><p class='mini'>Rangcorrelatie (Spearman), betrouwbaarheidsinterval via 5.000 bootstrap-trekkingen. Landen: 27 EU-lidstaten, bedrijven met 10+ medewerkers, 2025 (Eurostat). Sectoren: 12 CBS-sectoren, 2+ medewerkers, 2023–2025. Privégebruik: 15 landen met Microsoft-data.</p></div>
<div><h3>Wat dit niet is</h3><p class='mini'>Geen oorzaak-en-gevolg. Een kleine n maakt intervallen breed. &ldquo;Niet significant&rdquo; betekent niet &ldquo;geen verband&rdquo;, maar: niet aantoonbaar met deze data. Eurostat en CBS meten andere groepen, dus we hebben ze niet gemengd.</p></div></div>
<h3 style='margin-top:6mm'>Zo zeker zijn we: correlatie met 95%-interval</h3><div class='ch' style='margin:1mm 0 0;padding:3mm 3mm 1mm'>{forest()}</div><p class='mini' style='color:var(--mut);margin-top:1mm'>Goud: interval ligt los van nul. Grijs: aantoonbaar verband ontbreekt.</p><div class='note' style='margin-top:4mm'>Wij beweren niet dat dit nog nooit iemand zag. Wij laten zien <b>hoe zeker</b> we zijn. Dat is het verschil.</div>
<div class='ft'><span class='lab'>Eigen analyse</span>Alle berekeningen en ruwe cijfers staan in de database bij het magazine (tabellen country_ai, sector_ai, analysis_results).<br>Bron: Eurostat KS-01-26-009, CBS (sectoren), eigen berekening Bedrijfsgeheugen, november 2026.</div>""")
# ---- acht lenzen
def lens(t,n,txt,imp,lab,src):
    return f"<div class='card'><div class='tg'>{t} &middot; {lab}</div><div class='n'>{n}</div><p>{txt}</p><p><b>Voor jou:</b> {imp}</p><div class='tg' style='margin-top:1mm;text-transform:none;letter-spacing:.02em;font-weight:400'>{src}</div></div>"
L=[lens('Psychologie','75,4%','van de Nederlanders (18+) verwacht dat bepaalde banen verdwijnen. Slechts 18% weet dat AI anders redeneert dan een mens.','angst en onwetendheid zijn teamthema&rsquo;s. Praat erover voordat je tools uitrolt.','Feit / indicatie','CBS 2025; Conclusion, 1.000 Nederlanders, 2026'),
lens('Strategie','6%','van de (grote) organisaties haalt minstens 5% van de winst uit AI. De winnaars veranderen hun werk, niet alleen hun gereedschap.','kies één proces en ontwerp het opnieuw, in plaats van tien tools uit te proberen.','Feit','McKinsey 2026 (via The Register)'),
lens('Wetgeving','dec 2027','nieuwe datum voor hoog-risico AI. AI-geletterdheid blijft nu al gelden: ondersteunen in plaats van garanderen.','leg je AI-gebruik vast en leer je mensen ermee werken.','Feit','Verordening (EU) 2026/1744'),
lens('Arbeidsmarkt','64%','van de Nederlandse bedrijven heeft vacatures die ze niet vervuld krijgen. Circa 30% daarvan kiest automatisering als belangrijkste antwoord.','kleine bedrijven (5–50) kiezen vooral voor aantrekkelijk werkgeverschap. Automatisering vult dat aan, het vervangt het niet.','Verband','CBS via NL Times, juni 2026'),
lens('Politiek','6 nov','2026: het kabinet stelt de visie &ldquo;Kiezen voor AI voor iedereen&rdquo; vast. Drempels voor het mkb moeten weg, begeleid experimenteren wordt mogelijk. Bedragen noemt het bericht niet.','volg de uitwerking van AI-infrastructuur begin 2027. Reken nog niet op geld.','Feit','Rijksoverheid, 6-11-2026'),
lens('Energie','±10%','van de piekvraag naar stroom kan in Nederland naar datacentra gaan als alle geplande projecten worden gebouwd. Amsterdam pauzeerde nieuwe projecten door netschaarste.','AI draait in andermans datacentra. Vraag waar je data staat en wat een prijsstijging voor je abonnement betekent.','Verband (scenario)','IEA, november 2025'),
lens('Technologie','13×','per jaar daalt de prijs voor dezelfde AI-prestaties. Maar de rekenkracht groeit 3,3 keer per jaar, en stroom en chips blijven schaars.','kies geen aanbieder voor drie jaar. Houd je gegevens overdraagbaar.','Verband','Epoch AI; Stanford AI Index 2026'),
lens('Processen','39,3%','van de Nederlandse bedrijven met AI zet het in voor administratie en bedrijfsvoering, het vaakst. Daarna marketing en verkoop (37,2%).','begin bij het proces met de meeste herhaling en de minste glamour.','Feit','Eurostat KS-01-26-009')]
pg(f"""<div class='k'>Acht lenzen</div><h2>Dezelfde kloof, <i>acht kanten</i></h2>
<p class='mini' style='max-width:155mm'>Een kloof heeft geen enkele oorzaak. Daarom keken we naar psychologie, strategie, wetgeving, arbeidsmarkt, politiek, energie, techniek en processen. Per lens één getal en wat het voor jou betekent.</p>
<div class='l8' style='margin-top:3mm'>{''.join(L)}</div>
<div class='ft'>Elke lens staat in de database met bron en bewijsniveau. Secundaire bronnen en leveranciersonderzoek zijn als indicatie benoemd. Geen juridisch of financieel advies.</div>""")

block('I · Kijk','Waar sta jij <i>in de kloof?</i>','13,8%','van de microbedrijven (2–10 medewerkers) gebruikte in 2025 AI. Mkb (10–250): 29,8%. Grootbedrijf: 66,2%.',
 chart('Nederland (CBS), 2025',[('Micro',13.8),('Mkb',29.8),('Groot',66.2,True)],mx=70)+chart('EU (Eurostat), 2025, 10+ medewerkers',[('Klein',17.0),('Middelgroot',30.4),('Groot',55.0,True)],mx=70),
 'Hoe kleiner het bedrijf, hoe minder AI. Dat betekent ook: meer dan acht op de tien microbedrijven kijkt nog toe. Een kleine stap is al een voorsprong.',
 'Het gemiddelde zegt niets over jouw branche. Vergelijk met bedrijven die op jou lijken, niet met grootbedrijven.',
 ['Noteer je teamgrootte en zoek jouw rij in de grafiek.','Schrijf de drie taken op die je vorige week het meeste tijd kostten.','Zet een kruisje bij elke taak waar al AI of automatisering aan zit.'],
 'de Zelftest uit het rapport &ldquo;De AI-kloof in het mkb&rdquo; of een Frisse Blik-gesprek.','Feit','CBS (via ICTMagazine, 16-3-2026), Eurostat KS-01-26-009.','CBS en Eurostat gebruiken andere bedrijfsgroottes. Niet vergelijken, wel lezen. ')
block('II · Kies','Begin waar het <i>saaiste werk</i> zit','39,3%','van de Nederlandse AI-gebruikende bedrijven (10+) zet AI in voor administratie en bedrijfsvoering, het vaakst. Marketing en verkoop: 37,2%.',
 chart('Doelen van AI, Nederland 2025 (% van AI-gebruikers, 10+)',[('Administratie en bedrijfsvoering',39.3,True),('Marketing en verkoop',37.2),('ICT-beveiliging',19.9)],mx=45)+chart('Microbedrijven met AI (CBS), 2025',[('Marketing en verkoop',32.7),('Administratie en bestuur',25.9)],mx=45),
 'Wie slim begint, kiest herhaalbaar werk met tekst en cijfers: offertes, e-mails, facturen, verslagen. Dat is geen toeval, het is de plek waar AI het minste kost en het snelst helpt.',
 'Het Nederlandse cijfer voor marketing heeft een reeksbreuk in de Eurostat-reeks. Lees het als richting, niet als exact.',
 ['Kies één herhalende taak die meer dan twee uur per week kost.','Schrijf het gewenste resultaat in één zin, bijvoorbeeld: &ldquo;een offerte-concept in tien minuten&rdquo;.','Bepaal wie het resultaat controleert voordat het de deur uitgaat.'],
 'begin met de assistent in je bestaande mail- of boekhoudpakket, voordat je iets nieuws koopt.','Feit','Eurostat KS-01-26-009; CBS (via ICTMagazine).','Percentages zijn aandeel van de bedrijven die AI gebruiken. ')
block('II · Kies','Wat houdt je tegen? <i>Iedereen hetzelfde.</i>','70,3%','van de bedrijven die AI overwogen noemt gebrek aan kennis als belemmering (EU, 10+, 2025). Kosten: 38,4%.',
 chart('Barrières (% van bedrijven die AI overwogen), EU 2025',[('Gebrek aan kennis',70.3,True),('Onduidelijke wet en regels',53.6),('Privacy en gegevens',52.7),('Datakwaliteit',43.5),('Past niet bij systemen',41.6),('Kosten te hoog',38.4),('Ethische bezwaren',24.6)],mx=75),
 'Het eerste obstakel is kennis, niet geld. En kennis los je op met een uur per week, niet met een groot budget. Van de bedrijven die nog geen AI gebruiken had 14,2% het overwogen.',
 'Wie wacht tot het &ldquo;duidelijk&rdquo; wordt, wacht op een ander. Onduidelijkheid over regels is voor een deel opgelost: zie bouwblok 05.',
 ['Omcirkel je twee grootste barrières uit de lijst hierboven.','Schrijf per barrière één actie van maximaal dertig minuten.','Plan die dertig minuten nu in je agenda, deze week.'],
 'één leerbron per barrière: een uur les, een collega die voorloopt, of een korte begeleiding.','Feit','Eurostat KS-01-26-009 (2026).','Alleen bedrijven die AI hebben overwogen zijn gevraagd naar belemmeringen. ')
block('III · Regel','Je team gebruikt het <i>al.</i>','42,9%','van de werkenden in Nederland gebruikte in 2025 AI voor werk. Hbo/wo: 55,5%. Basis/vmbo/mbo1: 19,7%.',
 chart('AI-gebruik voor werk, Nederland 2025 (% werkenden)',[('Alle werkenden',42.9),('Hbo / wo',55.5,True),('Havo / vwo / mbo 2–4',32.0),('Basis / vmbo / mbo1',19.7)],mx=60)+chart('Werkgevers die AI gebruiken en begeleiding bieden (UWV, najaar 2025, 3.551 werkgevers)',[('Zes op de tien',60.0,True)],mx=100,note='UWV spreekt van &ldquo;slechts zes op de tien&rdquo;.'),
 'Het gebruik is er al, de begeleiding blijft achter. Wie geen regels geeft, krijgt toch AI in de organisatie, alleen zonder afspraken. Opleiding bepaalt wie profiteert.',
 'Schaduw-AI: medewerkers plakken bedrijfsgegevens in een privéaccount. Zie bouwblok 06.',
 ['Vraag je team anoniem welke AI ze nu al gebruiken, en waarvoor.','Spreek drie regels af: wat wel en wat nooit in een AI mag.','Plan één uur leren per persoon dit kwartaal.'],
 'SLIM MKB, subsidie voor leren en ontwikkelen. De tijdvakken van 2026 zijn gesloten (7 april tot 4 mei, 19 augustus tot 7 september). Volg de aankondiging voor het volgende tijdvak.','Feit','CBS longread AI in de samenleving (25-2-2026); UWV (maart 2026); Rijksoverheid (31-3-2026).','SLIM is niet AI-specifiek. ')
block('III · Regel','De wet is verschoven, <i>niet verdwenen</i>','2027','is het nieuwe jaar voor hoog-risico AI (Bijlage III): 2 december 2027, eerder 2 augustus 2026. Verordening (EU) 2026/1744, van kracht sinds 27 juli 2026.',
 f"""<div class='ch'><div class='ct'>Tijdlijn AI Act, wat er nu geldt</div><div class='tl'><div><b>feb 2025</b>verboden praktijken en AI-geletterdheid</div><div><b>aug 2025</b>regels voor AI-modellen (GPAI)</div><div><b>aug 2026</b>transparantie: laat zien dat het AI is</div><div><b>dec 2026</b>watermerk voor bestaande systemen</div><div><b>dec 2027</b>hoog-risico (Bijlage III)</div><div><b>aug 2028</b>hoog-risico (Bijlage I)</div></div></div>""",
 'Voor de meeste mkb&rsquo;ers telt nu vooral twee dingen: ondersteun je mensen in het leren omgaan met AI (artikel 4, nu &ldquo;ondersteunen&rdquo; in plaats van &ldquo;garanderen&rdquo;) en wees open als iets door AI is gemaakt.',
 'Dit is geen juridisch advies. Of jouw toepassing hoog-risico is, hangt af van het gebruik. Vraag het bij twijfel aan een jurist.',
 ['Maak een lijst van alle AI-tools die je bedrijf gebruikt.','Noteer per tool wie het gebruikt en waarvoor, en of klanten er iets van merken.','Spreek af dat AI-gemaakte content als zodanig wordt benoemd.'],
 'een eenvoudig AI-register: tool, gebruiker, doel, datum. Een spreadsheet volstaat.','Feit','White &amp; Case, EU AI Omnibus enters into force (juli 2026); Gibson Dunn (27-5-2026).','Juridische samenvattingen, geen wettekst. ')
block('III · Regel','De zwakste schakel <i>draagt een badge</i>','67%','van de AI-gebruikers opent AI-diensten via niet-zakelijke accounts op werkapparaten (Verizon DBIR 2026, alle organisaties).',
 chart('Verizon DBIR 2026 (alle organisaties, geen mkb-uitsplitsing)',[('AI via privéaccount op werkapparaat',67.0,True),('Mens betrokken bij inbreuk',62.0),('Derden betrokken bij inbreuk (was 30%)',48.0),('Medewerkers gebruiken AI-tools (verdrievoudigd)',45.0)],mx=75),
 'AI-gebruik groeit sneller dan afspraken. Het risico zit zelden in de techniek en vaak in een plakactie: klantgegevens in een privéaccount.',
 'De cijfers gelden voor alle organisaties, niet specifiek voor het mkb. Lees ze als richting.',
 ['Zet tweestapsverificatie aan op mail, boekhouding en AI-accounts.','Regel één zakelijk AI-account voor het team in plaats van privéaccounts.','Zet een wachtwoordmanager neer en laat elke medewerker het gebruiken.'],
 'een zakelijk teamaccount bij je AI-aanbieder met de instelling dat gegevens niet voor training worden gebruikt.','Verband','Verizon DBIR 2026 (via Cyber Readiness Institute).','Secundaire samenvatting van het DBIR. ')
block('IV · Bouw','Klanten willen een mens, <i>en snelheid</i>','7%','kiest AI boven een mens bij klantenservice. Maar als de mens lang laat wachten, kiest 44% voor AI.',
 chart('Consumenten over AI-klantenservice (1.083 consumenten, 8 landen, 2026)',[('Kiest AI boven mens',7.0),('Kiest AI als de mens lang wacht',44.0,True),('Vertrouwt AI niet met complexe zaken',24.0)],mx=50),
 'AI is geen vervanging van de mens, maar van de wachttijd. Laat AI de simpele vragen en het eerste concept doen, en houd de mens voor het vertrouwen.',
 'Dit is onderzoek van een leverancier van klantenservice-software. Neem het als indicatie, niet als meting van de markt.',
 ['Schrijf je tien meest gestelde klantvragen op.','Laat een AI per vraag een antwoordconcept maken. Jij leest en verstuurt.','Zet in elk bericht dat de klant altijd een mens kan vragen.'],
 'eerst een AI bouwen in plaats van een Excel: een vaste assistent met jouw antwoorden, bijvoorbeeld in je eigen kennisbank.','Verband','Lorikeet consumentenonderzoek (11-5-2026), leveranciersonderzoek.','Bewijsniveau C. ')
block('IV · Bouw','Het wordt goedkoper. <i>Je rekening niet vanzelf.</i>','13×','per jaar daalt de marktprijs voor dezelfde AI-prestaties (Epoch AI). MIT komt op 5 tot 10 keer per jaar.',
 chart('Eén vraag aan een AI, zelfde score (Epoch AI)',[('Begin 2025 (OpenAI o3), dollarcent',30.0,True),('±18 maanden later, dollarcent',0.04)],mx=32,u=' ct',dec=2),
 'Wachten op goedkoper loont minder dan leren. Maar de beste modellen kunnen per vraag duurder worden, omdat ze meer rekenen. En 20% van de grote organisaties zegt dat de kosten hun gebruik beperken.',
 'Prijzen bij een vaste score dalen, niet automatisch je totale rekening. Meer gebruik betekent een hogere factuur.',
 ['Stel een maandbudget in voor AI, hoe klein ook.','Schrijf op wat één taak nu kost in tijd én in abonnement.','Kies het kleinste model dat de taak nog goed doet.'],
 'een abonnement met vaste prijs per gebruiker is voor kleine teams voorspelbaarder dan betalen per gebruik.','Verband','Epoch AI en MIT (via The Decoder, 2026); McKinsey State of AI 2026 (via The Register).','Epoch noemt de meting ruw. ')
block('V · Meet','Gebruik is geen <i>resultaat</i>','6%','van de (grote) organisaties haalt minstens 5% van de winst uit AI. Terwijl 80% van de AI-gebruikers zich productiever voelt.',
 chart('McKinsey State of AI 2026 (1.719 respondenten, vooral grote organisaties)',[('AI-gebruikers voelen zich productiever',80.0),('Organisaties met enig effect op winst',37.0),('Organisaties met minstens 5% winstbijdrage',6.0,True)],mx=90),
 'Persoonlijke winst wordt pas bedrijfswinst als het werk verandert. In studies (Stanford AI Index 2026) ligt de winst bij klantenservice rond 14–15% en bij software op 26%. Of dat voor jou geldt, is ons oordeel, geen meting.',
 'Zelfrapportage en grote organisaties. Voor het mkb zijn geen vergelijkbare cijfers.',
 ['Kies vooraf één getal: uren per offerte, doorlooptijd, of aantal fouten.','Meet dat getal nu, twee weken lang.','Meet het opnieuw na negentig dagen en schrijf op wat er is veranderd.'],
 'een simpel meetblad: taak, baseline, nulmeting na 90 dagen. Je plan op pagina 18 heeft de velden al.','Ons oordeel','McKinsey (via The Register, 25-8-2026); Stanford AI Index 2026 (via UNU-C3).','Secundaire samenvattingen. ')

# ---- 14 werkblad
mvs=[('I','Kijk','10 min','Waar sta ik? Mijn teamgrootte en mijn drie tijdvreters.'),('II','Kies','15 min','De ene taak en de drempel die ik wegneem.'),('III','Regel','25 min','Drie teamregels, mijn AI-register, mijn beveiligingsstap.'),('IV','Bouw','30 min','Mijn eerste AI-assistent: voor welke vraag, met wiens antwoorden.'),('V','Meet','10 min','Mijn ene getal, nu en over 90 dagen.')]
w=''.join(f"<div class='mv'><div class='m'>{r}<small>{t}</small></div><div><b>{n}</b> &middot; <span class='mini'>{d}</span><span class='fb' style='margin-top:1.5mm' data-f='w{i+1}'></span></div></div>" for i,(r,n,t,d) in enumerate(mvs))
pg(f"""<div class='k'>Werkblad</div><h1>Jouw <i>negentig minuten.</i></h1><p class='mini' style='max-width:150mm'>Vul in dit PDF-bestand rechtstreeks in. Sla het op en bewaar het bij je kwartaalplanning.</p>{w}
<div class='ft'>Tip: begin met het bouwblok dat het meest schuurt. Je hoeft niet alles dit kwartaal.</div>""")
# ---- 15 plan
pg(f"""<div class='k'>Jouw plan</div><h1>Eén taak. <i>Eén getal.</i> Negentig dagen.</h1>
<div class='g2' style='margin-top:6mm'><div><h3>De taak</h3><span class='fb' data-f='p_taak'></span><h3 style='margin-top:4mm'>Eigenaar</h3><span class='fb' data-f='p_eigenaar'></span><h3 style='margin-top:4mm'>Startdatum</h3><span class='fb' data-f='p_start'></span></div>
<div><h3>Mijn getal (nu)</h3><span class='fb' data-f='p_nu'></span><h3 style='margin-top:4mm'>Doel over 90 dagen</h3><span class='fb' data-f='p_doel'></span><h3 style='margin-top:4mm'>Volgend ritueel (datum)</h3><span class='fb' data-f='p_volgend'></span></div></div>
<h3 style='margin-top:6mm'>De drempel die ik wegneem</h3><span class='fb' data-f='p_drempel' style='height:18mm'></span>
<h3 style='margin-top:3mm'>Wat ik niet meer doe</h3><span class='fb' data-f='p_stop' style='height:18mm'></span>
<div class='q' style='margin-top:8mm'>Wie elk kwartaal negentig minuten neemt, loopt na een jaar vier stappen voor op wie wacht.</div>
<div style='margin-top:6mm;font-size:8.5pt'><span class='cbx' data-f='p_akkoord' style='border-color:var(--ink)'></span> Ik heb dit plan gemaakt en zet het in mijn agenda.</div>""")
# ---- 16 verantwoording
import sqlite3
c=sqlite3.connect(SC+'groot/ai_mkb.db')
rows=c.execute("select id,publisher,name,published,tier,caveat from sources where id like 'M%' order by id").fetchall()
_cut=lambda t,n:(t if len(t)<=n else t[:n-1].rsplit(' ',1)[0]+'…')
tr=''.join(f"<tr><td>{_cut(r[1],26)}</td><td>{_cut(r[2],62)}<br><span style='color:var(--mut)'>{r[3]}</span></td><td><b>{r[4]}</b></td><td>{_cut(r[5],70)}</td></tr>" for r in rows)
pg(f"""<div class='k'>Verantwoording</div><h2>Bronnen en <i>bewijs</i></h2>
<p class='mini'>Niveau A: officiële statistiek of wet. B: samenvatting of onderzoek met open methode. C: leveranciersonderzoek, indicatief. We hebben bij elk cijfer de populatie en de beperking genoteerd.</p>
<table style='font-size:6.4pt;line-height:1.22'><tr><th>Bron</th><th>Titel</th><th>Niveau</th><th>Let op</th></tr>{tr}</table>
<p class='mini' style='margin-top:2mm;font-size:6.6pt;line-height:1.3'>Niet gebruikt: cijfers die we niet bij de primaire bron konden terugvinden. Beeld op de voorkant: AI-gegenereerd. Geen juridisch of financieel advies.</p>""")
# ---- datalab: wie meet wat
pg(f"""<div class='k'>Eigen analyse &middot; Meetverschil</div><h1 style='font-size:32pt'>Hoeveel Nederlandse bedrijven gebruiken AI? <i>Dat hangt af van wie telt.</i></h1>
<p style='max-width:160mm'>Dezelfde vraag, acht antwoorden tussen 14% en 70%. Geen enkel getal is fout: ze meten andere bedrijven, andere vragen en andere mensen. Wie ze door elkaar haalt, trekt de verkeerde conclusie.</p>
{chart('AI-gebruik in Nederland, acht metingen (2025-2026)',[('CBS micro (2-10 wp)',13.8),('CBS alle bedrijven (2+)',17.0),('CBS mkb (10-250 wp)',29.8),('CBS/Eurostat bedrijven 10+',33.2),('Werkenden die AI voor werk gebruiken (CBS)',42.9),('Personen 15-64, gen-AI (Microsoft)',43.5),('Grootbedrijf (250+, CBS)',66.2),('Mkb zegt AI te gebruiken (Exact, zelfrapportage)',70.0)],note='Rijen: bedrijfsstatistiek (CBS, Eurostat), persoonsmetingen (CBS, Microsoft) en een zelfrapportage-enquête (Exact). Niet optellen of gelijkstellen.')}
<div class='l8'>
<div class='card'><div class='tg'>Regel 1 &middot; Feit</div><h4>Tel je mee vanaf twee of tien?</h4><p>CBS 2+ geeft 17%, 10+ geeft 33,2%. Het verschil zit in de allerkleinste bedrijven, niet in de techniek.</p></div>
<div class='card'><div class='tg'>Regel 2 &middot; Feit</div><h4>Gebruik je, of zeg je dat?</h4><p>De Exact-barometer meldt 70% in 2026, na 33% en 6% eerder. Dat is zelfrapportage onder klanten van een boekhoudpakket. Statistiek en enquête zijn geen reeks.</p></div>
<div class='card'><div class='tg'>Regel 3 &middot; Feit</div><h4>Mensen zijn geen bedrijven.</h4><p>42,9% van de werkenden gebruikt AI voor werk (CBS 2025), terwijl 29,8% van de mkb-bedrijven dat officieel doet. Je team loopt voor op je bedrijf.</p></div>
<div class='card'><div class='tg'>Ons oordeel</div><h4>Vergelijk alleen binnen één meting.</h4><p>Voor jouw eigen trend: kies één definitie en meet die elk kwartaal. Daarom bewaren we vanaf nu elke reeks met definitie en populatie.</p></div></div>
<div class='ft'><span class='lab'>Eigen analyse</span>Bronnen: CBS (S02, M02, M22), Eurostat (M12), Microsoft (S11), Exact (S04). Populatie en definitie per getal in de trendbank (pagina 21).</div>""")
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
pg(f"""<div class='k'>Trendbank &middot; Editie 2026-Q4</div><h1 style='font-size:32pt'>Wat we nu vastleggen, <i>vergelijken we straks.</i></h1>
<p style='max-width:160mm'>Elke editie leggen we de meetpunten met definitie, populatie en bron vast. Zo kan No. 05 laten zien wat er verschoven is, niet alleen waar we staan. Hieronder de handgekozen kern: <b>{_n[0]} meetpunten in {_n[1]} reeksen</b> (CSV en JSON). Daarnaast staat op pagina 22 de Atlas met de volledige corpus.</p>
<div class='l8'>
<div class='card'><div class='tg'>Nieuw &middot; Feit</div><h4>Automatiseren tegen personeelstekort: 24,7% naar 29,7%.</h4><p>64% van de bedrijven heeft personeelstekort (CBS, april 2026). Grootbedrijf kiest er het vaakst voor (40,4%), kleinbedrijf het minst (20,1%). Informatie en communicatie: 28,5% naar 44,1%. Nog steeds geen meting van AI-gebruik zelf: automatisering omvat ook robotisering.</p></div>
<div class='card'><div class='tg'>Nieuw &middot; Feit</div><h4>Productiviteit +2,5% in 2025, na twee jaar daling.</h4><p>Commerciele sector, toegevoegde waarde per gewerkt uur (CBS, voorlopig). In 2023 was het -2,0%, in 2024 -0,4%. Geen bewijs dat AI dit veroorzaakt: de bijdrage zit vooral in handel en industrie, informatie en communicatie droeg -0,15 punt bij.</p></div>
<div class='card'><div class='tg'>Nieuw &middot; Feit</div><h4>Faillissementen: oktober +27%.</h4><p>322 tegen 253 een jaar eerder, maar jan-okt staat op 2.983 tegen 3.063 (eigen optelling). De maand zegt weinig, de reeks meer. Wij houden de reeks bij.</p></div>
<div class='card'><div class='tg'>Nieuw &middot; Eigen analyse</div><h4>Wie hoog start, blijft hoog. Inhalen niet aangetoond.</h4><p>Over 12 sectoren is de rangorde bijna gelijk gebleven (rho {f(_r1[0])}, interval {f(_r1[1])} tot {f(_r1[2])}). Of lage sectoren harder groeien: rho {f(_r2[0])}, interval {f(_r2[1])} tot {f(_r2[2])}, dus niet aantoonbaar. 11 van 12 sectoren stegen.</p></div></div>
<div class='ch'><div class='ct'>Wat de trendbank bevat</div><p class='mini' style='margin:0'>Eurostat AI-gebruik per land en bedrijfsgrootte (2024, 2025) &middot; CBS AI-gebruik per sector (2023-2025) &middot; CBS arbeidsproductiviteit 2000-2025 &middot; CBS automatisering en personeelstekort per sector (apr 2025, apr 2026) &middot; CBS faillissementen per maand en sector &middot; Microsoft AI-gebruik per land (Q2 2026) &middot; CBS AI onder werkenden &middot; Exact MKB Barometer &middot; NL-meetverschillen (acht definities).</p></div>
<div class='ft'><span class='lab'>Eigen analyse</span>Spearman-rangcorrelatie met bootstrap (5.000 trekkingen), n = 12 sectoren, CBS Conjunctuurenquête (M18). Download: portal-v2/reports/trendbank/. Vergelijk alleen reeksen met dezelfde definitie.</div>""")
# ---- atlas
_t=_sq.connect(SC+'bulk/tb.sqlite')
_fam=[('Eurostat','eurostat_%','Macro, arbeid, energieprijzen, R&amp;D, cloud en AI per EU-land'),('OECD','oecd_%','ICT en AI in bedrijven, mkb-financiering, FDI, prognoses, digitale handel'),('IMF','imf_%','132 indicatoren voor 190+ landen, prognoses tot 2031, AI Preparedness'),('World Bank','wb_%','Digitaal, ondernemen, energie, handel, defensie, krediet'),('ECB','ecb_%','Rentes, wisselkoersen, kredietverlening aan bedrijven'),('CBS','cbs_%','Nederland: ICT/AI, vacatures, vertrouwen, innovatie, loonkosten'),('Our World in Data','owid_%','AI-investeringen, rekenkracht, energieprijzen, democratie')]
_tr=''.join(f"<tr><td><b>{n}</b></td><td style='text-align:right'>{_t.execute('select count(*) from observations where series_id like ?',(p,)).fetchone()[0]:,}</td><td style='text-align:right'>{_t.execute('select count(distinct series_id) from observations where series_id like ?',(p,)).fetchone()[0]:,}</td><td>{d}</td></tr>".replace(',','.') for n,p,d in _fam)
_tot=_t.execute('select count(*),count(distinct series_id) from observations').fetchone()
_srcn=_t.execute('select count(*) from sources').fetchone()[0]
_an=_db.execute("select name,value,ci_low,ci_high,n,note from analysis_results where name like 'AI-gebruik 2025 vs %' order by value desc").fetchall()
_ar=''.join(f"<tr><td>{a[0].replace('AI-gebruik 2025 vs ','').replace(' (27 EU-landen)','')}</td><td style='text-align:right'><b>{f(a[1])}</b></td><td>{f(a[2])} tot {f(a[3])}</td><td>{a[5].split('Holm-gecorrigeerd p=')[1].split(';')[0]}</td></tr>" for a in _an)
pg(f"""<div class='k'>De Atlas &middot; Editie 2026-Q4</div><h1 style='font-size:32pt'>{_tot[0]:,} meetpunten. <i>Één vraag.</i></h1>
<p style='max-width:162mm'>We hebben bij Eurostat, OECD, IMF, World Bank, ECB, CBS en Our World in Data alles opgehaald wat bedrijven raakt: macro, arbeid, energie, handel, politiek, geopolitiek, technologie en financiering. Samen {_tot[1]:,} reeksen uit {_srcn} bronnen en datasets, vastgelegd met definitie en bron. Volgende editie leggen we ernaast.</p>
<table style='margin-bottom:3mm'><tr><th>Bron</th><th style='text-align:right'>Meetpunten</th><th style='text-align:right'>Reeksen</th><th>Wat zit erin</th></tr>{_tr}</table>
<div class='card' style='margin-bottom:3mm'><div class='tg'>Eerste toets &middot; 27 EU-landen &middot; Eigen analyse</div><h4>Wat hangt samen met AI-gebruik door bedrijven?</h4>
<table><tr><th>Kenmerk van het land</th><th style='text-align:right'>rho</th><th>Interval 95%</th><th>p (Holm)</th></tr>{_ar}</table>
<p class='mini' style='margin-top:1.5mm'>Gebruik van AI in 2025 (Eurostat) tegenover het laatste jaar van elk kenmerk. Holm-correctie voor {len(_an)} toetsen. Verband, geen oorzaak: rijke landen hebben veel gemeen.</p></div>
<div class='l8'>
<div class='card'><div class='tg'>Ons oordeel</div><h4>AI volgt arbeid, niet energie.</h4><p>Landen met dure arbeid en veel R&amp;D gebruiken meer AI. De prijs van elektriciteit voor bedrijven doet er niet toe (rho {f(_db.execute("select value from analysis_results where name like '%Elektriciteitsprijs%'").fetchone()[0])}).</p></div>
<div class='card'><div class='tg'>Wat niet lukte</div><h4>Eerlijk over de gaten.</h4><p>Acht World Bank-reeksen (o.a. bestuurskwaliteit) en acht CBS-tabellen (o.a. ondernemersvertrouwen) haalden we niet binnen. Nieuws, talen buiten de gebruikte bronnen en betaalde data ontbreken. Volgende editie vullen we aan.</p></div></div>
<div class='card' style='margin-top:3mm'><div class='tg'>Naast Nederland &middot; Feit</div><h4>Spanje 33,6%, Italië 16,4%, Nederland 33,2%.</h4><p>Bedrijven 10+ die AI gebruiken: Spanje Q1 2026 (INE), Italië en Nederland 2025. Italië: mkb 15,7%, groot 53,1%. Japan meldt 86,4% (gen-AI, minstens één taak): andere vraag en basis, niet vergelijkbaar.</p></div>
<div class='ft'><span class='lab'>Eigen analyse</span>Spearman met bootstrap (3.000 trekkingen). Download: portal-v2/reports/trendbank/ (catalogus en volledige database). Vergelijk alleen reeksen met dezelfde definitie.</div>""".replace(f"{_tot[0]:,}",f"{_tot[0]:,}".replace(',','.')).replace(f"{_tot[1]:,}",f"{_tot[1]:,}".replace(',','.')))
# ---- besluitkaart
pg("""<div class='k'>De besluitkaart &middot; Kader</div><h1 style='font-size:30pt'>Wat besluit je <i>eigenlijk</i> elke dag?</h1>
<p style='max-width:165mm'>AI helpt pas als je weet welke keuzes je maakt, hoe je ze maakt en waarop je ze baseert. Dit kader geeft elke beslissing een vaste vorm, zodat je kunt zien welke je kunt overlaten aan een regel of assistent en welke bij jou blijven.</p>
<div class='l8' style='margin-top:3mm'>
<div class='card'><div class='tg'>Stap 1 &middot; Hoe terugdraaibaar?</div><h4>Type 1 of Type 2.</h4><p><b>Type 2</b>: terug te draaien, goedkoop te herstellen. Beslis snel, met ongeveer 70% van de informatie, en leg een regel vast. <b>Type 1</b>: moeilijk of duur terug te draaien (ontslag, grote investering, prijsstrategie). Neem de tijd, vraag een tweede mening en schrijf je aannames op.</p><span class='lab'>Werkregel</span></div>
<div class='card'><div class='tg'>Stap 2 &middot; Op basis waarvan?</div><h4>Intuïtie alleen waar leren kan.</h4><p>Kahneman en Klein (2009): vertrouw op onderbuikgevoel alleen in een regelmatige omgeving met snelle, duidelijke feedback. Bij zeldzame of trage beslissingen (aannemen, prijzen, investeren) heeft data of een checklist de voorkeur.</p><span class='lab'>Onderzoek</span></div></div>
<div class='card' style='margin-top:3mm'><div class='tg'>Stap 3 &middot; Wie ben jij als beslisser?</div><h4>Vijf typen in het Nederlandse mkb.</h4>
<table><tr><th>Type</th><th style='text-align:right'>Aandeel</th><th>Kenmerk</th></tr>
<tr><td><b>Informers' friends</b></td><td style='text-align:right'>~33%</td><td>Beslist op advies van anderen, weinig alternatieven (26%)</td></tr>
<tr><td><b>Daredevils</b></td><td style='text-align:right'>~22%</td><td>Veel informatie (77%) en overleg (97%), hoog risico, innovatief</td></tr>
<tr><td><b>Lone rangers</b></td><td style='text-align:right'>~21%</td><td>Beslist alleen, weinig informatie (49%), langste ervaring</td></tr>
<tr><td><b>Doubtful minds</b></td><td style='text-align:right'>~20%</td><td>Meeste informatie (86%) en alternatieven (89%), blijft twijfelen</td></tr>
<tr><td><b>Busy bees</b></td><td style='text-align:right'>~6%</td><td>Meeste besluiten, altijd overleg, grote investeringen</td></tr></table>
<p class='mini' style='margin-top:1.5mm'>Panteia (Gibcus, Vermeulen &amp; De Jong, 2009): 646 Nederlandse ondernemers, peiljaar 2004. Horeca is oververtegenwoordigd en het onderzoek is oud en niet representatief: zie het als gespreksopener (welk type ben jij?), niet als etiket.</p></div>
<div class='card' style='margin-top:3mm'><div class='tg'>Hoe Nederlandse ondernemers beslissen &middot; Feit / indicatie</div>
<table><tr><td>Data is zelden leidend: <b>12%</b> van de mkb'ers (Exact, artikel jan 2024; editie niet vermeld, nog te controleren)</td></tr>
<tr><td>Bijna drie kwart van de ondernemers (5+ werkzame personen) ervaart meer onzekerheid (CBS, sept 2025)</td></tr>
<tr><td>69% ligt wel eens wakker; 70% gebruikt AI, maar 47% weet niet goed hoe (Exact MKB Barometer 2026, 1.719 ondernemers; zelfrapportage)</td></tr></table>
<p class='mini' style='margin-top:1.5mm'>Beslissen is voor de meeste ondernemers een eenzaam werk met onvolledige informatie. Daarom helpt een vaste kaart meer dan nog een cijfer.</p></div>
<div class='l8' style='margin-top:3mm'>
<div class='card'><div class='tg'>Wat we meten &middot; Feit</div><h4>Nederland gebruikt AI: 33,2%.</h4><p>Bedrijven met 10+ werknemers, 2025 (Eurostat): plaats 6 van 35 landen, EU27 20,0%. Bij 10&ndash;49 werknemers 28,8%, bij 250+ 67,6%. Klein beslist dus nog het vaakst zonder AI.</p></div>
<div class='card'><div class='tg'>Wereldwijd &middot; Feit</div><h4>OECD: 61% gebruikt AI, 76% is beginner.</h4><p>D4SME 2026: 2.018 mkb-bedrijven in 12 landen. Beginnen is de norm, niet de uitzondering.</p></div></div>
<div class='ft'><span class='lab'>Open gat</span>We vonden geen Nederlandse studie naar de dagelijkse beslissingen zelf, en geen vergelijkbare data voor China, India, Brazilië, Afrika en het Midden-Oosten. Verder: een Type 1/Type 2-indeling is een denkmodel, geen meting.</div>""")
# ---- besluitkaart invulbaar
pg("""<div class='k'>De besluitkaart &middot; Werkblad</div><h1>Eén beslissing. <i>Eén kaart.</i></h1><p class='mini' style='max-width:150mm'>Kies een beslissing die je deze maand zeker neemt. Vul de kaart in vóór je beslist en terug bij de evaluatiedatum.</p>
<h3 style='margin-top:4mm'>De beslissing</h3><span class='fb' data-f='b_beslissing'></span>
<div class='g2'><div><h3>Domein</h3><span class='fb' data-f='b_domein' style='height:9mm'></span></div><div><h3>Wie beslist?</h3><span class='fb' data-f='b_wie' style='height:9mm'></span></div></div>
<div style='margin:2mm 0 3mm;font-size:9pt'><span class='cbx' data-f='b_type1' style='border-color:var(--ink)'></span> Type 1 (moeilijk terug te draaien) &nbsp;&nbsp; <span class='cbx' data-f='b_type2' style='border-color:var(--ink)'></span> Type 2 (terug te draaien)</div>
<div class='g2'><div><h3>Regel of drempel</h3><span class='fb' data-f='b_regel' style='height:16mm'></span></div><div><h3>Benodigde data</h3><span class='fb' data-f='b_data' style='height:16mm'></span></div></div>
<h3>Mijn aannames (wat moet waar zijn?)</h3><span class='fb' data-f='b_aanname' style='height:16mm'></span>
<h3>Pre-mortem: stel dat het mislukt, waarom?</h3><span class='fb' data-f='b_premortem' style='height:16mm'></span>
<div class='g2'><div><h3>Verwachte uitkomst</h3><span class='fb' data-f='b_uitkomst' style='height:12mm'></span></div><div><h3>Evaluatiedatum</h3><span class='fb' data-f='b_datum' style='height:12mm'></span></div></div>
<h3>Wat heb ik geleerd? (invullen bij evaluatie)</h3><span class='fb' data-f='b_geleerd' style='height:16mm'></span>
<div class='ft'>Bewaar je kaarten bij het kwartaalritueel. Na een jaar zie je welke beslissingen je kunt overlaten aan een regel of een AI-assistent.</div>""")
# ---- jouw moment
pg("""<div class='k'>Jouw moment &middot; Afsluiting</div><h1 style='font-size:32pt'>Leg de cijfers even <i>weg.</i></h1>
<p style='max-width:155mm'>Negentig minuten is lang genoeg om iets te beslissen en kort genoeg om iets te voelen. Beantwoord deze vragen voor jezelf, niet voor je team of je klanten. Niemand leest ze, behalve jij.</p>
<div class='q'>Een bedrijf groeit zelden sneller dan zijn eigenaar tijd heeft om na te denken.</div>
<h3>Waar ben ik dit kwartaal trots op?</h3><span class='fb' data-f='m_trots' style='height:15mm'></span>
<h3>Wat geeft mij energie in mijn werk?</h3><span class='fb' data-f='m_energie' style='height:15mm'></span>
<h3>Wat kost mij energie, en kan dat weg of kleiner?</h3><span class='fb' data-f='m_kost' style='height:15mm'></span>
<h3>Wat zou ik doen met één vrije dag per week extra?</h3><span class='fb' data-f='m_dag' style='height:15mm'></span>
<h3>Wat laat ik los?</h3><span class='fb' data-f='m_los' style='height:15mm'></span>
<div style='margin-top:5mm;font-size:9pt'><span class='cbx' data-f='m_gedaan' style='border-color:var(--ink)'></span> Ik heb mijn uur genomen. Tot het volgende kwartaal.</div>
<div class='ft'>Je bent niet de enige die dit nodig heeft: 11,8% van de zelfstandigen had in 2025 burn-outklachten (TNO, NEA/ZEA). AI is een middel; het doel is meer tijd voor wat jij belangrijk vindt.</div>""")
# ---- advertentie
QP=qr(PORTAL,'#0a1630')
CI=IMG(SC+'groot/img/consult.jpg')
pg(f"""<img src='{CI}' style='position:absolute;left:0;top:0;width:210mm;height:128mm;object-fit:cover;object-position:50% 40%'>
<div style='position:absolute;left:0;top:0;width:210mm;height:128mm;background:linear-gradient(180deg,rgba(10,22,48,.55) 0%,rgba(10,22,48,0) 35%,rgba(10,22,48,.0) 60%,rgba(10,22,48,.95) 100%)'></div>
<div style='position:absolute;right:17mm;top:10mm;font-size:6.5pt;letter-spacing:.3em;text-transform:uppercase;color:#e8c46e'>Advertentie</div>
<div style='position:absolute;left:17mm;right:17mm;top:98mm'><div style='font-family:Ser;font-size:46pt;line-height:1;color:#f7efdc'>Je bedrijf weet alles.<br><i style='color:#e8c46e'>Alleen niet waar.</i></div></div>
<div style='position:absolute;left:17mm;right:17mm;top:138mm'>
<p style='font-size:11.5pt;max-width:150mm;color:#e9e1cc'>Bedrijfsgeheugen is het geheugen van je bedrijf: documenten, systemen en afspraken op één plek, koppelbaar, doorzoekbaar en door AI te bevragen. Zodat kennis blijft als iemand vertrekt, en je team sneller antwoord heeft dan het kan zoeken.</p>
<div class='g3' style='margin-top:6mm'>
<div><h3>Vind</h3><p class='mini'>Stel een vraag in gewone taal. Krijg het antwoord uit je eigen documenten en systemen, met bron.</p></div>
<div><h3>Verbind</h3><p class='mini'>Koppel je boekhouding, mail en dossiers. Eén keer instellen, daarna loopt het mee.</p></div>
<div><h3>Bewaar</h3><p class='mini'>Leg vast hoe het werkt en waarom, voordat het in iemands hoofd blijft zitten.</p></div></div>
<div style='display:flex;gap:7mm;align-items:center;margin-top:7mm;padding-top:6mm;border-top:.25mm solid rgba(232,196,110,.5)'>
<div style='background:#f6f0e3;padding:2.5mm;width:30mm;flex:none'>{QP}</div>
<div><div style='font-family:Ser;font-size:22pt;line-height:1.05;color:#f7efdc'>Begin met een <i style='color:#e8c46e'>Frisse Blik.</i></div><p class='mini' style='color:#cfc7b2;margin-top:2mm'>Een kennismaking van een uur. Samen kijken we waar de kloof in jouw bedrijf zit. Scan de code of ga naar bedrijfsgeheugen.nl/frisse-blik.</p></div></div></div>
<div style='position:absolute;right:17mm;bottom:10mm;font-size:5pt;letter-spacing:.14em;text-transform:uppercase;opacity:.6'>Beeld: AI-gegenereerd</div>""",'dk')
# ---- 17 achterkant
QT=qr(TRIAL,'#0a1630')
pg(f"""<div class='k'>Samen doen</div><h1>Liever niet alleen aan <i>tafel?</i></h1>
<p style='font-size:11pt;max-width:150mm'>Het ritueel werkt het best met iemand die meekijkt. Bedrijfsgeheugen houdt je kwartaalplan bij, koppelt het aan je eigen bedrijfsdata en laat zien wat er na negentig dagen is veranderd. En als je wilt, denkt een expert mee.</p>
<div class='g3' style='margin:6mm 0'><div class='ch' style='margin:0;background:transparent;border-color:rgba(232,196,110,.5)'><div class='ct' style='color:var(--gd)'>Zelf</div><p class='mini'>Gebruik het portaal en je plan.</p></div><div class='ch' style='margin:0;background:transparent;border-color:rgba(232,196,110,.5)'><div class='ct' style='color:var(--gd)'>Samen</div><p class='mini'>Een expert doet het ritueel met je mee.</p></div><div class='ch' style='margin:0;background:transparent;border-color:rgba(232,196,110,.5)'><div class='ct' style='color:var(--gd)'>Laten doen</div><p class='mini'>Wij bouwen de eerste AI-assistent.</p></div></div>
<div style='display:flex;gap:8mm;align-items:center;background:#f6f0e3;color:var(--ink);padding:7mm;margin-top:4mm'><div style='flex:1'><div class='k' style='color:var(--gt)'>Een maand gratis</div><div style='font-family:Ser;font-size:26pt;line-height:1;margin-bottom:2mm'>Code <i style='color:var(--gt)'>KLOOF-Q4</i></div><p class='mini'>Geen betaalmethode nodig, één keer per e-mailadres. Scan de code, hij staat al klaar.<br><b>bedrijfsgeheugen.nl/afsluiten</b></p></div><div style='width:34mm;flex:none'>{QT}</div></div>
<p class='mini' style='margin-top:8mm;color:#cfc7b2'>Plan een kennismaking: bedrijfsgeheugen.nl/frisse-blik. Redactie: Bedrijfsgeheugen, november 2026.</p>""",'dk')

html=f"<!doctype html><html lang='nl'><head><meta charset='utf-8'><title>De Kloof No. 04</title><style>{CSS}</style></head><body>{''.join(pages)}</body></html>"
open('de-kloof-no04.html','w').write(html)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg_=b.new_page();pg_.goto('file://'+os.path.abspath('de-kloof-no04.html'));pg_.wait_for_timeout(900)
    over=pg_.evaluate("""()=>[...document.querySelectorAll('.p')].map((p,i)=>{const pr=p.getBoundingClientRect();let m=-1e9,w='';p.querySelectorAll('*').forEach(e=>{if(e.closest('.hd'))return;const r=e.getBoundingClientRect();if(r.height&&r.bottom>m&&!e.closest('.ft')&&getComputedStyle(e).position!=='absolute'){m=r.bottom;w=e.className||e.tagName}});const ft=p.querySelector('.ft');const fr=ft?ft.getBoundingClientRect().top:pr.bottom;return [i+1,Math.round((fr-m)*.2646*10)/10,w]})""")
    print(over)
    pg_.pdf(path='de-kloof-no04.pdf',width='210mm',height='297mm',print_background=True);b.close()
