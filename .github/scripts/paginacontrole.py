# -*- coding: utf-8 -*-
"""Browsercontrole voor de werkelijk gebouwde publieke site.

Deze controle draait na dezelfde canonical production build als de release lane.
Hij valideert de actuele component-contracten, absolute interne URLs,
JavaScript-fouten, metadata, mobiele overflow en basis Core Web Vitals.
"""
import functools
import glob
import http.server
import json
import os
import socketserver
import sys
import threading
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

POORT = 0
WORTEL = os.getcwd()

OVERSLAAN = {
    'index-oud', 'klantportaal', 'klantportaal-demo', 'klant-login',
    'prototype-v18-stable'
}
GEEN_KRUIMEL = {'index', '404'}
GEEN_CANONICAL = {'404'}
GEEN_SCHEMA = {'404', 'bedankt', 'zelfscan', 'klantformulier'}


class StilleServer(socketserver.TCPServer):
    allow_reuse_address = True


class StilleHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def start_server():
    global POORT
    handler = functools.partial(StilleHandler, directory=WORTEL)
    httpd = StilleServer(('127.0.0.1', 0), handler)
    POORT = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def intern_pad(href):
    """Geeft het pad terug voor een interne absolute/root-relative URL."""
    if not href:
        return None
    try:
        u = urllib.parse.urlparse(href)
    except ValueError:
        return None
    if u.scheme or u.netloc:
        if (u.scheme, u.netloc) not in {
            ('https', 'www.bedrijfsgeheugen.nl'),
            ('https', 'bedrijfsgeheugen.nl'),
        }:
            return None
        return u.path or '/'
    if href.startswith('/') and not href.startswith('//'):
        return u.path or '/'
    return None


def bestaat(href):
    """Is deze interne link te bereiken in de gebouwde lokale site?"""
    pad = intern_pad(href)
    if pad is None:
        return True
    schoon = pad.rstrip('/')
    if not schoon:
        return True
    for kandidaat in (schoon, schoon + '.html', schoon + '/index.html'):
        try:
            urllib.request.urlopen(
                'http://127.0.0.1:%d%s' % (POORT, kandidaat), timeout=4
            )
            return True
        except Exception:
            pass
    return False


METER = r"""
window.__cls=0; window.__lcp=0; window.__bronnen={};
try{
 new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){
   if(e.hadRecentInput) return;
   window.__cls+=e.value;
   (e.sources||[]).forEach(function(s){
     var n=s.node; if(!n) return;
     if(n.nodeType===3) n=n.parentElement; if(!n) return;
     var k=n.tagName.toLowerCase()
       +(n.id?'#'+n.id:'')
       +(n.className&&typeof n.className==='string'&&n.className.trim()
         ?'.'+n.className.trim().split(/\s+/).slice(0,2).join('.'):'');
     window.__bronnen[k]=(window.__bronnen[k]||0)+e.value;
   });
 }); }).observe({type:'layout-shift',buffered:true});
 new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){
   window.__lcp=Math.max(window.__lcp,e.startTime); });
 }).observe({type:'largest-contentful-paint',buffered:true});
}catch(e){}
"""


def fout_met_stack(error):
    stack = getattr(error, 'stack', None)
    tekst = stack or str(error)
    return ' '.join(str(tekst).split())[:500]


def main():
    httpd = start_server()
    paginas = sorted(
        os.path.basename(f)[:-5] for f in glob.glob('*.html')
        if os.path.basename(f)[:-5] not in OVERSLAAN
    )
    problemen = {}
    gecontroleerd = 0

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for naam in paginas:
                gecontroleerd += 1
                fouten = []
                pagina = browser.new_page(viewport={'width': 1280, 'height': 900})
                pagina.add_init_script(METER)
                pagina.route('**://fonts.googleapis.com/**', lambda r: r.abort())
                pagina.route('**://fonts.gstatic.com/**', lambda r: r.abort())
                js_fouten = []
                pagina.on('pageerror', lambda e: js_fouten.append(fout_met_stack(e)))
                pagina.goto(
                    'http://127.0.0.1:%d/%s.html' % (POORT, naam),
                    wait_until='load'
                )
                pagina.wait_for_timeout(900)

                if js_fouten:
                    fouten.append('JavaScript-fout: %s' % js_fouten[0])

                # De browser valideert de werkelijk gerenderde canonical shell.
                # data-bg-component is het build-contract; v17-header/footer zijn
                # de zichtbare productiecomponenten en blijven dus ook geldig als
                # een serialisatiestap de marker niet bewaart.
                koppen = pagina.eval_on_selector_all(
                    '[data-bg-component="header"], header.v17-header', 'e=>e.length'
                )
                voeten = pagina.eval_on_selector_all(
                    '[data-bg-component="footer"], footer', 'e=>e.length'
                )
                h1s = pagina.eval_on_selector_all('h1', 'e=>e.length')

                if koppen != 1:
                    fouten.append('canonical header ontbreekt of staat er dubbel (%d gevonden)' % koppen)
                if voeten != 1:
                    fouten.append('canonical voettekst ontbreekt of staat er dubbel (%d gevonden)' % voeten)
                if h1s != 1:
                    fouten.append('%d keer een h1 — er hoort er precies één te zijn' % h1s)

                if naam not in GEEN_KRUIMEL and not pagina.eval_on_selector_all(
                    '[aria-label="Kruimelpad"], .bgkruim, .p-kruim', 'e=>e.length'
                ):
                    fouten.append('kruimelpad ontbreekt')

                titel = pagina.title()
                oms = pagina.eval_on_selector_all('meta[name="description"]', 'e=>e.map(x=>x.content)')
                canon = pagina.eval_on_selector_all('link[rel="canonical"]', 'e=>e.map(x=>x.href)')
                if not titel or len(titel) < 12:
                    fouten.append('titel ontbreekt of is te kort')
                if not oms or len(oms[0]) < 50:
                    fouten.append('meta-omschrijving ontbreekt of is te kort')
                if not canon and naam not in GEEN_CANONICAL:
                    fouten.append('canonical ontbreekt')

                links = pagina.eval_on_selector_all('a[href]', 'e=>[...new Set(e.map(x=>x.getAttribute("href")))]')
                intern = [href for href in links if intern_pad(href) is not None]
                dood = [href for href in intern if not bestaat(href)]
                if dood:
                    fouten.append('link gaat nergens heen: %s' % ', '.join(dood[:4]))

                vitals = pagina.evaluate('()=>({cls: window.__cls||0, lcp: Math.round(window.__lcp||0), bronnen: Object.entries(window.__bronnen||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]+" ("+x[1].toFixed(3)+")")})')
                if vitals['cls'] > 0.1:
                    fouten.append('layout verspringt tijdens het laden (CLS %.3f, grens 0,1) — schuldig: %s' % (vitals['cls'], ', '.join(vitals.get('bronnen') or ['onbekend']) or 'onbekend'))
                if vitals['lcp'] > 2500:
                    fouten.append('grootste element verschijnt pas na %d ms (grens 2500)' % vitals['lcp'])

                schema = pagina.eval_on_selector_all('script[type="application/ld+json"]', 'e=>e.map(x=>x.textContent)')
                if not schema and naam not in GEEN_SCHEMA:
                    fouten.append('geen gestructureerde data (JSON-LD)')
                for blok in schema:
                    try:
                        json.loads(blok)
                    except ValueError:
                        fouten.append('gestructureerde data is ongeldig JSON')
                        break

                zonder = pagina.eval_on_selector_all('img', '''e=>e.filter(x=>{if(x.getAttribute('width')&&x.getAttribute('height')) return false; const s=getComputedStyle(x); return !(s.width&&s.width!=='auto'&&s.height&&s.height!=='auto');}).map(x=>x.getAttribute('src')||'(zonder src)').slice(0,3)''')
                if zonder:
                    fouten.append('beeld zonder vaste afmeting: %s' % ', '.join(zonder))

                zonder_alt = pagina.eval_on_selector_all('img:not([alt])', 'e=>e.map(x=>x.getAttribute("src")||"?").slice(0,3)')
                if zonder_alt:
                    fouten.append('beeld zonder alt-tekst: %s' % ', '.join(zonder_alt))
                pagina.close()

                mob = browser.new_page(viewport={'width': 390, 'height': 844})
                mob.goto('http://127.0.0.1:%d/%s.html' % (POORT, naam), wait_until='load')
                mob.wait_for_timeout(600)
                if mob.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth + 2'):
                    schuldig = mob.evaluate("""()=>{const w=document.documentElement.clientWidth; const e=[...document.querySelectorAll('*')].find(x=>x.getBoundingClientRect().right>w+2); return e ? e.tagName+'.'+String(e.className).slice(0,40) : 'onbekend';}""")
                    fouten.append('loopt buiten beeld op een telefoon (%s)' % schuldig)
                mob.close()

                if fouten:
                    problemen[naam] = fouten
            browser.close()
    finally:
        httpd.shutdown()
        httpd.server_close()

    regels = ['# Paginacontrole', '', "%d pagina's gecontroleerd." % gecontroleerd, '']
    if problemen:
        aantal = len(problemen)
        regels.append('**%d pagina%s met een probleem.**' % (aantal, '' if aantal == 1 else "'s"))
        regels.append('')
        for naam, fouten in problemen.items():
            regels.append('### /%s' % naam)
            for fout in fouten:
                regels.append('- %s' % fout)
            regels.append('')
    else:
        regels.append('Geen problemen gevonden. Elke publieke pagina heeft de canonical shell, precies één h1, geldige basis-metadata, geen JavaScript-fouten, geen dode interne links en past op een telefoonscherm.')

    with open('rapport.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(regels) + '\n')
    print('\n'.join(regels))
    sys.exit(1 if problemen else 0)


if __name__ == '__main__':
    main()
