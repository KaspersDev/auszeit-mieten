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
3. [Seitenstruktur und Navigation](#seitenstruktur-und-navigation)
4. [Platzhalter ersetzen](#platzhalter-ersetzen)
5. [Vor dem Livegang anpassen](#vor-dem-livegang-anpassen)
6. [Bilder austauschen](#bilder-austauschen)
7. [Weitere Wohnung hinzufügen](#weitere-wohnung-hinzufügen)
8. [Anfrageformular](#anfrageformular)
9. [Belegungskalender einrichten (IONOS)](#belegungskalender-einrichten-ionos)
10. [Wie eine Buchung abläuft](#wie-eine-buchung-abläuft)
11. [Karte](#karte)
12. [Farben und Schrift](#farben-und-schrift)
13. [Veröffentlichen](#veröffentlichen)
14. [Barrierefreiheit und SEO](#barrierefreiheit-und-seo)

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
├── wohnung-duene.html          Detailseite Ferienwohnung „Auszeit Düne"
├── wohnung-hafen.html          Detailseite Ferienwohnung „Auszeit Hafen"
├── whirlpool.html              Detailseite Whirlpool-Anhänger
├── impressum.html              Impressum nach § 5 DDG
├── datenschutz.html            Datenschutzerklärung nach DSGVO
├── favicon.svg                 Symbol für den Browser-Tab
├── robots.txt                  Hinweise für Suchmaschinen
├── sitemap.xml                 Seitenverzeichnis für Suchmaschinen
├── css/
│   └── styles.css              gesamtes Layout, in 17 Abschnitte gegliedert
├── api/                        PHP-Teil für den Belegungskalender
│   ├── config.beispiel.php     Vorlage — zu config.php kopieren
│   ├── verfuegbarkeit.php      belegte Tage als JSON
│   ├── reservierung.php        Anfragen annehmen
│   ├── bestaetigen.php         Bestätigen oder Ablehnen
│   ├── kalender.php            eigener iCal-Feed je Angebot
│   └── lib/                    iCal, Ablage, Helfer
├── daten/                      Reservierungen (von außen gesperrt)
├── js/
│   ├── angebote.js             zentrale Konfiguration der drei Angebote
│   ├── kalender.js             Belegungskalender im Formular
│   └── main.js                 elf kleine Module, jeweils klar abgegrenzt
├── fonts/
│   ├── fraunces-latin-variable.woff2
│   ├── fraunces-latin-ext-variable.woff2
│   ├── figtree-latin-variable.woff2
│   └── figtree-latin-ext-variable.woff2
├── images/
│   ├── hero.jpg                großes Bild im Kopfbereich
│   ├── wohnung1.jpg            Auszeit Düne
│   ├── wohnung2.jpg            Auszeit Hafen
│   ├── gastgeber.jpg           Foto der Gastgeber
│   ├── karte-platzhalter.jpg   Vorschaubild der Karte
│   ├── og-image.jpg            Vorschau beim Teilen in sozialen Netzwerken
│   ├── whirlpool/              Bilder des Whirlpool-Anhängers
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

## Seitenstruktur und Navigation

Die Website besteht aus einer Startseite mit allen Abschnitten und aus
eigenen Seiten für die einzelnen Wohnungen:

```
index.html               Startseite
  #start                   Kopfbereich
  #ueber-uns               Über uns
  #wohnungen               Übersicht beider Wohnungen
  #galerie                 Eindrücke — drei getrennte Galerien
  #lage                    Lage — mit Auswahlschalter je Angebot
  #kontakt                 Anfrage — mit Auswahlschalter und Zeitraum

wohnung-duene.html       Detailseite „Auszeit Düne"
wohnung-hafen.html       Detailseite „Auszeit Hafen"
whirlpool.html           Detailseite Whirlpool-Anhänger
impressum.html           Impressum
datenschutz.html         Datenschutzerklärung
```

Die Hauptnavigation steht in dieser Reihenfolge: **Startseite · Über uns ·
Wohnungen · Whirlpool · Kontakt**. „Wohnungen" ist ein aufklappbarer Punkt und besteht
aus zwei Bedienelementen:

- der **Link** führt zur Übersicht `index.html#wohnungen`,
- der **Knopf** daneben (Pfeil nach unten) klappt die Liste der einzelnen
  Wohnungen auf.

Diese Trennung ist Absicht. Wäre der Name selbst der Auslöser, müsste man
sich auf dem Touchscreen zwischen „Übersicht öffnen" und „Liste aufklappen"
entscheiden — so geht beides. Am Rechner öffnet die Liste zusätzlich beim
Überfahren mit der Maus, mit der Tastatur über Enter auf dem Knopf; `Esc`
schließt sie wieder.

### Der Auswahlschalter

„Lage" und „Anfrage" nutzen denselben optischen Baustein, um zwischen den
drei Angeboten zu wechseln — mit einem Unterschied im Aufbau:

- In **„Lage"** ist es eine Tabliste (`role="tablist"`). Ein Klick blendet
  den passenden Bereich ein; die Pfeiltasten, `Pos1` und `Ende` wechseln
  durch.
- Im **Anfrageformular** sind es echte Radiofelder. Dadurch funktionieren
  Tastaturbedienung und Formularübergabe ohne eigenen Code, und die Auswahl
  landet automatisch in der E-Mail.

Beide sehen gleich aus (`.segmented` in `css/styles.css`). Auf schmalen
Bildschirmen bleiben die drei Optionen nebeneinander, nur die Zusatzzeile
(„Wohnung 1" usw.) wird ausgeblendet.

Der Kopf- und Fußbereich ist auf **allen** Seiten identisch. Wird dort etwas
geändert, muss die Änderung in `index.html`, `wohnung-duene.html`,
`wohnung-hafen.html`, `impressum.html` und `datenschutz.html` nachgezogen
werden — die Seite ist bewusst rein statisch und hat keine Vorlagen-Technik.

---

## Platzhalter ersetzen

Alles, was noch echte Inhalte braucht, ist im Quelltext mit `TODO`
markiert. So finden Sie alle Stellen auf einmal — in VS Code mit
`Strg+Umschalt+F` nach `TODO` suchen.

### Whirlpool-Anhänger

Das Angebot ist vollständig angelegt, aber mit Platzhaltern gefüllt.

| Was | Wo |
|---|---|
| Überschrift, Einleitung, Beschreibung | `whirlpool.html`, Abschnitte mit `TODO` |
| Eckdaten (Personen, Wasserinhalt, Aufheizzeit, Anschluss) | `whirlpool.html`, Block „Eckdaten" |
| **Preisliste** (Staffel, Kaution, Kilometerpauschale) | `whirlpool.html`, Block `booking-card` |
| Leistungen „Im Preis enthalten" | `whirlpool.html` |
| Bilder | `images/whirlpool/` — Dateinamen beibehalten, dann ist am HTML nichts zu ändern |

### Bilder der drei Galerien

Die „Eindrücke" auf der Startseite sind in drei Blöcke geteilt. Jeder Block
ist im HTML mit `TODO Bilder …` markiert:

| Galerie | Bilder liegen in |
|---|---|
| Auszeit Düne | `images/gallery/` |
| Auszeit Hafen | `images/gallery/` |
| Whirlpool-Anhänger | `images/whirlpool/` |

### Karten, Adressen und Kalender

Diese Angaben stehen **nur an einer Stelle**: in `js/angebote.js`. Dort
tragen Sie je Angebot ein:

- `kartenUrl` — die Google-Maps-Adresse für die Kartenansicht
- `adresse` — die Anschrift
- `adresseHinweis` — die Zeile, die unter der Karte erscheint
- `icalImport` — später die Kalenderadressen von Airbnb und Booking.com

Die Startseite liest diese Werte aus; im HTML ist nichts anzupassen.

**Wie Sie an eine Karten-Adresse kommen:** In Google Maps den Ort suchen,
auf „Teilen" → „Karte einbetten" klicken und aus dem `<iframe>` nur den
Wert von `src` kopieren.

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
   `.amenities`, den Link auf die neue Detailseite und den Airbnb-Link.
4. `reveal--delay-2` als Klasse ergänzen, damit die Karte beim Scrollen
   leicht versetzt erscheint (`reveal--delay-1` hat die zweite Karte).
5. **Detailseite anlegen:** `wohnung-duene.html` kopieren, zum Beispiel nach
   `wohnung-strand.html`, und darin Titel, `<link rel="canonical">`, die
   Open-Graph-Angaben, den JSON-LD-Block sowie alle Inhalte ersetzen. Die
   Karte „Die andere Wohnung" am Seitenende ebenfalls anpassen.
6. **Untermenü ergänzen:** in *allen* HTML-Dateien im Block
   `<ul class="nav__menu" id="untermenue-wohnungen">` einen Eintrag nach dem
   Muster der bestehenden hinzufügen. Am CSS und am JavaScript ist nichts zu
   ändern — beides arbeitet mit beliebig vielen Einträgen.
7. `sitemap.xml` und die Liste `FILES` in `tools/build.js` erweitern.
8. Optional: den Eintrag im Footer unter „Ferienwohnungen" und die Zahl im
   Abschnitt „Über uns" (`2 Ferienwohnungen`) mitziehen.

Verfügbare Symbole für die Ausstattung stehen ganz oben in `index.html` in
der Icon-Sammlung: `wifi`, `kitchen`, `balcony`, `sea`, `washer`, `parking`,
`tv`, `heating`, `pets`, `nonsmoking`, `bed`, `users`.

---

## Anfrageformular

Das Formular auf der Startseite ist eine **Terminanfrage**, keine Buchung.
Es arbeitet vollständig im Browser: Es prüft die Eingaben und öffnet
anschließend das E-Mail-Programm der Besucher mit einer fertig
vorbereiteten Nachricht. Es gibt keinen Server, der etwas entgegennimmt.

Die vorbereitete E-Mail enthält:

- das gewählte **Angebot** (Düne, Hafen oder Whirlpool)
- **Anreise und Abreise** in deutscher Schreibweise
- ob der Zeitraum **reserviert** werden soll
- Name, E-Mail-Adresse und die Nachricht

Der Betreff trägt Angebot und Zeitraum, damit Anfragen schon im
Posteingang unterscheidbar sind — zum Beispiel
`Reservierungswunsch: Whirlpool, 20.11.2026 bis 23.11.2026`.

Geprüft wird: Anreise und Abreise gesetzt, Abreise nach Anreise, Name
vorhanden, E-Mail plausibel, Nachricht mindestens zehn Zeichen,
Einwilligung gesetzt. Ein verstecktes Feld (Honeypot) fängt einfache
Spam-Bots ab.

**Noch nicht enthalten:** der Belegungskalender mit gesperrten Terminen.
Solange er fehlt, stehen an seiner Stelle zwei gewöhnliche Datumsfelder.
Sie sind im HTML als Platzhalter gekennzeichnet.

**Echten Versand anbinden:** Dienste wie Formspree, Netlify Forms oder
Web3Forms brauchen nur ein `action`-Attribut am `<form>`. In `js/main.js`
entfällt dann der Block, der die `mailto`-Adresse zusammensetzt (im Modul
`initContactForm`). **Wichtig:** In diesem Fall muss die
Datenschutzerklärung um den gewählten Dienst ergänzt werden.

---

## Belegungskalender einrichten (IONOS)

Der Kalender im Anfrageformular zeigt belegte Tage aus Airbnb und
Booking.com und sperrt sie. Dafür laufen fünf PHP-Dateien im Ordner
`api/`. Sie brauchen keinen zusätzlichen Dienst — IONOS liefert PHP mit.

### Schritt 1: Konfiguration anlegen

`api/config.beispiel.php` kopieren und in `api/config.php` umbenennen.
Dann ausfüllen:

| Wert | Was hinein muss |
|---|---|
| `empfaenger` | Ihre E-Mail-Adresse — dorthin gehen die Anfragen |
| `absender` | Absenderadresse **Ihrer Domain**, sonst landet die Mail im Spam |
| `geheimnis` | eine lange Zufallszeichenkette, siehe unten |
| `basis_url` | `https://www.ihre-domain.de`, ohne Schrägstrich am Ende |
| `ical_import` | die Kalenderadressen aus Airbnb und Booking.com |

Das Geheimnis erzeugen Sie so — in der IONOS-Konsole oder lokal:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Es schützt die Bestätigungslinks. Ändern Sie es, werden alle offenen
Links ungültig.

**`config.php` gehört nicht ins Git-Repository.** Die `.gitignore`
schließt sie bereits aus.

### Schritt 2: Kalenderadressen holen

**Airbnb:** Inserat → Kalender → Verfügbarkeit → Kalender synchronisieren
→ Kalender exportieren. Sie bekommen eine Adresse auf `.ics`.

**Booking.com:** Extranet → Preise & Verfügbarkeit → Kalender
synchronisieren → Exportieren.

Beide Adressen kommen in `config.php` unter das jeweilige Angebot. Der
Whirlpool-Anhänger bleibt leer — er wird nicht über Portale vermietet.

Diese Adressen sind keine Passwörter, aber auch nicht öffentlich: Wer sie
kennt, sieht Ihre Belegung. Deshalb gehören sie in `config.php` und nicht
in eine Datei, die im Repository landet.

### Schritt 3: Hochladen und Rechte prüfen

Hochladen müssen Sie `api/` und `daten/`. Der Ordner `daten/` muss für
PHP **beschreibbar** sein (Rechte 755 oder 775) — dort liegen die
Reservierungen. Er ist per `.htaccess` gegen Zugriff von außen gesperrt.

Prüfen Sie nach dem Hochladen:

```
https://ihre-domain.de/daten/reservierungen.json   → muss 403 liefern
https://ihre-domain.de/api/config.php              → muss 403 oder leer sein
https://ihre-domain.de/api/verfuegbarkeit.php?angebot=duene → JSON
```

### Schritt 4: Eigenen Kalender bei den Portalen eintragen

Ihre Seite stellt je Angebot einen eigenen Kalender bereit:

```
https://ihre-domain.de/api/kalender.php?angebot=duene
https://ihre-domain.de/api/kalender.php?angebot=hafen
https://ihre-domain.de/api/kalender.php?angebot=whirlpool
```

Diese Adressen tragen Sie bei Airbnb und Booking.com **als externen
Kalender** ein (dieselbe Stelle wie beim Export, dort gibt es
„Kalender importieren").

---

## Wie eine Buchung abläuft

1. Jemand wählt im Formular Angebot und Zeitraum. Belegte Tage sind
   gesperrt und nicht anklickbar.
2. Die Anfrage wird als **„offen"** gespeichert. **Sie sperrt nichts** —
   weder auf Ihrer Seite noch bei den Portalen. Im Kalender erscheint sie
   nur als „angefragt".
3. Sie bekommen eine E-Mail mit zwei Links: **Bestätigen** oder
   **Ablehnen**.
4. Erst beim Bestätigen wird daraus eine Belegung. Sie erscheint dann in
   Ihrem eigenen Kalender-Feed, und der anfragende Gast bekommt eine
   Zusage per E-Mail.
5. Beim Ablehnen wird nichts gesperrt und **keine** Nachricht an den Gast
   geschickt — antworten Sie ihm selbst.

### Das Risiko der Doppelbuchung

**Airbnb und Booking.com rufen importierte Kalender nur alle paar Stunden
ab.** Airbnb nennt etwa zwei Stunden, in der Praxis dauert es oft länger.
Booking.com verhält sich ähnlich.

Das heißt: Zwischen Ihrer Bestätigung und dem Moment, in dem Airbnb den
Termin übernimmt, liegen Stunden. In diesem Fenster kann dort jemand
denselben Zeitraum buchen.

Deshalb:

- **Sehen Sie vor dem Bestätigen kurz in Airbnb und Booking nach.** Der
  Hinweis steht auch in jeder Benachrichtigungsmail.
- Anfragen von der Website sind bewusst unverbindlich, bis Sie zusagen.

Das lässt sich mit iCal grundsätzlich nicht ausschließen — von keiner
Lösung. Wer das Risiko ganz vermeiden will, braucht einen Channel Manager
wie Smoobu oder Beds24, der die Portale direkt anbindet (ab etwa 20 € im
Monat).

---

## Was passiert, wenn etwas ausfällt

Die Seite ist so gebaut, dass jeder Ausfall eine Stufe tiefer aufgefangen
wird:

| Fall | Verhalten |
|---|---|
| Airbnb-Kalender nicht erreichbar | letzter erfolgreich geladener Stand wird verwendet, Hinweis im Formular |
| `api/` fehlt oder PHP ist aus | Kalender verschwindet, die beiden Datumsfelder erscheinen wieder, Anfrage geht über das E-Mail-Programm |
| JavaScript aus | alles sichtbar und lesbar, Formular per E-Mail-Programm |
| `daten/` nicht beschreibbar | Anfrage meldet einen Fehler und bittet um eine direkte E-Mail |

### Dateien im Ordner `api/`

| Datei | Aufgabe |
|---|---|
| `config.php` | Ihre Angaben und Geheimnisse (nicht im Repository) |
| `verfuegbarkeit.php` | liefert belegte Tage als JSON, mit Zwischenspeicher |
| `reservierung.php` | nimmt Anfragen an, verschickt die Mails |
| `bestaetigen.php` | Bestätigen oder Ablehnen über den Link aus der Mail |
| `kalender.php` | Ihr eigener iCal-Feed je Angebot |
| `lib/ical.php` | iCal lesen und schreiben |
| `lib/speicher.php` | Reservierungen ablegen, mit Dateisperre |
| `lib/hilfen.php` | gemeinsame Helfer, Mailversand |

Die Reservierungen liegen als `daten/reservierungen.json` — eine
gewöhnliche Textdatei. Bei wenigen Anfragen im Monat braucht es dafür
keine Datenbank, und im Zweifel können Sie sie im Editor öffnen.

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

Alle Farben, Abstände, Radien und Schatten liegen als CSS-Variablen ganz oben
in `css/styles.css` unter `:root`. Eine Änderung dort wirkt sich auf die
gesamte Seite aus.

### Palette

Grundlage ist eine vorgegebene Palette aus fünf Tönen. Drei davon liegen auf
demselben kalten Farbton (195°) — deshalb tragen hier **warme Ableitungen die
Flächen**, und die kalten Töne nur noch Akzente. Sonst wirkt die Seite
klinisch.

```css
--c-page:  #faf8f4;   /* warmes Off-White statt reinem Weiß         */
--c-surface: #fffefb; /* Karten und erhabene Flächen                */
--c-sand-soft: #f2ede4; /* zweiter Flächenton, Abschnittswechsel    */
--c-greige: #c6c3b5;  /* Vorgabe: Bildrahmen, Fußzeile              */
--c-ink:   #36393a;   /* Vorgabe: Überschriften                     */
--c-body:  #4a4742;   /* Fließtext, warm abgestimmt                 */
--c-sea:   #4c6e7a;   /* Buttons und Links                          */
--c-sea-light: #658894; /* Markenton, nur Flächen und Dekor         */
--c-amber: #a9542f;   /* Terrakotta: Preise, Marker, Zierstriche    */
--c-sun:   #d9a962;   /* Sonnenocker: Badges mit dunklem Text       */
```

**Zwei Regeln, die nicht verhandelbar sind** — beide sind gemessen:

- `--c-sea-light` (`#658894`) trägt **niemals kleinen weißen Text**. Das
  Verhältnis beträgt nur 3,78:1, nötig sind 4,5:1. Für alles Interaktive ist
  `--c-sea` da (5,45:1).
- `--c-decor-grey` (`#a09d97`) ist **keine Textfarbe**. Auf `--c-page`
  erreicht es 2,55:1. Sekundärtext nutzt `--c-muted` (5,06:1).

Sämtliche Textfarben der Seite erfüllen WCAG AA, auch die weiße Schrift über
dem Kopfbild und über der Karte.

### Form

`--radius` (14px), `--radius-lg` (22px) und `--radius-arch` bestimmen die
Kanten. Der Bogen `--radius-arch` ist die Signaturform und liegt bewusst nur
auf **einem** Bild pro Seite — dem Gastgeberfoto. Mehr davon wirkt dekorativ.

Karten haben **keine Rahmen**, sondern Schatten (`--shadow-md`). Das ist der
größte Einzelgewinn gegen die klinische Wirkung: eine Karte soll auf der
Fläche liegen, nicht aus ihr ausgeschnitten sein. Die Schatten sind warm
getönt (`rgba(74, 71, 66, …)`) — ein blaugrauer Schatten lässt jede Fläche
technisch wirken.

Über der ganzen Seite liegt ein feines Korn (`--grain-opacity`, 3,5 %). Es
nimmt den Flächen die digitale Makellosigkeit. Wer es nicht möchte, setzt den
Wert auf `0`.

**Wichtig:** `--header-h` muss zur Größe des Logos passen (`.brand__mark`).
Beide Werte hängen zusammen, weil davon die Sprungmarken und die Höhe des
mobilen Menüs abhängen.

### Schriften

Zwei Familien, beide lokal aus `fonts/` geladen:

- **Fraunces** trägt die Überschriften — eine weiche Serife mit den Achsen
  `SOFT` (rundet die Endungen) und `WONK` (leichte Unregelmäßigkeit). Sie
  läuft auf Gewicht 400–500; eine fette Serife wirkt korporativ.
- **Figtree** trägt den Lauftext — humanistisch, hohe x-Höhe, ruhig lesbar
  bei 17px und Zeilenhöhe 1,7.

Die lokale Auslieferung ist Absicht: Bindet man Google Fonts direkt ein, wird
bei jedem Seitenaufruf die IP-Adresse der Besucher an Google übertragen —
dafür wäre eine Einwilligung nötig. Wer eine Schrift wechselt, legt die neue
Datei ebenfalls in `fonts/` ab und passt die `@font-face`-Regeln in
`css/styles.css` an.

### Beim Austausch des Kopfbildes beachten

Über `hero.jpg` liegt weiße Schrift. Der dunkle Verlauf darüber
(`.hero__scrim`) ist so eingestellt, dass die Schrift WCAG AA erreicht —
gemessen gegen den hellsten Punkt hinter jedem Textelement. Ist Ihr Foto in
der linken Bildhälfte deutlich heller als der Platzhalter, prüfen Sie die
Lesbarkeit und erhöhen Sie die Deckwerte im waagerechten Verlauf.

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
