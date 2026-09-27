/*
 * Auszeit Ostsee - zentrale Konfiguration der Angebote
 * ===================================================
 *
 * HIER werden alle drei Angebote gepflegt. Diese Datei ist die einzige
 * Stelle, an der technische Angaben stehen: Kartenadressen, Anschriften
 * und spaeter die Kalender-Adressen von Airbnb und Booking.com.
 *
 * Nicht hier stehen Texte, Preise und Bilder der Seiten. Die liegen
 * bewusst im HTML, damit sie auch ohne JavaScript sichtbar sind und von
 * Suchmaschinen gefunden werden. Jede zu ersetzende Stelle dort ist mit
 * "TODO" gekennzeichnet - eine Liste aller Fundstellen steht in der
 * README unter "Platzhalter ersetzen".
 *
 * ---------------------------------------------------------------------
 * TODO vor dem Livegang
 * ---------------------------------------------------------------------
 * 1. kartenUrl    - Google-Maps-Adresse je Angebot eintragen
 * 2. adresse      - Anschrift, die unter der Karte erscheint
 *
 * ---------------------------------------------------------------------
 * Die iCal-Adressen gehoeren NICHT hierher!
 * ---------------------------------------------------------------------
 * Diese Datei laedt jeder Besucher herunter - sie ist oeffentlich. Wer
 * die iCal-Adressen kennt, kann Ihre gesamte Belegung einsehen.
 *
 * Sie gehoeren ausschliesslich in  api/config.php  unter 'ical_import'.
 * Diese Datei liegt auf dem Server, wird nie ausgeliefert und ist von
 * Git ausgeschlossen.
 */

window.ANGEBOTE = [
  {
    id: "duene",
    name: "Auszeit Düne",
    kurz: "Wohnung 1",
    seite: "wohnung-duene.html",
    // TODO: eigene Kartenadresse eintragen
    kartenUrl: "https://www.google.com/maps?q=Ostseebad+Boltenhagen&z=15&output=embed",
    // TODO: Anschrift eintragen
    adresse: "Musterstraße 12, 23946 Ostseebad Boltenhagen",
    adresseHinweis: "Die genaue Adresse erhalten Sie nach der Buchung."
  },
  {
    id: "hafen",
    name: "Auszeit Hafen",
    kurz: "Wohnung 2",
    seite: "wohnung-hafen.html",
    // TODO: eigene Kartenadresse eintragen
    kartenUrl: "https://www.google.com/maps?q=Ostseebad+Boltenhagen+Hafen&z=15&output=embed",
    // TODO: Anschrift eintragen
    adresse: "Musterstraße 12, 23946 Ostseebad Boltenhagen",
    adresseHinweis: "Die genaue Adresse erhalten Sie nach der Buchung."
  },
  {
    id: "whirlpool",
    name: "Whirlpool-Anhänger",
    kurz: "Whirlpool",
    seite: "whirlpool.html",
    // TODO: Abhol- oder Lieferort eintragen
    kartenUrl: "https://www.google.com/maps?q=Ostseebad+Boltenhagen&z=13&output=embed",
    // TODO: Abholadresse eintragen
    adresse: "Musterstraße 12, 23946 Ostseebad Boltenhagen",
    adresseHinweis: "Lieferung im Umkreis von 30 km nach Absprache."
  }
];
