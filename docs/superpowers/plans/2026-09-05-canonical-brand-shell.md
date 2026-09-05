# Canonical Brand Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak van Bedrijfsgeheugen één component-gedreven merk-shell waarbij header, menu, trustbar, hero en footer onafhankelijk beheerd en sitebreed identiek afgedwongen worden.

**Architecture:** Introduceer een canonical `tools/site-shell/` module met componentrenderers, slotcontracts, page-policy en post-build verificatie. Bestaande builders blijven pagina-inhoud genereren, maar globale shell-componenten worden uitsluitend door de nieuwe shell-engine aangebracht; `/prijzen` verliest zijn eigen header/menu-implementatie.

**Tech Stack:** Node.js ES modules, statische HTML, bestaande Netlify build pipeline, GitHub Actions/Netlify deploy preview.

**Spec:** `docs/superpowers/specs/2026-09-05-canonical-brand-shell-design.md`

## Global Constraints

- Geen frameworkmigratie; output blijft statische HTML.
- Eén canonical bron voor TrustBar, Header/Navigation, MobileMenu en Footer.
- `/prijzen` gebruikt exact dezelfde globale shell als andere openbare pagina's.
- Pricing-tools bestaan uitsluitend op `/prijzen`.
- Contactgegevens bestaan uitsluitend in de footer.
- Componentmarkers zijn verplicht en uniek per pagina.
- Build faalt bij afwijkende globale componenthashes.

---

### Task 1: Canonical component contract en regressietests

**Files:**
- Create: `tools/site-shell/contracts.mjs`
- Create: `tools/site-shell/test-shell-components.mjs`
- Create: `tools/site-shell/verify-shell.mjs`

**Interfaces:**
- Produces: `GLOBAL_COMPONENTS`, `PUBLIC_PAGE_EXCLUDES`, `componentHash(html, name)`, `verifyPageShell(html, path)`.

- [ ] **Step 1: Schrijf een falende test voor canonical markers**

Test fixture bevat twee pagina's met verschillende headers en verwacht dat `verifyPageShell` de afwijking afkeurt.

- [ ] **Step 2: Draai de test en bevestig dat hij faalt**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: FAIL omdat contracts/verifier nog ontbreken.

- [ ] **Step 3: Implementeer contracts en componenthashing**

Gebruik SHA-256 uit `node:crypto`; markers zijn `data-bg-component="trustbar|header|mobile-menu|hero|main|page-tools|footer"`.

- [ ] **Step 4: Implementeer page-verificatie**

Controleer unieke markers, verboden pricing-shell selectors en pricing-tools policy.

- [ ] **Step 5: Draai de unit test opnieuw**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: PASS.

### Task 2: Canonical componentrenderers

**Files:**
- Create: `tools/site-shell/components.mjs`
- Modify: `tools/site-shell/test-shell-components.mjs`

**Interfaces:**
- Produces: `renderTrustBar()`, `renderHeader()`, `renderMobileMenu()`, `renderFooter()`, `renderHero(config)`.

- [ ] **Step 1: Voeg tests toe voor deterministische renderers**

Controleer dat tweemaal renderen byte-identiek is, alle interne merklinks absolute `https://www.bedrijfsgeheugen.nl/...` hrefs gebruiken waar de menucontracten dat vereisen, en globale componentmarkers bevatten.

- [ ] **Step 2: Draai test rood**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: FAIL omdat renderers ontbreken.

- [ ] **Step 3: Implementeer canonical markup**

Baseer de visuele header/nav/footer op de huidige hoofdwebsite-shell. De header is donker marine/blauw en de mobiele drawer is één gedeelde implementatie.

- [ ] **Step 4: Draai test groen**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: PASS.

### Task 3: Shell-engine met onafhankelijke slots

**Files:**
- Create: `tools/site-shell/apply-shell.mjs`
- Modify: `tools/uniforme-schil.mjs`
- Modify: `tools/site-shell/test-shell-components.mjs`

**Interfaces:**
- Produces: `applyCanonicalShell(html, { path, pageType, hero })`.
- Consumes: canonical renderers en contracts.

- [ ] **Step 1: Voeg fixturetests toe voor slotvervanging**

Bewijs dat veranderen van `Footer` geen wijziging veroorzaakt in de geëxtraheerde `Header`, `Hero` of `MainContent` fixture.

- [ ] **Step 2: Draai test rood**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: FAIL op ontbrekende shell-engine.

- [ ] **Step 3: Implementeer slotgerichte vervanging**

Vervang globale componenten via stabiele markers; voor historische pagina's mag een eenmalige migratie-adapter bestaande `<header class="v17-header">`, `bgkop` en footer herkennen, waarna output altijd markers bevat.

- [ ] **Step 4: Maak `uniforme-schil.mjs` een dunne wrapper**

Behoud pagina-SEO en `<main>`-inhoud; laat de shell-engine globale componenten aanbrengen.

- [ ] **Step 5: Draai test groen**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: PASS.

### Task 4: Prijzen migreren naar dezelfde shell

**Files:**
- Modify: `tools/normaliseer-site-ui.mjs`
- Modify: `tools/prijzen-uit-de-homepage.mjs`
- Modify: `prijzen.html` alleen indien bronoutput nog legacy markup bevat
- Modify: `tools/site-shell/test-shell-components.mjs`

**Interfaces:**
- Consumes: `applyCanonicalShell`.
- Policy: `pageType: 'pricing'` activeert uitsluitend pricing-tools.

- [ ] **Step 1: Voeg test toe die legacy witte/pricing header verbiedt**

Verbied `#bgkopMob.bgkop-mob` pricing-specifieke CSS, losse `bgkop` shell en afwijkende globale componenthash.

- [ ] **Step 2: Draai test rood**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: FAIL op huidige pricing-special-case.

- [ ] **Step 3: Verwijder pricing-specifieke globale shellcode**

Laat `normaliseer-site-ui.mjs` alleen page-policy uitvoeren of vervang het door een dunne compatibiliteitswrapper. Header/menu/footer komen uitsluitend uit `site-shell`.

- [ ] **Step 4: Behoud pricing-tools als page component**

`Vraag`, `Reken`, `Rol` blijven onder `data-bg-component="page-tools"` alleen op `/prijzen`.

- [ ] **Step 5: Draai test groen**

Run: `node tools/site-shell/test-shell-components.mjs`
Expected: PASS.

### Task 5: Estate-wide post-build gate

**Files:**
- Modify: `tools/controleer-site-ui.mjs`
- Modify: `tools/prijzen-uit-de-homepage.mjs`
- Modify: `netlify.toml` alleen indien een expliciete verifier-call nodig is

**Interfaces:**
- Consumes: `verifyPageShell` en globale componenthashes.

- [ ] **Step 1: Laat verifier alle openbare HTML doorlopen**

Controleer minimaal `/`, `/prijzen`, `/oplossingen`, `/product`, `/kennis`, `/over-ons`, cases en blogcontent; sluit portaal/login-apps expliciet uit.

- [ ] **Step 2: Voeg cross-page hashcontrole toe**

TrustBar/Header/MobileMenu/Footer moeten per build exact dezelfde hash hebben op alle publieke pagina's.

- [ ] **Step 3: Draai volledige lokale buildgate**

Run: `node tools/bouw-powerhouse-auth.mjs && node tools/bouw-kennisindex.mjs && node tools/bouw-v18-production.mjs && node tools/apply-tabbladen.mjs && node tools/bouw-v18-views.mjs && node tools/bouw-v18-chrome-alles.mjs && node tools/prijzen-uit-de-homepage.mjs && node tools/bouw-release-evidence.mjs`
Expected: exit 0 en shell-verificatie PASS.

### Task 6: Deploy preview en productie-readback

**Files:**
- Geen extra bronbestanden tenzij readback een defect toont.

**Interfaces:**
- Deploy preview via bestaande Netlify PR-integratie.

- [ ] **Step 1: Open PR tegen `main`**

- [ ] **Step 2: Controleer vereiste GitHub test en Netlify deploy preview**

Expected: alle vereiste checks groen, deploy `ready`.

- [ ] **Step 3: Readback op representatieve pagina's**

Controleer `/`, `/prijzen`, `/oplossingen`, `/product`, `/kennis`, `/over-ons` op dezelfde headerkleur, logo, menuknop, drawer, trustbar en footer.

- [ ] **Step 4: Merge alleen bij groene gates**

- [ ] **Step 5: Controleer productie-deploy en commit SHA**

Expected: Netlify production `ready` op de mergecommit.
