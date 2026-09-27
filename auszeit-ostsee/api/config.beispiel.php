<?php
/**
 * Auszeit Ostsee - Konfiguration
 * ==============================
 *
 * ANLEITUNG
 * 1. Diese Datei kopieren und in "config.php" umbenennen.
 * 2. Alle mit TODO markierten Werte eintragen.
 * 3. config.php NICHT ins Git-Repository legen - sie enthaelt Geheimnisse.
 *    Die .gitignore schliesst sie bereits aus.
 *
 * Die Datei liegt im Web-Verzeichnis, wird aber nie ausgeliefert: PHP-Dateien
 * werden vom Server ausgefuehrt, nicht als Text ausgegeben. Zusaetzlich
 * schuetzt api/.htaccess den Ordner.
 */

return [

    // -----------------------------------------------------------------
    // E-Mail
    // -----------------------------------------------------------------

    // TODO: Ihre Adresse - hierhin gehen die Anfragen.
    'empfaenger' => 'kontakt@auszeit-mieten.de',

    // TODO: Absenderadresse. Muss zu Ihrer Domain gehoeren, sonst stuft
    // der Empfaenger die Mail als Spam ein.
    'absender' => 'website@auszeit-mieten.de',
    'absender_name' => 'Auszeit Ostsee',

    // -----------------------------------------------------------------
    // Sicherheit
    // -----------------------------------------------------------------

    // TODO: Ein langes, zufaelliges Geheimnis. Daraus werden die
    // Bestaetigungslinks abgeleitet. Erzeugen zum Beispiel mit:
    //   php -r "echo bin2hex(random_bytes(32));"
    // Wird es geaendert, verlieren alle offenen Links ihre Gueltigkeit.
    'geheimnis' => 'BITTE-ERSETZEN-durch-eine-lange-zufaellige-zeichenkette',

    // Vollstaendige Adresse der Website, ohne Schraegstrich am Ende.
    // TODO: eigene Domain eintragen.
    'basis_url' => 'https://www.auszeit-mieten.de',

    // -----------------------------------------------------------------
    // Angebote und ihre Kalender
    //
    // Die Schluessel muessen zu den IDs in js/angebote.js passen:
    // duene, hafen, whirlpool.
    // -----------------------------------------------------------------

    'angebote' => [

        'duene' => [
            'name' => 'Auszeit Düne',
            // TODO: iCal-Adressen eintragen.
            // Airbnb:  Inserat -> Kalender -> Verfügbarkeit -> Kalender
            //          synchronisieren -> Kalender exportieren
            // Booking: Extranet -> Preise & Verfügbarkeit -> Kalender
            //          synchronisieren -> Exportieren
            'ical_import' => [
                // 'https://www.airbnb.de/calendar/ical/00000000.ics?s=...',
                // 'https://ical.booking.com/v1/export?t=...',
            ],
        ],

        'hafen' => [
            'name' => 'Auszeit Hafen',
            'ical_import' => [
                // TODO: iCal-Adressen eintragen
            ],
        ],

        'whirlpool' => [
            'name' => 'Whirlpool-Anhänger',
            // Der Anhaenger wird nicht ueber Portale vermietet - hier
            // zaehlen nur die eigenen bestaetigten Reservierungen.
            'ical_import' => [],
        ],
    ],

    // -----------------------------------------------------------------
    // Feinheiten - koennen in der Regel so bleiben
    // -----------------------------------------------------------------

    // Wie lange abgerufene Fremdkalender zwischengespeichert werden
    // (Sekunden). 1800 = 30 Minuten.
    'cache_dauer' => 1800,

    // Zeitzone fuer Datumsangaben in den Mails.
    'zeitzone' => 'Europe/Berlin',

    // Wie viele Anfragen eine IP-Adresse pro Stunde stellen darf.
    'limit_pro_stunde' => 5,
];
