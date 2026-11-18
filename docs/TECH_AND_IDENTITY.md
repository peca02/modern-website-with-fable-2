# TARN: tehnologije i identitet sajta

Dva cilja ovog fajla:

1. Da objasni koje tehnologije sajt koristi i na koji način, kao recept za buduće sajtove ovog nivoa.
2. Da opiše šta je ovaj sajt po konceptu i izgledu, da se sledeći ne napravi sličan.

Tačne verzije paketa su u `CLAUDE.md` i `package.json`. Ovaj fajl je namerno na srpskom
(izuzetak od pravila da je sve u repozitorijumu na engleskom) jer ga čita vlasnik.

Stanje: napisano posle faze 5b. Faza 6 (doterivanje) menja detalje, ne ono što ovde piše.

## 1. Glavna ideja arhitekture

Sajt je jedna stranica sa dva sloja koja se ne mešaju:

- **DOM sloj** nosi sav stvarni sadržaj (naslovi, tekst, lista, klizač, navigacija). Renderuje
  ga server kao običan semantički HTML, pa je čitljiv i bez JavaScripta, WebGL-a i animacija.
- **WebGL sloj** je jedan fiksiran, providan canvas iza DOM-a. Čisto je dekorativan
  (`aria-hidden`) i prikazuje jednu neprekidnu 3D scenu koja se menja dok korisnik skroluje.

Dva sloja povezuje jedan deljeni objekat (`lib/store.ts`). GSAP u njega upisuje položaj
skrola, pokazivač i jačinu polja, a 3D scena ga čita u svakom frejmu. Veza ide i u drugom
smeru: scena u `store.anchors` upisuje ekranske koordinate 3D tačaka, pa DOM elementi mogu
da ih prate. Nema React state-a po frejmu i nema ponovnih renderovanja pri skrolu. To je
najvažniji obrazac celog projekta.

## 2. Tehnologije i kako su korišćene

### Next.js (App Router) i React

- **Uloga:** okvir aplikacije, statički render, fontovi, metadata.
- **Ovde:** jedna ruta (`app/page.tsx`), sve je statički prerenderovano. Šest poglavlja su
  serverske komponente (`components/chapters/`); klijentske komponente su male i dodaju samo
  pokret i interakciju. Uključen je React Compiler.
- **Obrazac vredan ponavljanja:** sve što dira `three` živi u `scene/` i učitava se kroz
  `next/dynamic` sa `ssr: false` (`components/SceneMount.tsx`), pa 3D kod nije u početnom
  paketu i tekst se vidi odmah.
- **Dodatno:** OG slika i ikona se generišu u kodu (`app/opengraph-image.tsx`, `app/icon.tsx`)
  iz istih vektorskih putanja kao rezervni crtež (`lib/drop.ts`). OG slika pri buildu
  preuzme Archivo i Instrument Sans sa Google Fonts (samo slova koja koristi, TTF jer Satori
  ne čita WOFF2); ako preuzimanje ne uspe, koristi ugrađeni font i build ne puca.

### TypeScript (strict) i ESLint

- **Uloga:** hvatanje grešaka pre pokretanja.
- **Ovde:** bez `any` i bez gašenja pravila. Lint sadrži pravila React Compilera, koja
  zabranjuju menjanje memoizovanih vrednosti; zato se uniforme shadera pišu kroz ref-ove
  ili instance klasa (`scene/liquid/LiquidMaterial.ts`).

### Tailwind CSS 4

- **Uloga:** stilovi kroz dizajn tokene.
- **Ovde:** sve boje, veličine fonta, razmaci slova i krive animacije su CSS promenljive u
  `app/globals.css` (`@theme`). Podrazumevana Tailwind paleta je isključena, pa komponenta
  ne može da upotrebi boju van palete.
- **Obrasci vredni ponavljanja:**
  - složene tipografske klase (`type-hero`, `type-display`, `type-title`, `type-micro`) koje
    odjednom postavljaju font, veličinu, prored i razmak slova;
  - fluidne veličine sa `clamp()`, pa nema posebnih veličina po breakpointu;
  - jedna mreža stranice (`page-grid`: 4 kolone na telefonu, 12 od tableta);
  - sopstvene varijante za stanje umesto pravila u `@layer base`: `wide:` (pejzažni odnos
    strana, tekst ide u bočnu kolonu), `scene-live:`, `scripting:`, `fine:`,
    `in-data-pinned:`, `in-data-loaded:`;
  - `text-shadow-halo`, svetli oreol iza teksta koji stoji preko scene, kao osiguranje.

### three.js i React Three Fiber

- **Uloga:** 3D render (WebGL 2 + GLSL), React omotač.
- **Ovde:** jedan `<Canvas>` (`scene/Scene.tsx`). Sve je proceduralno: nema modela, tekstura
  ni slika. Nema ni mreže za tečnost: ona se crta raymarching-om.
- **Delovi scene:**
  - **Tečnost (raymarched SDF):** `scene/liquid/shaders.ts` u jednoj kutiji prati zrak kroz
    polje udaljenosti: do osam kugli spojenih glatkim minimumom, šestougaona rešetka kupa za
    šiljke, radijalni šiljci na kugli, zaobljena ploča. Piše `gl_FragDepth`, pa se čestice
    ispravno sakrivaju iza nje.
  - **Poze:** svako stanje tečnosti je jedan ravan niz brojeva (`scene/liquid/model.ts`,
    `poses.ts`). Prelaz između stanja je prosta interpolacija dva niza, pa se oblik pretapa
    bez reza.
  - **Analitički studio:** okruženje koje se ogleda u tečnosti nije slika nego formula u
    shaderu (svetlosna kutija, bela traka, jedna tanka plava traka, tabla sa natpisom).
    Natpis brenda se crta na canvas teksturu (`wordmark.ts`) i čita se u odrazu.
  - **Čestice (GPGPU):** položaji zrnaca žive u teksturi koju shader ažurira svaki frejm
    (`scene/grains/`). Svako zrno ima ciljni oblik izračunat formulom (linije dipolnog
    polja, gomilice u rešetki, prstenovi oko kapljica, oreol, okvir, ljuska) i prati ga uz
    curl-noise turbulenciju. Crtaju se kao tamni neprovidni diskovi.
  - **Isti model na CPU i GPU:** `model.ts` nema `three` uvoz i generiše GLSL konstante iz
    istih brojeva koje koristi JavaScript, pa DOM etikete prate vrhove šiljaka, a redovi
    liste visinu kapljica.
  - **Režija:** `scene/direction.ts` je lista kadrova: ključevi za kameru, pozu i oblik
    zrnaca, plus trake brojeva. `Director.tsx` ih uzorkuje iz položaja skrola. Sav tajming
    scene je na jednom mestu.
- **Iz Drei-a:** samo `PerformanceMonitor`.

### Bez postprocessinga

- **Odluka:** nema WebGL prolaza posle rendera. Canvas je providan preko CSS boje stranice,
  senka kontakta je alfa, a zrno je statičan SVG šum u DOM-u (`components/GrainOverlay.tsx`).
- **Zašto je vredno ponavljanja:** svetla stranica nema šav između canvasa i pozadine, a
  slab uređaj ne plaća efekte.

### GSAP (ScrollTrigger, ScrollSmoother, SplitText) i `@gsap/react`

- **Uloga:** sve DOM animacije i skrol.
- **Ovde:**
  - `lib/gsap.ts` registruje pluginove jednom i definiše motion jezik (krive `settle` i
    `tension`, tri trajanja);
  - ScrollSmoother daje glatki skrol; fiksirani elementi stoje van njegovog omotača;
  - ScrollTrigger pinuje tri poglavlja (Crown, Part, Hold) i upisuje napredak u store;
  - SplitText otkriva tekst red po red iz maske, tek kad se fontovi učitaju i preloader pusti;
  - `gsap.matchMedia()` daje varijantu za `prefers-reduced-motion`: bez pinova i glatkog
    skrola, a svako poglavlje tada pokazuje svoje stanje scene (`unpinnedStory`).
- **Obrasci vredni ponavljanja:**
  - poglavlje je običan vertikalni tok u HTML-u, a klijentska komponenta postavi
    `data-pinned` kad je pokret dozvoljen; varijanta `in-data-pinned:` pretvara tok u scenu;
  - brojevi koje dele oba sloja (kritično polje, dužine pinova) stoje u `lib/beats.ts`;
  - sajt sam vraća položaj skrola posle osvežavanja, tek kad pinovi postoje.

### Web Audio API

- **Uloga:** zvuk bez audio fajlova.
- **Ovde:** `lib/audio.ts` sintetiše dron koji prati jačinu polja, akord po poglavlju, šum
  koji prati brzinu skrola i dva kratka UI zvuka. Kontekst se pravi tek na prvi klik i
  suspenduje se kad je zvuk isključen ili je kartica skrivena.

### React Icons, next/font

- Ikone isključivo iz `react-icons`. Fontovi kroz `next/font` (bez spoljnih CSS-ova);
  jedini izuzetak je OG slika (vidi gore).

### Playwright (samo za razvoj)

- **Uloga:** provera izgleda i toka bez pravog browsera.
- **Ovde:** `scripts/shots.mjs` pravi screenshot jednog poglavlja na jednoj širini;
  `scripts/flow.mjs` prolazi 44 provere (preloader, tastatura, klizač, zvuk, osvežavanje,
  bez WebGL-a, izgubljen kontekst, zaglavljeno učitavanje, smanjeno kretanje, bez JavaScripta).
- **Pouka:** u oblaku scena radi na procesoru, oko jedan kadar u sekundi. Skripte moraju da
  čekaju stanje (atribut na `<html>`), a ne fiksno vreme, i jedan snimak traje minut-dva.
  Snimak čeka i da se nijedan red teksta na ekranu više ne pomera, inače široki ekrani
  uhvate naslove usred otkrivanja.

## 3. Obrasci koji čine razliku

- **Adaptivni kvalitet:** četiri nivoa (`lib/quality.ts`: DPR, broj koraka raymarcha,
  veličina teksture čestica) biraju se po uređaju i spuštaju ako frame rate padne.
- **Preloader vezan za stvarno učitavanje:** `lib/loadClock.ts` prati faze (kod scene,
  kontekst, shaderi, prvi kadar, fontovi). Napredak je masa kapi koja raste, a ta kap bez
  reza postaje subjekat prvog poglavlja.
- **Otpornost:** SVG crtež kad nema WebGL-a, skripti ili se kontekst izgubi, i vremensko
  ograničenje posle kog se preloader sam oslobađa.
- **Kadriranje po obliku ekrana:** kamera pomera subjekat pomeranjem sočiva (lens shift), a
  ne okretanjem, u stranu na širokom ekranu i nagore ili nadole na portretnom, da tekst uvek
  ima svoj prostor. Svaki kadar ima svoje vrednosti za široki i za portretni ekran.
- **DOM koji prati 3D:** etikete na vrhovima šiljaka i redovi liste pored kapljica, preko
  `store.anchors`. Etikete stoje u redu iznad krune, svaka spojena sa svojim vrhom kratkom
  punom crtom; klize bočno dok crta pogađa etiketu, a tek onda prelaze red više. Veza ide
  u oba smera: hover ili dodir reda nadima kapljicu, a pokazivanje na kapljicu boji red.
- **Pritisni i drži:** držanje miša na kapi diže mali šiljak ka pokazivaču (opruga), a dron
  raste; skrol ga prekida.
- **Pravi DOM element upravlja scenom:** `<input type="range">` za jačinu polja; ista
  vrednost menja šiljke, težinu slova u naslovu (osa fonta) i visinu drona.
- **Meniskus u DOM-u:** SVG goo filter na malom fiksnom sloju spaja kursor-kap sa
  navigacijom i dugmetom za zvuk.
- **Sadržaj na jednom mestu:** sav tekst u `lib/content.ts`, boje u `app/globals.css` i
  `lib/palette.ts`, pravila u `docs/ART_DIRECTION.md`.

## 4. Recept za sledeći sajt ovog tipa

1. Izaberi nišu koja daje jedan jak centralni 3D subjekat sa više stanja.
2. Napiši art direkciju i motion jezik pre koda (paleta, fontovi, vizuelni potpis).
3. Postavi temelj: tokeni, store, skrol, canvas, nivoi kvaliteta.
4. Napravi scenu i režiju kamere sa privremenim DOM-om; prvo jedno stanje do kraja, pa ostala.
5. Dodaj poglavlja kao semantički HTML, pa pokret preko njih.
6. Tek onda preloader, kursor, zvuk, rezervni crtež.
7. Na kraju pregledaj svako poglavlje na pet širina, telefon i smanjeno kretanje, pa proveri
   na pravim uređajima.

Radi po fazama, jedna faza po sesiji, sa kratkim `docs/SESSION_SUMMARY.md` za primopredaju.

## 5. Identitet ovog sajta: šta sledeći ne sme da ponovi

### Koncept

- **Niša:** ferofluid, magnetna tečnost koja dobija oblik od polja.
- **Brend:** TARN („planinsko jezerce"), fiktivni studio za materijale koji pravi magnetnu
  tečnost i polja koja je oblikuju.
- **Priča:** tečnost bez sopstvenog oblika i nevidljiva sila koja joj ga daje.
- **Poglavlja:** Still, Reach, Crown, Part, Hold, Settle (miruje, pruža se, diže krunu
  šiljaka, deli se na četiri kapi, drži tri zadata oblika, smiruje se u baru).
- **Glas teksta:** miran, opipljiv, opisni; srednje duge rečenice sa glagolima materije
  (pool, bead, crown, reach, settle, part, hold). Brojke su retke.

### Vizuelni identitet

- **Vizuelni potpis:** masa i sjaj. Jedno telo ogledalno-crne tečnosti na svetloj stranici,
  teška široka slova, pune crne forme koje se spajaju kao kapi. Bez linija, niti i kartica.
- **Paleta:** svetla, hladna pozadina boje porcelana (`#edeff1`), čisto crn tekst i tečnost
  (`#000000`), sivi tonovi (`#f7f8f9`, `#d3d8de`, `#4a4f57`) i jedan redak akcenat,
  ultramarin plava „field" (`#2433ff`).
- **Tipografija:** Archivo (promenljive ose težine i širine; širok i crn za naslove, sužen
  za sitne oznake) i Instrument Sans za tekući tekst. Bez serifa i bez monospace fonta.
- **Centralni objekat:** sjajna crna kap koja ogleda studio i natpis brenda, okružena
  tamnim zrncima koja crtaju linije polja.
- **Pokret:** viskozan; dolasci se smiruju bez prebačaja, tekst se diže iz maske kao nivo
  tečnosti.
- **Potpisni momenti:** preloader kao kap koja raste; natpis u odrazu; klizač polja koji
  diže šiljke i deblja slova; lista čiji redovi stoje uz kapljice i odgovaraju im;
  pritisni i drži; kursor-kap.

### Prethodni sajt (SKEIN), da se ni on ne ponovi

Fuzija i stelarator, tamna stranica, narandžasti akcenat, užarene niti i hairline linije,
hairline serif, rečnik tkanja.

Sledeći sajt treba da se razlikuje od oba u svemu navedenom: druga niša i priča, drugi
centralni objekat, druga boja akcenta i ton stranice, drugi vizuelni potpis i glas teksta.
Tehnologije i obrasci iz odeljaka 1 do 4 mogu da ostanu isti.
