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
.bar{margin-bottom:2.6mm}.bar .l{display:flex;justify-content:space-between;font-size:9.8pt;margin-bottom:.8mm}
.bar .t{height:4.6mm;background:rgba(10,22,48,.08)}.bar .f{height:100%;background:var(--ink)}.bar.h .f{background:var(--gt)}
.ch{margin:5mm 0 4mm;padding:5mm 6mm;border:.3mm solid var(--ln);background:rgba(255,255,255,.45)}
.ch .ct{font-size:6.8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);margin-bottom:2.5mm;font-weight:600}
.mon{background:var(--ink);color:#f4ecdc;padding:6mm 7mm;margin:5mm 0}
.mon h3{color:var(--gd)}
.st{display:flex;gap:3mm;margin-bottom:3mm;align-items:flex-start;font-size:11pt;line-height:1.4}
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
table{border-collapse:collapse;width:100%;font-size:8pt;line-height:1.3}td,th{border-bottom:.2mm solid var(--ln);padding:1.6mm 1.5mm;text-align:left;vertical-align:top}th{font-size:6.3pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.mini{font-size:10pt;line-height:1.5}
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
def block(mv,title,big,cap,charts,means,risk,steps,tool,label,src,foot):
    BN[0]+=1
    st=''.join(f"<div class='st'><span class='cbx' data-f='b{BN[0]}s{i+1}'></span><span>{s}</span></div>" for i,s in enumerate(steps))
    pg(f"""<div class='k'>Bouwblok {BN[0]:02d} &middot; Beweging {mv}</div><h2>{title}</h2>
<div class='bigrow'><div class='big'>{big}</div><div class='cap'>{cap}</div></div>{charts}
<div class='g2'><div><h3>Wat het betekent</h3><p class='mini'>{means}</p></div><div><h3>Risico</h3><p class='mini'>{risk}</p></div></div>
<div class='mon'><h3>Doe dit maandag</h3>{st}<div class='mini' style='color:#cfc7b2;margin-top:2mm'><b style='color:var(--gd)'>Gereedschap:</b> {tool}</div></div>
<div class='ft'><span class='lab'>{label}</span>{foot}<br>Bron: {src}</div>""")

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
<div style='position:absolute;left:18mm;top:96mm;width:26mm;height:26mm;border-radius:50%;background:#e8c46e;color:#0a1630;display:flex;align-items:center;justify-content:center;text-align:center;font-size:6pt;letter-spacing:.14em;text-transform:uppercase;font-weight:600;line-height:1.35;transform:rotate(8deg)'>Alleen<br>voor<br>leden<br>van de<br>kloof</div>
<div style='position:absolute;left:18mm;right:18mm;bottom:20mm'><div style='font-family:Ser;font-size:44pt;line-height:1;color:#f7efdc;max-width:150mm'>Wat iedereen wil,<br>maar bijna niemand <i style='color:#e8c46e'>durft.</i></div>
<div style='display:flex;justify-content:space-between;align-items:flex-end;margin-top:6mm;padding-top:4mm;border-top:.25mm solid rgba(232,196,110,.55);font-size:7pt;letter-spacing:.2em;text-transform:uppercase'><span style='color:#e8c46e'>Persoonlijk exemplaar &middot; Voor: <span class='fld' data-f='naam' style='width:52mm;background:rgba(232,196,110,.25);border-color:#e8c46e'></span></span><span>bedrijfsgeheugen.nl</span></div></div>
<div style='position:absolute;right:18mm;bottom:12.5mm;font-size:5pt;letter-spacing:.14em;text-transform:uppercase;opacity:.6'>Beeld: AI-gegenereerd</div>""",'dk',hd=False)

# ---- 2 welkom
pg(f"""<div class='k'>Welkom</div><h1>Een afspraak met <i>jezelf.</i></h1>
<p style='font-size:11.5pt;line-height:1.5;max-width:150mm'>Bijna iedere ondernemer wil weten wat AI voor zijn bedrijf kan doen. Bijna niemand heeft er een rustig moment voor. Dit magazine is daarom geen rapport. Het is een ritueel: negentig minuten per kwartaal, met koffie, een pen en eerlijke cijfers.</p>
<div class='q'>Het gat is geen techniek. Het gat is tijd, kennis en een eerste kleine stap.</div>
<p style='max-width:150mm'>Wij hebben openbare data uit Europa, Nederland en de wereld naast elkaar gelegd: Eurostat, CBS, UWV, Stanford, McKinsey, Verizon en de AI Act. Elk cijfer heeft een bron, een bewijsniveau en een label. Daarna hebben we het teruggebracht tot negen bouwblokken die je zonder voorkennis kunt lezen en dezelfde week nog kunt gebruiken.</p>
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
<p style='max-width:150mm'>Plan één ochtend per kwartaal. Telefoon weg, deur dicht. Loop de vijf bewegingen door, in deze volgorde. Elke beweging heeft bouwblokken in dit magazine en een plek in het werkblad op pagina 14.</p>
<div class='mv'><div class='m'>I<small>10 min</small></div><div><b>Kijk</b> &middot; Waar sta je in de kloof?<br><span class='mini'>Bouwblok 01 &middot; pagina 5</span></div></div>
<div class='mv'><div class='m'>II<small>15 min</small></div><div><b>Kies</b> &middot; Eén taak, één drempel.<br><span class='mini'>Bouwblokken 02 en 03 &middot; pagina 6 en 7</span></div></div>
<div class='mv'><div class='m'>III<small>25 min</small></div><div><b>Regel</b> &middot; Team, wet en veiligheid.<br><span class='mini'>Bouwblokken 04, 05 en 06 &middot; pagina 8 tot 10</span></div></div>
<div class='mv'><div class='m'>IV<small>30 min</small></div><div><b>Bouw</b> &middot; Bouw eerst een AI, in plaats van weer een Excel.<br><span class='mini'>Bouwblokken 07 en 08 &middot; pagina 11 en 12</span></div></div>
<div class='mv'><div class='m'>V<small>10 min</small></div><div><b>Meet</b> &middot; Eén getal, over 90 dagen terug.<br><span class='mini'>Bouwblok 09 &middot; pagina 13</span></div></div>
<div class='mv' style='border-bottom:.3mm solid var(--ink)'><div class='m'>&#8734;<small>vooraf</small></div><div class='mini'>Werkblad pagina 14, jouw plan pagina 15, bronnen pagina 16. Op de laatste pagina vind je een maand gratis hulp bij het ritueel.</div></div>""")
# ---- 4 kloof in een blik
pg(f"""<div class='k'>De kloof in één blik</div><h1 style='font-size:34pt'>Nederland loopt voor. <i>Het mkb niet.</i></h1>
<p style='max-width:150mm'>Eén op de vijf Europese bedrijven met 10 of meer medewerkers gebruikt AI. Nederland staat zesde. Hoe kleiner het bedrijf, hoe groter de kloof.</p>
<div class='g2'><div>{chart('Europa, 2025 &middot; bedrijven 10+ &middot; % met AI',[('Denemarken',42.0),('Finland',37.8),('Zweden',35.0),('België',34.5),('Luxemburg',33.6),('Nederland',33.2,True),('EU-gemiddelde',20.0,True),('Roemenië',5.2)],mx=45)}</div>
<div>{chart('EU naar omvang, 2025 &middot; % met AI',[('Klein (10–49)',17.0),('Middelgroot (50–249)',30.4),('Groot (250+)',55.0,True)],mx=60)}
{chart('EU door de tijd &middot; % met AI',[('2023',8.1),('2024',13.5),('2025',20.0,True)],mx=45)}</div></div>
<div class='ch'><div class='ct'>Nederland (CBS), 2025 &middot; % met AI, ander bereik: 2+ medewerkers</div>{bar('Microbedrijven (2–10)',13.8,mx=70)}{bar('Mkb (10–250)',29.8,mx=70)}{bar('Grootbedrijf',66.2,mx=70,h=True)}</div>
<div class='g2'><div><h3>Let op</h3><p class='mini'>Eurostat meet bedrijven met 10+ medewerkers, het CBS ook microbedrijven. Niet één op één vergelijkbaar.</p></div><div><h3>Ons oordeel</h3><p class='mini'>De snelste groei zit bij tekst en administratie. Wie nu begint, loopt niet achter, maar voorop in zijn eigen straat.</p></div></div>
<div class='ft'><span class='lab'>Feit</span>Eurostat KS-01-26-009 (2026), Eurostat nieuws 11-12-2025, CBS via ICTMagazine 16-3-2026.</div>""")

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
 'een simpel meetblad: taak, baseline, nulmeting na 90 dagen. Je plan op pagina 15 heeft de velden al.','Ons oordeel','McKinsey (via The Register, 25-8-2026); Stanford AI Index 2026 (via UNU-C3).','Secundaire samenvattingen. ')

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
tr=''.join(f"<tr><td>{r[1]}</td><td>{r[2]}<br><span style='color:var(--mut)'>{r[3]}</span></td><td><b>{r[4]}</b></td><td>{r[5]}</td></tr>" for r in rows)
pg(f"""<div class='k'>Verantwoording</div><h2>Bronnen en <i>bewijs</i></h2>
<p class='mini'>Niveau A: officiële statistiek of wet. B: samenvatting of onderzoek met open methode. C: leveranciersonderzoek, indicatief. We hebben bij elk cijfer de populatie en de beperking genoteerd.</p>
<table><tr><th>Bron</th><th>Titel</th><th>Niveau</th><th>Let op</th></tr>{tr}</table>
<p class='mini' style='margin-top:4mm'>Niet gebruikt: cijfers die we niet bij de primaire bron konden terugvinden. Wat ontbreekt, laten we weg in plaats van te schatten. Het beeld op de voorkant is AI-gegenereerd. Dit magazine is geen juridisch of financieel advies.</p>""")
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
