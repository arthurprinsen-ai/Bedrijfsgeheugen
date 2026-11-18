import re,sys
exec(open('/tmp/tr/t1.py').read())
for f in ('t2','t3','t4'): exec(open(f'/tmp/tr/{f}.py').read())
s=open('mag.py').read()
miss=[]
for nl,en in T:
    n=s.count(nl)
    if n==0: miss.append(nl[:90]); continue
    s=s.replace(nl,en)
print('pairs',len(T),'missing',len(miss))
for m in miss: print('MISS:',m)
# number formatting on text nodes at html output
s=s.replace("html=f\"<!doctype html>","html0=f\"<!doctype html>")
s=s.replace("open('de-kloof-no04.html','w').write(html)","""import re as _re
def _num(m):
    t=m.group(1)
    t=_re.sub(r'(?<![\d.,])([1-9]\\d{0,2})((?:\\.\\d{3})+)(?![\d])',lambda k:k.group(1)+k.group(2).replace('.',','),t)
    t=_re.sub(r'(?<![\d.,])(\\d+),(\\d+)(?!\\d)',lambda k:(k.group(1)+'.'+k.group(2)) if (k.group(1) in('0',) or len(k.group(2))<=2) else k.group(0),t)
    return '>'+t+'<'
html=_re.sub(r'>([^<>]+)<',_num,html0)
open('de-kloof-no04-en.html','w').write(html)""")
s=s.replace("'de-kloof-no04.html'","'de-kloof-no04-en.html'").replace("path='de-kloof-no04.pdf'","path='de-kloof-no04-en.pdf'")
open('mag_en.py','w').write(s)
