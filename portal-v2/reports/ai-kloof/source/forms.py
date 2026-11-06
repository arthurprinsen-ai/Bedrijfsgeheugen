import os,sys
from playwright.sync_api import sync_playwright
from pypdf import PdfReader,PdfWriter
from pypdf.generic import *
out='ai-kloof-mkb-2026-q4';H=841.89
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('file://'+os.path.abspath(out+'.html'));pg.wait_for_timeout(500)
    F=pg.evaluate("""()=>{const ps=[...document.querySelectorAll('.p')];return [...document.querySelectorAll('[data-f]')].map(el=>{const p=el.closest('.p'),r=el.getBoundingClientRect(),q=p.getBoundingClientRect();return {n:el.dataset.f,page:ps.indexOf(p),x:(r.left-q.left)*.75,y:(r.top-q.top)*.75,w:r.width*.75,h:r.height*.75,cb:el.classList.contains('cbx')}})}""");b.close()
r=PdfReader(out+'.pdf');w=PdfWriter();w.append(r)
def stream(txt,bbox):
    s=DecodedStreamObject();s.set_data(txt.encode());s.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Form'),NameObject('/BBox'):ArrayObject([FloatObject(v) for v in bbox])});return w._add_object(s)
fields=ArrayObject();names=[]
for f in F:
    page=w.pages[f['page']];x,y,wd,ht=f['x'],H-f['y']-f['h'],f['w'],f['h']
    d=DictionaryObject({NameObject('/Type'):NameObject('/Annot'),NameObject('/Subtype'):NameObject('/Widget'),NameObject('/T'):TextStringObject(f['n']),NameObject('/Rect'):ArrayObject([FloatObject(v) for v in (x,y,x+wd,y+ht)]),NameObject('/F'):NumberObject(4),NameObject('/P'):page.indirect_reference})
    if f['cb']:
        on=stream(f"q 0.08 0.09 0.1 rg {wd*0.2:.2f} {ht*0.2:.2f} {wd*0.6:.2f} {ht*0.6:.2f} re f Q",(0,0,wd,ht));off=stream("",(0,0,wd,ht))
        d.update({NameObject('/FT'):NameObject('/Btn'),NameObject('/V'):NameObject('/Off'),NameObject('/AS'):NameObject('/Off'),NameObject('/AP'):DictionaryObject({NameObject('/N'):DictionaryObject({NameObject('/Yes'):on,NameObject('/Off'):off})}),NameObject('/MK'):DictionaryObject()})
    else:
        d.update({NameObject('/FT'):NameObject('/Tx'),NameObject('/DA'):TextStringObject('/Helv 9 Tf 0.08 0.09 0.1 rg'),NameObject('/MK'):DictionaryObject({NameObject('/BC'):ArrayObject([FloatObject(.72),FloatObject(.76),FloatObject(.95)])})})
    ref=w._add_object(d);fields.append(ref)
    if '/Annots' not in page:page[NameObject('/Annots')]=ArrayObject()
    page['/Annots'].append(ref)
    names.append((f['n'],ref))
score=[r for n,r in names if n=='score']
if score:
    js="var t=0;for(var i=1;i<=12;i++){var f=this.getField('q'+i);if(f&&f.value!='Off')t++;}event.value=t;"
    sd=w._get_object(score[0]) if hasattr(w,'_get_object') else score[0].get_object()
    sd[NameObject('/AA')]=DictionaryObject({NameObject('/C'):DictionaryObject({NameObject('/S'):NameObject('/JavaScript'),NameObject('/JS'):TextStringObject(js)})})
af=DictionaryObject({NameObject('/Fields'):fields,NameObject('/NeedAppearances'):BooleanObject(True),NameObject('/DA'):TextStringObject('/Helv 9 Tf 0 g'),NameObject('/DR'):DictionaryObject({NameObject('/Font'):DictionaryObject({NameObject('/Helv'):DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica'),NameObject('/Encoding'):NameObject('/WinAnsiEncoding')})})})})
if score:af[NameObject('/CO')]=ArrayObject(score)
w._root_object[NameObject('/AcroForm')]=af
w.add_metadata({'/Title':'De AI-kloof in het mkb · 2026-Q4','/Author':'Bedrijfsgeheugen'})
w.write(out+'-invulbaar.pdf');print(len(F),'velden')
