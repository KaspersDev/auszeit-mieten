/*
 * Belegungskalender
 * =================
 *
 * Zeigt zwei Monate nebeneinander (auf schmalen Bildschirmen einen) und
 * laesst einen Zeitraum waehlen. Belegte Tage sind gesperrt.
 *
 * Der Kalender schreibt seine Auswahl in zwei vorhandene Datumsfelder.
 * Die bleiben die Quelle der Wahrheit - ohne JavaScript oder wenn der
 * Abruf der Belegung scheitert, funktioniert das Formular ueber sie
 * weiter.
 *
 * Aufbau als Raster (role="grid") nach dem ueblichen Muster fuer
 * Datumsauswahl: Pfeiltasten bewegen, Enter waehlt, Bild auf/ab
 * blaettert den Monat.
 */

window.Kalender = (function () {
  "use strict";

  var TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
                "Juli", "August", "September", "Oktober", "November", "Dezember"];

  function iso(datum) {
    var m = String(datum.getMonth() + 1);
    var t = String(datum.getDate());
    return datum.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) +
      "-" + (t.length < 2 ? "0" + t : t);
  }

  function ausIso(wert) {
    var t = wert.split("-");
    return new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2]));
  }

  function heuteIso() {
    return iso(new Date());
  }

  function plusTage(wert, anzahl) {
    var d = ausIso(wert);
    d.setDate(d.getDate() + anzahl);
    return iso(d);
  }

  function lesbar(wert) {
    var t = wert.split("-");
    return t[2] + "." + t[1] + "." + t[0];
  }

  function erstellen(behaelter, optionen) {
    var feldVon = optionen.feldVon;
    var feldBis = optionen.feldBis;
    var beiAenderung = optionen.beiAenderung || function () {};

    var belegt = {};
    var angefragt = {};
    var von = feldVon.value || "";
    var bis = feldBis.value || "";
    var ansicht = ausIso(von || heuteIso());
    ansicht.setDate(1);
    var fokus = von || heuteIso();
    var monate = window.matchMedia("(min-width: 700px)").matches ? 2 : 1;

    var wurzel = document.createElement("div");
    wurzel.className = "kalender";
    behaelter.appendChild(wurzel);

    // ---------------------------------------------------------------
    // Zustand abfragen
    // ---------------------------------------------------------------

    function istGesperrt(tag) {
      return belegt[tag] === true;
    }

    function istVergangen(tag) {
      return tag < heuteIso();
    }

    function waehlbar(tag) {
      return !istGesperrt(tag) && !istVergangen(tag);
    }

    /* Liegt zwischen zwei Tagen ein gesperrter? Dann ist der Zeitraum
       nicht buchbar - sonst koennte man ueber eine Belegung hinweg
       waehlen. Der Abreisetag selbst darf belegt sein: an ihm reist der
       naechste Gast an. */
    function zeitraumFrei(a, b) {
      var tag = a;
      while (tag < b) {
        if (istGesperrt(tag)) {
          return false;
        }
        tag = plusTage(tag, 1);
      }
      return true;
    }

    function imZeitraum(tag) {
      return von && bis && tag >= von && tag <= bis;
    }

    // ---------------------------------------------------------------
    // Auswahl
    // ---------------------------------------------------------------

    function waehle(tag) {
      if (!waehlbar(tag)) {
        return;
      }

      if (!von || (von && bis) || tag <= von) {
        // Neu anfangen.
        von = tag;
        bis = "";
      } else if (!zeitraumFrei(von, tag)) {
        // Ueber eine Belegung hinweg geht nicht - neu anfangen.
        von = tag;
        bis = "";
      } else {
        bis = tag;
      }

      feldVon.value = von;
      feldBis.value = bis;
      fokus = tag;
      zeichne();
      beiAenderung(von, bis);
    }

    // ---------------------------------------------------------------
    // Zeichnen
    // ---------------------------------------------------------------

    function monatTabelle(jahr, monat) {
      var tabelle = document.createElement("table");
      tabelle.className = "kalender__monat";
      tabelle.setAttribute("role", "grid");
      tabelle.setAttribute("aria-label", MONATE[monat] + " " + jahr);

      var kopf = document.createElement("caption");
      kopf.className = "kalender__titel";
      kopf.textContent = MONATE[monat] + " " + jahr;
      tabelle.appendChild(kopf);

      var kopfZeile = document.createElement("tr");
      TAGE.forEach(function (name) {
        var th = document.createElement("th");
        th.scope = "col";
        th.innerHTML = '<span aria-hidden="true">' + name + "</span>";
        kopfZeile.appendChild(th);
      });
      var thead = document.createElement("thead");
      thead.appendChild(kopfZeile);
      tabelle.appendChild(thead);

      var tbody = document.createElement("tbody");
      var erster = new Date(jahr, monat, 1);
      // Montag als erster Wochentag.
      var versatz = (erster.getDay() + 6) % 7;
      var tageImMonat = new Date(jahr, monat + 1, 0).getDate();
      var zelle = 0;
      var zeile = document.createElement("tr");

      for (var i = 0; i < versatz; i++) {
        zeile.appendChild(document.createElement("td"));
        zelle++;
      }

      for (var t = 1; t <= tageImMonat; t++) {
        if (zelle === 7) {
          tbody.appendChild(zeile);
          zeile = document.createElement("tr");
          zelle = 0;
        }
        var tag = iso(new Date(jahr, monat, t));
        var td = document.createElement("td");
        var knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "kalender__tag";
        knopf.textContent = String(t);
        knopf.setAttribute("data-tag", tag);

        var zustand = "";
        if (istVergangen(tag)) {
          knopf.disabled = true;
          zustand = "vergangen";
        } else if (istGesperrt(tag)) {
          knopf.disabled = true;
          knopf.classList.add("is-belegt");
          zustand = "belegt";
        } else if (angefragt[tag]) {
          knopf.classList.add("is-angefragt");
          zustand = "angefragt";
        }

        if (tag === von) {
          knopf.classList.add("is-start");
        }
        if (tag === bis) {
          knopf.classList.add("is-ende");
        }
        if (imZeitraum(tag)) {
          knopf.classList.add("is-gewaehlt");
        }

        knopf.setAttribute("aria-pressed", String(imZeitraum(tag)));
        knopf.setAttribute("tabindex", tag === fokus ? "0" : "-1");
        knopf.setAttribute("aria-label",
          lesbar(tag) + (zustand ? ", " + zustand : "") +
          (tag === von ? ", Anreise" : "") + (tag === bis ? ", Abreise" : ""));

        td.appendChild(knopf);
        zeile.appendChild(td);
        zelle++;
      }

      while (zelle < 7) {
        zeile.appendChild(document.createElement("td"));
        zelle++;
      }
      tbody.appendChild(zeile);
      tabelle.appendChild(tbody);
      return tabelle;
    }

    function zeichne() {
      wurzel.innerHTML = "";

      var leiste = document.createElement("div");
      leiste.className = "kalender__leiste";

      var zurueck = document.createElement("button");
      zurueck.type = "button";
      zurueck.className = "kalender__blaettern";
      zurueck.innerHTML = '<svg aria-hidden="true" focusable="false"><use href="#icon-chevron-left"></use></svg>';
      zurueck.setAttribute("aria-label", "Vorheriger Monat");
      zurueck.addEventListener("click", function () {
        ansicht.setMonth(ansicht.getMonth() - 1);
        zeichne();
      });

      var vor = document.createElement("button");
      vor.type = "button";
      vor.className = "kalender__blaettern";
      vor.innerHTML = '<svg aria-hidden="true" focusable="false"><use href="#icon-chevron-right"></use></svg>';
      vor.setAttribute("aria-label", "Nächster Monat");
      vor.addEventListener("click", function () {
        ansicht.setMonth(ansicht.getMonth() + 1);
        zeichne();
      });

      var stand = document.createElement("p");
      stand.className = "kalender__stand";
      stand.textContent = von
        ? (bis ? lesbar(von) + " bis " + lesbar(bis)
               : lesbar(von) + " – bitte Abreise wählen")
        : "Bitte Anreise wählen";

      leiste.appendChild(zurueck);
      leiste.appendChild(stand);
      leiste.appendChild(vor);
      wurzel.appendChild(leiste);

      var raster = document.createElement("div");
      raster.className = "kalender__monate";
      for (var i = 0; i < monate; i++) {
        var d = new Date(ansicht.getFullYear(), ansicht.getMonth() + i, 1);
        raster.appendChild(monatTabelle(d.getFullYear(), d.getMonth()));
      }
      wurzel.appendChild(raster);

      var legende = document.createElement("ul");
      legende.className = "kalender__legende";
      legende.innerHTML =
        '<li><span class="kalender__muster kalender__muster--frei"></span>frei</li>' +
        '<li><span class="kalender__muster kalender__muster--belegt"></span>belegt</li>' +
        '<li><span class="kalender__muster kalender__muster--angefragt"></span>angefragt</li>';
      wurzel.appendChild(legende);
    }

    // ---------------------------------------------------------------
    // Bedienung
    // ---------------------------------------------------------------

    wurzel.addEventListener("click", function (event) {
      var knopf = event.target.closest(".kalender__tag");
      if (knopf && !knopf.disabled) {
        waehle(knopf.getAttribute("data-tag"));
      }
    });

    wurzel.addEventListener("keydown", function (event) {
      var knopf = event.target.closest(".kalender__tag");
      if (!knopf) {
        return;
      }
      var tag = knopf.getAttribute("data-tag");
      var ziel = null;

      if (event.key === "ArrowRight") { ziel = plusTage(tag, 1); }
      else if (event.key === "ArrowLeft") { ziel = plusTage(tag, -1); }
      else if (event.key === "ArrowDown") { ziel = plusTage(tag, 7); }
      else if (event.key === "ArrowUp") { ziel = plusTage(tag, -7); }
      else if (event.key === "PageDown") { ziel = plusTage(tag, 28); }
      else if (event.key === "PageUp") { ziel = plusTage(tag, -28); }
      else { return; }

      event.preventDefault();
      fokus = ziel;
      // Blaettert mit, wenn der Fokus den sichtbaren Bereich verlaesst.
      var d = ausIso(ziel);
      var ersterSichtbar = new Date(ansicht.getFullYear(), ansicht.getMonth(), 1);
      var letzterSichtbar = new Date(ansicht.getFullYear(), ansicht.getMonth() + monate, 0);
      if (d < ersterSichtbar || d > letzterSichtbar) {
        ansicht = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      zeichne();
      var neu = wurzel.querySelector('[data-tag="' + ziel + '"]');
      if (neu) {
        neu.focus();
      }
    });

    // Breitenwechsel: ein oder zwei Monate.
    var breit = window.matchMedia("(min-width: 700px)");
    var beiBreite = function (e) {
      monate = e.matches ? 2 : 1;
      zeichne();
    };
    if (breit.addEventListener) {
      breit.addEventListener("change", beiBreite);
    } else if (breit.addListener) {
      breit.addListener(beiBreite);
    }

    zeichne();

    // ---------------------------------------------------------------
    // Nach aussen
    // ---------------------------------------------------------------

    return {
      /** Setzt die Belegung neu und zeichnet den Kalender. */
      setzeBelegung: function (belegtListe, angefragtListe) {
        belegt = {};
        angefragt = {};
        (belegtListe || []).forEach(function (t) { belegt[t] = true; });
        (angefragtListe || []).forEach(function (t) { angefragt[t] = true; });

        // Eine bereits getroffene Auswahl kann durch neue Belegung
        // ungueltig werden - dann zuruecksetzen.
        if (von && !waehlbar(von)) {
          von = "";
          bis = "";
          feldVon.value = "";
          feldBis.value = "";
        } else if (von && bis && !zeitraumFrei(von, bis)) {
          bis = "";
          feldBis.value = "";
        }
        zeichne();
      },
      leeren: function () {
        von = "";
        bis = "";
        feldVon.value = "";
        feldBis.value = "";
        zeichne();
      }
    };
  }

  return { erstellen: erstellen };
})();
