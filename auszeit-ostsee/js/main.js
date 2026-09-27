/*
 * Auszeit Ostsee - Interaktion
 *
 * Vanilla JavaScript, keine Abhaengigkeiten. Jede Funktion ist ein
 * eigenstaendiges Modul und beendet sich still, wenn die zugehoerigen
 * Elemente auf der aktuellen Seite nicht vorhanden sind. Dadurch kann
 * dieselbe Datei auf index.html, impressum.html und datenschutz.html
 * eingebunden werden.
 *
 * Module:
 *   initHeader          Sticky-Header mit Scroll-Zustand
 *   initMobileNav       Mobiles Menue inkl. Fokus-Verwaltung
 *   initNavDropdown     Untermenue "Wohnungen" im Kopfbereich
 *   initScrollSpy       Aktiver Navigationspunkt beim Scrollen
 *   initReveal          Sanftes Einblenden beim Scrollen
 *   initLightbox        Galerie-Lightbox mit Tastatursteuerung
 *   initContactForm     Formularpruefung ohne Backend
 *   initMapConsent      Karte erst nach Einwilligung laden (DSGVO)
 *   initCurrentYear     Jahreszahl im Footer
 */

(function () {
  "use strict";

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // ------------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------------

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  // Haelt die Tab-Reihenfolge innerhalb eines geoeffneten Dialogs.
  function trapFocus(container, event) {
    var items = $$(FOCUSABLE, container).filter(function (el) {
      if (!el.getClientRects().length) {
        return false;
      }
      // Ein eingeklapptes Untermenue ist zwar noch vermessen, aber auf
      // visibility:hidden gesetzt - solche Eintraege gehoeren nicht in
      // die Tabulator-Reihenfolge.
      var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      return !style || style.visibility !== "hidden";
    });
    if (!items.length) {
      return;
    }
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ------------------------------------------------------------------
  // Sticky-Header
  // ------------------------------------------------------------------

  function initHeader() {
    var header = $("[data-header]");
    if (!header) {
      return;
    }

    var ticking = false;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  // ------------------------------------------------------------------
  // Mobile Navigation
  // ------------------------------------------------------------------

  function initMobileNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("[data-nav]");
    if (!toggle || !nav) {
      return;
    }

    var desktop = window.matchMedia("(min-width: 861px)");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
    }

    function close(restoreFocus) {
      if (toggle.getAttribute("aria-expanded") !== "true") {
        return;
      }
      setOpen(false);
      if (restoreFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      var willOpen = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(willOpen);
      if (willOpen) {
        var firstLink = $(".nav__link", nav);
        if (firstLink) {
          firstLink.focus();
        }
      }
    });

    // Nach der Auswahl eines Ziels schliesst sich das Menue wieder.
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        close(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        // Ist ein Untermenue offen, schliesst Escape zuerst nur dieses -
        // das komplette Menue bleibt stehen.
        if (!$("[data-nav-dropdown].is-open")) {
          close(true);
        }
      } else if (event.key === "Tab" && nav.classList.contains("is-open")) {
        trapFocus(nav, event);
      }
    });

    // Beim Wechsel auf Desktopbreite darf kein Zustand haengen bleiben.
    var onChange = function (event) {
      if (event.matches) {
        close(false);
      }
    };
    if (desktop.addEventListener) {
      desktop.addEventListener("change", onChange);
    } else if (desktop.addListener) {
      desktop.addListener(onChange);
    }
  }

  // ------------------------------------------------------------------
  // Untermenue im Kopfbereich
  //
  // Der Navigationspunkt besteht aus zwei Bedienelementen: der Link
  // fuehrt zur Uebersicht, der Knopf daneben klappt die Liste der
  // einzelnen Wohnungen auf. Dadurch bleibt beides erreichbar - auf dem
  // Touchscreen genauso wie mit der Tastatur.
  // ------------------------------------------------------------------

  function initNavDropdown() {
    var items = $$("[data-nav-dropdown]");
    if (!items.length) {
      return;
    }

    var desktop = window.matchMedia("(min-width: 861px)");

    function isDesktop() {
      return desktop.matches;
    }

    function setOpen(item, open) {
      var toggle = $("[data-nav-dropdown-toggle]", item);
      item.classList.toggle("is-open", open);
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(open));
      }
    }

    function closeAll(except) {
      items.forEach(function (item) {
        if (item !== except) {
          setOpen(item, false);
        }
      });
    }

    items.forEach(function (item) {
      var toggle = $("[data-nav-dropdown-toggle]", item);
      if (!toggle) {
        return;
      }

      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") !== "true";
        closeAll(item);
        setOpen(item, open);
      });

      // Auf dem Desktop oeffnet bereits das CSS beim Ueberfahren. Hier
      // wird nur aria-expanded nachgezogen, damit Vorlesesoftware und
      // Darstellung denselben Zustand melden.
      item.addEventListener("mouseenter", function () {
        if (isDesktop()) {
          closeAll(item);
          setOpen(item, true);
        }
      });

      item.addEventListener("mouseleave", function () {
        if (isDesktop()) {
          setOpen(item, false);
        }
      });

      // Verlaesst der Fokus den Navigationspunkt, schliesst das Menue.
      item.addEventListener("focusout", function (event) {
        if (isDesktop() && !item.contains(event.relatedTarget)) {
          setOpen(item, false);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-nav-dropdown]")) {
        closeAll(null);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      items.forEach(function (item) {
        if (!item.classList.contains("is-open")) {
          return;
        }
        setOpen(item, false);
        var toggle = $("[data-nav-dropdown-toggle]", item);
        if (toggle && item.contains(document.activeElement)) {
          toggle.focus();
        }
      });
    });

    // Beim Wechsel der Bildschirmbreite darf kein Zustand haengen bleiben.
    var onChange = function () {
      closeAll(null);
    };
    if (desktop.addEventListener) {
      desktop.addEventListener("change", onChange);
    } else if (desktop.addListener) {
      desktop.addListener(onChange);
    }
  }

  // ------------------------------------------------------------------
  // Aktiver Navigationspunkt
  // ------------------------------------------------------------------

  function initScrollSpy() {
    var links = $$("[data-nav] .nav__link[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) {
      return;
    }

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = id ? document.getElementById(id) : null;
      if (section) {
        map[id] = link;
        sections.push(section);
      }
    });

    if (!sections.length) {
      return;
    }

    var visible = {};

    function highlight() {
      var current = null;
      sections.forEach(function (section) {
        if (visible[section.id] && !current) {
          current = section.id;
        }
      });
      links.forEach(function (link) {
        var id = link.getAttribute("href").slice(1);
        if (current && id === current) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      highlight();
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // ------------------------------------------------------------------
  // Einblenden beim Scrollen
  // ------------------------------------------------------------------

  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) {
      return;
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  // ------------------------------------------------------------------
  // Galerie-Lightbox
  // ------------------------------------------------------------------

  function initLightbox() {
    var lightbox = $("[data-lightbox]");
    var alle = $$("[data-lightbox-trigger]");
    if (!lightbox || !alle.length) {
      return;
    }

    var image = $("[data-lightbox-image]", lightbox);
    var caption = $("[data-lightbox-caption]", lightbox);
    var counter = $("[data-lightbox-counter]", lightbox);
    var btnClose = $("[data-lightbox-close]", lightbox);
    var btnPrev = $("[data-lightbox-prev]", lightbox);
    var btnNext = $("[data-lightbox-next]", lightbox);

    // Blaettern bleibt innerhalb einer Galerie. Ohne diese Gruppierung
    // wuerde man vom letzten Bild der ersten Wohnung in die Bilder der
    // zweiten rutschen - auf der Startseite liegen drei Galerien.
    var gruppe = alle;
    var index = 0;
    var lastFocused = null;

    function gruppeVon(trigger) {
      var behaelter = trigger.closest("[data-gallery]");
      return behaelter ? $$("[data-lightbox-trigger]", behaelter) : alle;
    }

    function show(next) {
      index = (next + gruppe.length) % gruppe.length;
      var trigger = gruppe[index];
      var thumb = $("img", trigger);
      image.setAttribute("src", trigger.getAttribute("data-full") || thumb.getAttribute("src"));
      image.setAttribute("alt", thumb ? thumb.getAttribute("alt") : "");
      caption.textContent = trigger.getAttribute("data-caption") || (thumb ? thumb.getAttribute("alt") : "");
      counter.textContent = String(index + 1) + " von " + String(gruppe.length);
    }

    // Nur eine Galerie: die Pfeile stiften keinen Nutzen.
    function pfeileAnpassen() {
      var zeigen = gruppe.length > 1;
      btnPrev.hidden = !zeigen;
      btnNext.hidden = !zeigen;
    }

    function open(trigger) {
      lastFocused = document.activeElement;
      gruppe = gruppeVon(trigger);
      pfeileAnpassen();
      show(gruppe.indexOf(trigger));
      lightbox.classList.add("is-open");
      lightbox.removeAttribute("aria-hidden");
      document.body.classList.add("is-locked");
      btnClose.focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      if (lastFocused) {
        lastFocused.focus();
      }
    }

    alle.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        open(trigger);
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () {
      show(index - 1);
    });
    btnNext.addEventListener("click", function () {
      show(index + 1);
    });

    // Klick auf den Hintergrund schliesst, Klick auf das Bild nicht.
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) {
        return;
      }
      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowLeft") {
        show(index - 1);
      } else if (event.key === "ArrowRight") {
        show(index + 1);
      } else if (event.key === "Tab") {
        trapFocus(lightbox, event);
      }
    });
  }

  // ------------------------------------------------------------------
  // Auswahlschalter fuer die drei Angebote
  //
  // Im Abschnitt Lage ist es eine Tabliste: ein Klick blendet den
  // zugehoerigen Bereich ein, die Pfeiltasten wechseln durch. Im
  // Anfrageformular uebernehmen echte Radiofelder dieselbe Optik - dort
  // ist nichts zu steuern, das erledigt der Browser.
  // ------------------------------------------------------------------

  function initSegmented() {
    $$("[data-segmented][role='tablist']").forEach(function (liste) {
      var tabs = $$("[role='tab']", liste);
      if (!tabs.length) {
        return;
      }

      function panelVon(tab) {
        var id = tab.getAttribute("aria-controls");
        return id ? document.getElementById(id) : null;
      }

      function waehle(tab, fokus) {
        tabs.forEach(function (anderer) {
          var aktiv = anderer === tab;
          anderer.setAttribute("aria-selected", String(aktiv));
          anderer.setAttribute("tabindex", aktiv ? "0" : "-1");
          var panel = panelVon(anderer);
          if (panel) {
            panel.hidden = !aktiv;
          }
        });
        if (fokus) {
          tab.focus();
        }
      }

      // Anfangszustand erst hier setzen. Stuende hidden schon im HTML,
      // waeren die uebrigen Bereiche ohne JavaScript dauerhaft verborgen -
      // ohne Schalter, der sie wieder einblendet.
      var aktiver = tabs.filter(function (t) {
        return t.getAttribute("aria-selected") === "true";
      })[0] || tabs[0];
      waehle(aktiver, false);

      tabs.forEach(function (tab, position) {
        tab.addEventListener("click", function () {
          waehle(tab, false);
        });

        tab.addEventListener("keydown", function (event) {
          var ziel = null;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            ziel = tabs[(position + 1) % tabs.length];
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            ziel = tabs[(position - 1 + tabs.length) % tabs.length];
          } else if (event.key === "Home") {
            ziel = tabs[0];
          } else if (event.key === "End") {
            ziel = tabs[tabs.length - 1];
          }
          if (ziel) {
            event.preventDefault();
            waehle(ziel, true);
          }
        });
      });
    });
  }

  // ------------------------------------------------------------------
  // Belegungskalender
  //
  // Holt die belegten Tage des gewaehlten Angebots vom eigenen Server
  // (api/verfuegbarkeit.php) und uebergibt sie dem Kalender. Beim Wechsel
  // des Angebots wird neu geladen.
  //
  // Schlaegt der Abruf fehl, bleibt es bei den beiden Datumsfeldern - die
  // Anfrage ist dann weiterhin moeglich, nur ohne gesperrte Tage.
  // ------------------------------------------------------------------

  function initBelegung() {
    var behaelter = $("[data-kalender]");
    var felder = $("[data-datumsfelder]");
    var hinweis = $("[data-kalender-hinweis]");
    var feldVon = $("#kontakt-anreise");
    var feldBis = $("#kontakt-abreise");

    if (!behaelter || !felder || !feldVon || !feldBis || !window.Kalender) {
      return;
    }

    var kalender = window.Kalender.erstellen(behaelter, {
      feldVon: feldVon,
      feldBis: feldBis,
      beiAenderung: function () {
        // Eine frisch getroffene Auswahl loescht alte Fehlermeldungen.
        [feldVon, feldBis].forEach(function (feld) {
          var block = feld.closest(".field");
          if (block) {
            block.classList.remove("has-error");
          }
          feld.removeAttribute("aria-invalid");
        });
      }
    });

    felder.classList.add("hat-kalender");

    var laufend = 0;

    function laden(angebot) {
      var meiner = ++laufend;
      hinweis.textContent = "Belegung wird geladen \u2026";

      fetch("api/verfuegbarkeit.php?angebot=" + encodeURIComponent(angebot), {
        headers: { "Accept": "application/json" },
        // Belegung nie aus dem Browser-Cache: Sie darf nicht veralten,
        // sonst waehlt jemand einen Termin, der laengst vergeben ist.
        cache: "no-store"
      })
        .then(function (antwort) {
          if (!antwort.ok) {
            throw new Error("HTTP " + antwort.status);
          }
          return antwort.json();
        })
        .then(function (daten) {
          // Eine spaeter gestartete Abfrage hat Vorrang.
          if (meiner !== laufend) {
            return;
          }
          kalender.setzeBelegung(daten.belegt, daten.angefragt);
          if (daten.quellen_fehler > 0) {
            hinweis.textContent = "Hinweis: Ein Kalender konnte nicht abgerufen werden. " +
              "Die Anzeige ist moeglicherweise nicht vollstaendig.";
          } else {
            hinweis.textContent = "";
          }
        })
        .catch(function () {
          if (meiner !== laufend) {
            return;
          }
          // Ohne Belegung ist der Kalender irrefuehrend - zurueck zu den
          // Datumsfeldern, damit niemand einen belegten Termin waehlt.
          felder.classList.remove("hat-kalender");
          behaelter.innerHTML = "";
          hinweis.textContent = "Die Belegung liess sich gerade nicht laden. " +
            "Bitte tragen Sie den Zeitraum unten ein - wir pruefen ihn von Hand.";
        });
    }

    function gewaehltesAngebot() {
      var feld = $("input[name='angebot']:checked");
      return feld ? feld.value : null;
    }

    $$("input[name='angebot']").forEach(function (feld) {
      feld.addEventListener("change", function () {
        // Ein Zeitraum, der fuer ein Angebot frei ist, muss es fuer das
        // naechste nicht sein.
        kalender.leeren();
        laden(feld.value);
      });
    });

    // Nach einer gesendeten Anfrage zuruecksetzen und neu laden: der
    // eigene Eintrag erscheint dann sofort als "angefragt".
    document.addEventListener("anfrage-gesendet", function () {
      kalender.leeren();
      var aktuell = gewaehltesAngebot();
      if (aktuell) {
        laden(aktuell);
      }
    });

    var start = gewaehltesAngebot();
    if (start) {
      laden(start);
    }
  }

  // ------------------------------------------------------------------
  // Kontaktformular
  // ------------------------------------------------------------------

  // Wandelt den Wert eines Datumsfelds (JJJJ-MM-TT) in deutsche
  // Schreibweise. Leere Felder bleiben als Hinweis erkennbar.
  function datumLesbar(feld) {
    var wert = feld && feld.value ? feld.value : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) {
      return "offen";
    }
    var teile = wert.split("-");
    return teile[2] + "." + teile[1] + "." + teile[0];
  }

  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) {
      return;
    }

    var status = $("[data-form-status]", form);
    var trap = $("[data-form-trap]", form);
    var mailTarget = form.getAttribute("data-mail-to") || "";
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fieldOf(control) {
      return control.closest(".field");
    }

    function setError(control, message) {
      var field = fieldOf(control);
      var box = field ? $(".field__error", field) : null;
      if (field) {
        field.classList.add("has-error");
      }
      if (box) {
        box.textContent = message;
      }
      control.setAttribute("aria-invalid", "true");
    }

    function clearError(control) {
      var field = fieldOf(control);
      if (field) {
        field.classList.remove("has-error");
      }
      control.removeAttribute("aria-invalid");
    }

    function validate(control) {
      var value = (control.value || "").trim();

      if (control.type === "checkbox") {
        if (!control.checked) {
          setError(control, "Bitte stimmen Sie der Verarbeitung Ihrer Daten zu.");
          return false;
        }
        clearError(control);
        return true;
      }

      if (control.required && !value) {
        setError(control, control.getAttribute("data-error-empty") || "Bitte fuellen Sie dieses Feld aus.");
        return false;
      }

      if (control.type === "email" && value && !emailPattern.test(value)) {
        setError(control, "Bitte geben Sie eine gueltige E-Mail-Adresse ein.");
        return false;
      }

      if (control.tagName === "TEXTAREA" && value && value.length < 10) {
        setError(control, "Bitte schreiben Sie mindestens 10 Zeichen.");
        return false;
      }

      clearError(control);
      return true;
    }

    function controls() {
      return $$("[required]", form);
    }

    function announce(message, kind) {
      status.textContent = message;
      status.classList.remove("is-success", "is-error");
      status.classList.add("is-visible", kind === "error" ? "is-error" : "is-success");
    }

    // Erst nach dem ersten Absendeversuch live pruefen - sonst meckert
    // das Formular waehrend des Tippens.
    var submitted = false;

    controls().forEach(function (control) {
      control.addEventListener("blur", function () {
        if (submitted) {
          validate(control);
        }
      });
      control.addEventListener("input", function () {
        if (submitted && fieldOf(control) && fieldOf(control).classList.contains("has-error")) {
          validate(control);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitted = true;

      // Ausgefuelltes Honeypot-Feld bedeutet fast immer ein Bot.
      if (trap && trap.value) {
        return;
      }

      var invalid = controls().filter(function (control) {
        return !validate(control);
      });

      if (invalid.length) {
        announce("Bitte pruefen Sie die markierten Felder.", "error");
        invalid[0].focus();
        return;
      }

      // Die Abreise muss nach der Anreise liegen. Ein Feld fuer sich ist
      // gueltig, erst im Verhaeltnis zeigt sich der Fehler.
      var von = $("#kontakt-anreise", form);
      var bis = $("#kontakt-abreise", form);
      if (von && bis && von.value && bis.value && bis.value <= von.value) {
        setError(bis, "Die Abreise muss nach der Anreise liegen.");
        announce("Bitte pruefen Sie den gewaehlten Zeitraum.", "error");
        bis.focus();
        return;
      }

      // Diese Seite ist statisch und versendet selbst nichts. Die Eingaben
      // werden an das E-Mail-Programm der Besucher uebergeben. Wie stattdessen
      // ein echter Formulardienst angebunden wird, steht in der README.
      var name = $("#kontakt-name", form);
      var mail = $("#kontakt-email", form);
      var text = $("#kontakt-nachricht", form);
      var anreise = $("#kontakt-anreise", form);
      var abreise = $("#kontakt-abreise", form);
      var reservieren = $("#kontakt-reservieren", form);
      var gewaehlt = $("input[name='angebot']:checked", form);

      var angebotName = gewaehlt
        ? (gewaehlt.getAttribute("data-angebot-name") || gewaehlt.value)
        : "nicht angegeben";
      var zeitraum = datumLesbar(anreise) + " bis " + datumLesbar(abreise);
      var reserviert = reservieren && reservieren.checked;

      // Der Betreff traegt Angebot und Zeitraum, damit Anfragen schon im
      // Posteingang unterscheidbar sind.
      var subject = (reserviert ? "Reservierungswunsch" : "Anfrage") +
        ": " + angebotName + ", " + zeitraum;

      var body = "Angebot: " + angebotName +
        "\nAnreise: " + datumLesbar(anreise) +
        "\nAbreise: " + datumLesbar(abreise) +
        "\nZeitraum reservieren: " + (reserviert ? "ja" : "nein") +
        "\n\nName: " + (name ? name.value.trim() : "") +
        "\nE-Mail: " + (mail ? mail.value.trim() : "") +
        "\n\nNachricht:\n" + (text ? text.value.trim() : "");

      // Weg 1: an den eigenen Server. Dann landet die Anfrage in der
      // Ablage, und die Gastgeber bekommen einen Bestaetigungslink.
      // Weg 2 (Rueckfall): das E-Mail-Programm der Besucher, wie bisher.
      // So funktioniert das Formular auch auf reinem Webspace ohne PHP.
      var knopf = $("button[type='submit']", form);
      if (knopf) {
        knopf.disabled = true;
      }
      announce("Anfrage wird gesendet \u2026", "success");

      function ueberMailProgramm(grund) {
        announce(
          (reserviert
            ? "Ihr Reservierungswunsch wurde in Ihrem E-Mail-Programm vorbereitet - "
            : "Ihre Anfrage wurde in Ihrem E-Mail-Programm vorbereitet - ") +
          "bitte dort noch absenden. Verbindlich wird der Termin erst mit unserer " +
          "Bestaetigung. Falls sich kein Fenster oeffnet, schreiben Sie uns direkt " +
          "an " + mailTarget + "." + (grund ? " (" + grund + ")" : ""),
          "success"
        );
        if (mailTarget) {
          // Ueber einen Link statt ueber window.location: das E-Mail-Programm
          // oeffnet sich, die Seite selbst bleibt unveraendert stehen.
          var link = document.createElement("a");
          link.href = "mailto:" + mailTarget +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        if (knopf) {
          knopf.disabled = false;
        }
      }

      if (!window.fetch) {
        ueberMailProgramm("");
        return;
      }

      fetch("api/reservierung.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          angebot: gewaehlt ? gewaehlt.value : "",
          von: von && von.value ? von.value : "",
          bis: bis && bis.value ? bis.value : "",
          name: name ? name.value.trim() : "",
          email: mail ? mail.value.trim() : "",
          nachricht: text ? text.value.trim() : "",
          reservieren: reserviert,
          website: trap ? trap.value : ""
        })
      })
        .then(function (antwort) {
          return antwort.json().then(function (daten) {
            return { ok: antwort.ok, status: antwort.status, daten: daten };
          });
        })
        .then(function (ergebnis) {
          if (ergebnis.ok && ergebnis.daten.ok) {
            announce(ergebnis.daten.meldung || "Vielen Dank fuer Ihre Anfrage.", "success");
            form.reset();
            // Der Kalender haelt seine Auswahl in den Feldern - nach dem
            // Zuruecksetzen muss er ebenfalls geleert werden.
            document.dispatchEvent(new CustomEvent("anfrage-gesendet"));
            if (knopf) {
              knopf.disabled = false;
            }
            return;
          }
          if (ergebnis.status >= 400 && ergebnis.status < 500 && ergebnis.daten.fehler) {
            // Der Server hat die Eingaben geprueft und etwas beanstandet.
            announce(ergebnis.daten.fehler, "error");
            if (knopf) {
              knopf.disabled = false;
            }
            return;
          }
          ueberMailProgramm("");
        })
        .catch(function () {
          // Kein PHP, keine Verbindung - dann eben ueber das Mailprogramm.
          ueberMailProgramm("");
        });
    });
  }

  // ------------------------------------------------------------------
  // Karte erst nach Einwilligung laden
  // ------------------------------------------------------------------

  function initMapConsent() {
    var angebote = window.ANGEBOTE || [];

    function angebotVon(id) {
      for (var i = 0; i < angebote.length; i++) {
        if (angebote[i].id === id) {
          return angebote[i];
        }
      }
      return null;
    }

    $$("[data-map]").forEach(function (wrapper) {
      var button = $("[data-map-load]", wrapper);
      if (!button) {
        return;
      }

      // Die Adresse steht entweder direkt am Element oder - bei den
      // Angeboten - zentral in js/angebote.js.
      var src = wrapper.getAttribute("data-map-src");
      var id = wrapper.getAttribute("data-map-angebot");
      var angebot = id ? angebotVon(id) : null;
      if (!src && angebot) {
        src = angebot.kartenUrl;
      }
      if (!src) {
        return;
      }

      // Hinweiszeile unter der Karte aus derselben Quelle fuellen.
      var hinweis = $("[data-map-adresse='" + id + "']", wrapper.parentNode);
      if (hinweis && angebot) {
        hinweis.textContent = angebot.adresseHinweis || "";
      }

      button.addEventListener("click", function () {
        var frame = document.createElement("iframe");
        frame.className = "map__frame";
        frame.setAttribute("src", src);
        frame.setAttribute("title", "Karte" + (angebot ? " - " + angebot.name : ""));
        frame.setAttribute("loading", "lazy");
        frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        frame.setAttribute("allowfullscreen", "");
        wrapper.replaceChild(frame, button);
      });
    });
  }

  // ------------------------------------------------------------------
  // Jahreszahl im Footer
  // ------------------------------------------------------------------

  function initCurrentYear() {
    $$("[data-current-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  // ------------------------------------------------------------------
  // Start
  // ------------------------------------------------------------------

  function init() {
    initHeader();
    initMobileNav();
    initNavDropdown();
    initScrollSpy();
    initReveal();
    initLightbox();
    initSegmented();
    initBelegung();
    initContactForm();
    initMapConsent();
    initCurrentYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
