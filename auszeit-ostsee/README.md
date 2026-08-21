# Auszeit Ostsee — Website der Ferienwohnungen

Statische Website für zwei Ferienwohnungen an der Ostsee. Sie stellt die
Wohnungen vor und leitet für die eigentliche Buchung zu Airbnb weiter — eine
eigene Buchungslogik gibt es bewusst nicht.

Gebaut mit HTML5, CSS3 und JavaScript ohne Framework. Es gibt keine
Abhängigkeiten zur Laufzeit, keine Cookies und keine Verbindungen zu fremden
Servern, solange niemand die Karte lädt.

---

## Inhalt

1. [Website ansehen](#website-ansehen)
2. [Dateistruktur](#dateistruktur)
3. [Vor dem Livegang anpassen](#vor-dem-livegang-anpassen)
4. [Bilder austauschen](#bilder-austauschen)
5. [Weitere Wohnung hinzufügen](#weitere-wohnung-hinzufügen)
6. [Kontaktformular](#kontaktformular)
7. [Karte](#karte)
8. [Farben und Schrift](#farben-und-schrift)
9. [Veröffentlichen](#veröffentlichen)
10. [Barrierefreiheit und SEO](#barrierefreiheit-und-seo)

---

## Website ansehen

Die Seite ist rein statisch. Zum Ansehen genügt ein Doppelklick auf
`index.html`.

Für die Entwicklung ist ein lokaler Server besser, weil Schriften und
relative Pfade sich dann genauso verhalten wie später im Netz:

```bash
npm run serve       # startet http://localhost:8000
```

Alternativ ohne npm:

```bash
python3 -m http.server 8000
```

---

## Dateistruktur

```
.
├── index.html                  Startseite mit allen Abschnitten
├── impressum.html              Impressum nach § 5 DDG
├── datenschutz.html            Datenschutzerklärung nach DSGVO
├── favicon.svg                 Symbol für den Browser-Tab
├── robots.txt                  Hinweise für Suchmaschinen
├── sitemap.xml                 Seitenverzeichnis für Suchmaschinen
├── css/
│   └── styles.css              gesamtes Layout, in 16 Abschnitte gegliedert
├── js/
│   └── main.js                 acht kleine Module, jeweils klar abgegrenzt
├── fonts/
│   ├── inter-latin-variable.woff2
│   └── inter-latin-ext-variable.woff2
├── images/
│   ├── hero.jpg                großes Bild im Kopfbereich
│   ├── wohnung1.jpg            Auszeit Düne
│   ├── wohnung2.jpg            Auszeit Hafen
│   ├── gastgeber.jpg           Foto der Gastgeber
│   ├── karte-platzhalter.jpg   Vorschaubild der Karte
│   ├── og-image.jpg            Vorschau beim Teilen in sozialen Netzwerken
│   └── gallery/
│       └── galerie-01.jpg … galerie-08.jpg
├── tools/
│   ├── build.js                erzeugt die verkleinerte Fassung in dist/
│   └── generate-placeholders.py erzeugt die Platzhalter-Bilder neu
└── package.json
```

Alle Bilder im Auslieferungszustand sind **generierte Platzhalter**. Sie
tragen ihren Dateinamen in der unteren linken Ecke, damit sofort erkennbar
ist, welche Datei ersetzt werden muss. Sobald ein echtes Foto eingesetzt
wird, verschwindet die Beschriftung mit.

---

## Vor dem Livegang anpassen

Die folgende Liste enthält alles, was noch echte Daten braucht. Die
Platzhalter sind so gewählt, dass sie unübersehbar sind (`Musterstraße`,
`00000000`, `DE000000000`).

### 1. Airbnb-Links

Aktuell stehen überall Platzhalter-Adressen. Suchen und ersetzen in
`index.html`, `impressum.html` und `datenschutz.html`:

| Platzhalter | Bedeutung |
|---|---|
| `https://www.airbnb.de/users/show/00000000` | Ihr Airbnb-Profil (4× in `index.html`, je 2× in den Rechtsseiten) |
| `https://www.airbnb.de/rooms/00000001` | Inserat Auszeit Düne (2× in `index.html`, je 1× in den Rechtsseiten) |
| `https://www.airbnb.de/rooms/00000002` | Inserat Auszeit Hafen (2× in `index.html`, je 1× in den Rechtsseiten) |

### 2. Kontaktdaten und Namen

| Platzhalter | Wo |
|---|---|
| `Anne und Thomas Petersen` | alle drei Seiten |
| `kontakt@auszeit-mieten.de` | `index.html` (auch im Attribut `data-mail-to` des Formulars), beide Rechtsseiten |
| `+49 38825 000000` / `tel:+4938825000000` | alle drei Seiten |
| `Musterstraße 12`, `23946 Ostseebad Boltenhagen` | alle drei Seiten |

### 3. Domain

Die Beispiel-Domain `www.auszeit-mieten.de` steht in den `canonical`- und
`og:`-Angaben aller drei Seiten sowie in `robots.txt` und `sitemap.xml`.
Einmal projektweit ersetzen.

### 4. Rechtstexte

`impressum.html` und `datenschutz.html` beginnen jeweils mit einem gelb
hinterlegten Hinweiskasten. **Diesen Kasten erst entfernen, wenn die Angaben
geprüft sind** — er ist die Sicherung dagegen, dass ein Platzhalter-Impressum
online geht.

Zwei Punkte, die in vielen älteren Vorlagen noch falsch stehen und hier
bereits berücksichtigt sind:

- Die Impressumspflicht ergibt sich seit Mai 2024 aus **§ 5 DDG**, nicht mehr
  aus § 5 TMG.
- Die **OS-Plattform der EU-Kommission wurde zum 20. Juli 2025 eingestellt**.
  Der früher übliche Link darauf gehört nicht mehr ins Impressum.

Die Datenschutzerklärung beschreibt genau den Auslieferungszustand. Wird
später ein weiterer Dienst eingebunden — Formularversand, Statistik,
Newsletter, Buchungswidget — muss sie ergänzt werden.

Beide Texte sind sorgfältig erstellt, ersetzen aber keine Rechtsberatung.

### 5. Inhalte

Namen der Wohnungen, Beschreibungen, Ausstattung, Preise und Entfernungen
stehen direkt in `index.html` und sind dort kommentiert.

---

## Bilder austauschen

Einfach die Datei im Ordner `images/` durch ein eigenes Foto **mit demselben
Dateinamen** ersetzen. Am HTML muss dafür nichts geändert werden.

Empfohlene Größen — das Seitenverhältnis ist wichtiger als die exakte
Pixelzahl, weil die Bilder zugeschnitten dargestellt werden:

| Datei | Größe | Verhältnis |
|---|---|---|
| `hero.jpg` | 2400 × 1350 | 16:9 |
| `wohnung1.jpg`, `wohnung2.jpg` | 1600 × 1200 | 4:3 |
| `gastgeber.jpg` | 1200 × 1500 | 4:5 |
| `gallery/*.jpg` | 1400 × 1050 | 4:3 |
| `karte-platzhalter.jpg` | 1600 × 900 | 16:9 |
| `og-image.jpg` | 1200 × 630 | fest vorgegeben |

Hinweise:

- **Dateigröße** unter etwa 250 kB halten (JPEG, Qualität 80–85). Die
  Platzhalter liegen bei 40–90 kB.
- **Alternativtexte** in `index.html` mit anpassen. Sie stehen im Attribut
  `alt` und beschreiben, was zu sehen ist — wichtig für Screenreader und
  für die Bildersuche.
- **Kontrast im Kopfbereich:** Über `hero.jpg` liegt weiße Schrift. Der
  dunkle Verlauf darüber ist so eingestellt, dass die Schrift die
  WCAG-Stufe AA erreicht. Ist Ihr Foto in der linken Bildhälfte deutlich
  heller als der Platzhalter, prüfen Sie die Lesbarkeit und verstärken Sie
  bei Bedarf `.hero__scrim` in `css/styles.css`.
- Die Platzhalter lassen sich jederzeit neu erzeugen:
  `python3 tools/generate-placeholders.py` (benötigt `pip install Pillow`).

---

## Weitere Wohnung hinzufügen

Das Raster ist darauf ausgelegt. Am CSS muss nichts geändert werden — bei
drei Wohnungen entstehen automatisch drei Spalten, bei vier zwei Reihen.

1. Foto als `images/wohnung3.jpg` ablegen (4:3).
2. In `index.html` den Abschnitt `<!-- Wohnung 2 -->` samt zugehörigem
   `<article class="apartment">` kopieren und hinter der letzten Wohnung
   einfügen.
3. Im neuen Block anpassen: Bildpfad und `alt`, Name in `<h3>`, Preis,
   Lagezeile, Beschreibung, die Angaben in `.apartment__specs`, die Liste
   `.amenities` und den Airbnb-Link.
4. `reveal--delay-2` als Klasse ergänzen, damit die Karte beim Scrollen
   leicht versetzt erscheint (`reveal--delay-1` hat die zweite Karte).
5. Optional: den Eintrag im Footer unter „Buchung" und die Zahl im Abschnitt
   „Über uns" (`2 Ferienwohnungen`) sowie in der Kopfzeile mitziehen.

Verfügbare Symbole für die Ausstattung stehen ganz oben in `index.html` in
der Icon-Sammlung: `wifi`, `kitchen`, `balcony`, `sea`, `washer`, `parking`,
`tv`, `heating`, `pets`, `nonsmoking`, `bed`, `users`.

---

## Kontaktformular

Das Formular arbeitet **vollständig im Browser**. Es prüft die Eingaben und
öffnet anschließend das E-Mail-Programm der Besucher mit einer fertig
vorbereiteten Nachricht. Es gibt keinen Server, der etwas entgegennimmt —
deshalb wird auch niemandem eine Zustellung versprochen, die nicht
stattfindet.

Geprüft wird: Name vorhanden, E-Mail-Adresse plausibel, Nachricht mindestens
zehn Zeichen, Einwilligung gesetzt. Ein verstecktes Feld (Honeypot) fängt
einfache Spam-Bots ab.

**Echten Versand anbinden:** Dienste wie Formspree, Netlify Forms oder
Web3Forms brauchen nur ein `action`-Attribut am `<form>`. In `js/main.js`
entfällt dann der Block, der die `mailto`-Adresse zusammensetzt (im Modul
`initContactForm`), und statt `event.preventDefault()` wird das Formular nach
erfolgreicher Prüfung abgeschickt. **Wichtig:** In diesem Fall muss die
Datenschutzerklärung um den gewählten Dienst ergänzt werden.

---

## Karte

Die Karte im Abschnitt „Lage" lädt **nicht von selbst**. Zu sehen ist
zunächst nur ein Bild vom eigenen Server; erst ein Klick auf „Karte laden"
baut die Verbindung zu Google auf. Diese Zwei-Klick-Lösung ist der Grund,
warum die Seite ohne Einwilligungsbanner auskommt.

Die Adresse der Karte steht in `index.html` im Attribut `data-map-src` des
Elements `.map`. Dort lässt sich der Ort eintragen:

```html
data-map-src="https://www.google.com/maps?q=IHR+ORT&z=14&output=embed"
```

Wer ganz ohne Google auskommen möchte, kann stattdessen OpenStreetMap
einbinden — dann entfällt Abschnitt 7 der Datenschutzerklärung.

---

## Farben und Schrift

Alle Farben und Abstände liegen als CSS-Variablen ganz oben in
`css/styles.css` unter `:root`. Eine Änderung dort wirkt sich auf die
gesamte Seite aus.

```css
--c-sea:  #2f6a86;   /* Akzentfarbe, Schaltflächen, Links */
--c-ink:  #14232e;   /* Überschriften, Fußzeile */
--c-sand: #e8e0d4;   /* warmer Sandton */
```

Die Schrift **Inter** wird lokal aus `fonts/` geladen. Das ist bewusst so:
Bindet man Google Fonts direkt ein, wird bei jedem Seitenaufruf die
IP-Adresse der Besucher an Google übertragen — dafür wäre eine Einwilligung
nötig. Wer die Schrift wechselt, sollte die neue Datei ebenfalls lokal
ablegen und die beiden `@font-face`-Regeln in `css/styles.css` anpassen.

---

## Veröffentlichen

**Einfachster Weg:** den gesamten Ordner auf den Webspace laden — ohne
`tools/`, `dist/`, `package.json` und `README.md`. Fertig.

**Mit Optimierung:**

```bash
npm run build
```

Das Skript schreibt eine verkleinerte Fassung nach `dist/` (HTML, CSS und JS
ohne Kommentare und überflüssige Leerzeichen, Bilder unverändert). Die
Dateinamen bleiben gleich, `dist/` kann also unverändert hochgeladen werden.
Zusammen sind index.html, CSS und JS danach rund **16 kB** groß, komprimiert
übertragen.

Das Skript ist absichtlich zurückhaltend: Es benennt keine Variablen um und
prüft das Ergebnis vor dem Schreiben auf Syntaxfehler. Wer stärker
komprimieren möchte, ersetzt `minifyJs` in `tools/build.js` durch `terser`
oder `esbuild`.

Die Seite läuft auf jedem gewöhnlichen Webspace und ebenso auf GitHub Pages,
Netlify oder Cloudflare Pages. Ein Server-Backend wird nicht gebraucht.

---

## Barrierefreiheit und SEO

Berücksichtigt wurden:

- **Kontrast:** Alle Textfarben erreichen mindestens WCAG-Stufe AA
  (4,5:1 für Fließtext, 3:1 für große Überschriften) — auch die weiße
  Schrift über dem Kopfbild und über der Karte.
- **Tastatur:** Menü, Bildergalerie und Formular sind vollständig mit der
  Tastatur bedienbar. Menü und Lightbox halten den Fokus fest, `Esc`
  schließt sie, danach kehrt der Fokus an die Ausgangsstelle zurück. In der
  Lightbox blättern die Pfeiltasten.
- **Screenreader:** durchgehend semantische Elemente, ein Sprunglink zum
  Inhalt, beschriftete Bedienelemente, `aria-expanded` am Menü,
  Fehlermeldungen im Formular als `role="alert"`.
- **Bewegung:** Wer im Betriebssystem reduzierte Bewegung eingestellt hat,
  bekommt keine Einblendeffekte (`prefers-reduced-motion`).
- **Ohne JavaScript** bleiben alle Inhalte sichtbar und lesbar; nur Menü,
  Lightbox und Karte stehen dann nicht zur Verfügung.
- **SEO:** Titel und Beschreibung je Seite, Open-Graph-Angaben,
  `canonical`-Adressen, strukturierte Daten (schema.org `LodgingBusiness`
  und `Apartment`), `sitemap.xml` und `robots.txt`.
- **Ladezeit:** Bilder werden verzögert geladen (`loading="lazy"`), das
  Kopfbild dagegen bevorzugt (`fetchpriority="high"`). Alle Bilder haben
  feste Maße, damit beim Laden nichts springt.

Diese Punkte wurden während der Entwicklung in Chromium überprüft —
Bedienung mit der Tastatur, Struktur der Seite und gemessene Kontrastwerte,
jeweils gegen die Quelldateien und gegen die verkleinerte Fassung in
`dist/`. Die dafür genutzten Prüfskripte gehören nicht zum Lieferumfang;
das Repository bleibt bewusst ohne Abhängigkeiten.

---

## Browser

Aktuelle Fassungen von Chrome, Firefox, Safari und Edge. Genutzt werden
CSS Grid, `aspect-ratio`, benutzerdefinierte Eigenschaften und
`IntersectionObserver` — alle seit 2021 durchgehend verfügbar. In älteren
Browsern bleibt die Seite lesbar, einzelne Effekte entfallen.
