<?php
/**
 * iCal lesen und schreiben.
 *
 * Bewusst klein gehalten: Wir brauchen nur belegte Tage, keine
 * Wiederholungsregeln, keine Zeitzonenumrechnung. Airbnb und Booking.com
 * exportieren Belegungen als ganztaegige Termine (VALUE=DATE).
 *
 * Wichtig zum Verstaendnis: DTEND ist bei iCal **exklusiv**. Ein Termin
 * vom 10. bis 13. belegt also den 10., 11. und 12. - am 13. reist der
 * Gast ab, der Tag ist fuer eine neue Anreise wieder frei.
 */

/**
 * Entfaltet Zeilenumbrueche nach RFC 5545: Fortsetzungszeilen beginnen
 * mit Leerzeichen oder Tabulator und gehoeren zur Zeile davor.
 */
function ical_entfalten($text)
{
    $text = str_replace(["\r\n", "\r"], "\n", $text);
    return preg_replace("/\n[ \t]/", '', $text);
}

/**
 * Liest ein Datum aus einer DTSTART/DTEND-Zeile.
 * Versteht 20260320 und 20260320T140000Z.
 *
 * @return string|null Datum als JJJJ-MM-TT
 */
function ical_datum($wert)
{
    if (preg_match('/(\d{4})(\d{2})(\d{2})/', $wert, $t)) {
        return $t[1] . '-' . $t[2] . '-' . $t[3];
    }
    return null;
}

/**
 * Zerlegt einen iCal-Text in belegte Zeitraeume.
 *
 * @return array Liste aus ['von' => 'JJJJ-MM-TT', 'bis' => 'JJJJ-MM-TT']
 *               bis ist exklusiv, wie in iCal.
 */
function ical_zeitraeume($text)
{
    $text = ical_entfalten($text);
    $zeitraeume = [];

    if (!preg_match_all('/BEGIN:VEVENT(.*?)END:VEVENT/s', $text, $treffer)) {
        return $zeitraeume;
    }

    foreach ($treffer[1] as $block) {
        // Abgesagte Termine belegen nichts.
        if (preg_match('/^STATUS:CANCELLED/mi', $block)) {
            continue;
        }

        $von = null;
        $bis = null;
        if (preg_match('/^DTSTART[^:]*:(.+)$/mi', $block, $t)) {
            $von = ical_datum(trim($t[1]));
        }
        if (preg_match('/^DTEND[^:]*:(.+)$/mi', $block, $t)) {
            $bis = ical_datum(trim($t[1]));
        }

        if ($von === null) {
            continue;
        }
        // Ohne DTEND gilt ein Tag.
        if ($bis === null) {
            $bis = date('Y-m-d', strtotime($von . ' +1 day'));
        }
        // Verdrehte oder leere Zeitraeume ueberspringen.
        if ($bis <= $von) {
            $bis = date('Y-m-d', strtotime($von . ' +1 day'));
        }

        $zeitraeume[] = ['von' => $von, 'bis' => $bis];
    }

    return $zeitraeume;
}

/**
 * Wandelt Zeitraeume in eine Liste einzelner belegter Tage um.
 * Der Abreisetag bleibt frei (DTEND ist exklusiv).
 *
 * @return array sortierte, eindeutige Liste von JJJJ-MM-TT
 */
function ical_tage(array $zeitraeume)
{
    $tage = [];
    foreach ($zeitraeume as $z) {
        $tag = $z['von'];
        // Sicherheitsnetz gegen fehlerhafte Feeds mit absurden Zeitraeumen.
        $zaehler = 0;
        while ($tag < $z['bis'] && $zaehler < 800) {
            $tage[$tag] = true;
            $tag = date('Y-m-d', strtotime($tag . ' +1 day'));
            $zaehler++;
        }
    }
    $liste = array_keys($tage);
    sort($liste);
    return $liste;
}

/**
 * Faltet eine iCal-Zeile auf hoechstens 75 Zeichen, wie es der Standard
 * verlangt. Sonst verweigern manche Kalender den Import.
 */
function ical_falten($zeile)
{
    if (strlen($zeile) <= 75) {
        return $zeile;
    }
    $teile = [substr($zeile, 0, 75)];
    $rest = substr($zeile, 75);
    while (strlen($rest) > 74) {
        $teile[] = ' ' . substr($rest, 0, 74);
        $rest = substr($rest, 74);
    }
    if ($rest !== '') {
        $teile[] = ' ' . $rest;
    }
    return implode("\r\n", $teile);
}

/**
 * Maskiert Sonderzeichen in Textwerten (Komma, Semikolon, Backslash).
 */
function ical_text($wert)
{
    $wert = str_replace(['\\', "\n", ',', ';'], ['\\\\', '\\n', '\\,', '\;'], $wert);
    return $wert;
}

/**
 * Baut einen iCal-Feed aus Eintraegen.
 *
 * @param array  $eintraege Liste aus ['von','bis','titel','uid']
 * @param string $name      Kalendername
 */
function ical_erzeugen(array $eintraege, $name)
{
    $zeilen = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Auszeit Ostsee//Belegung//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ical_falten('X-WR-CALNAME:' . ical_text($name)),
    ];

    $jetzt = gmdate('Ymd\THis\Z');

    foreach ($eintraege as $e) {
        $zeilen[] = 'BEGIN:VEVENT';
        $zeilen[] = 'UID:' . $e['uid'] . '@auszeit-mieten.de';
        $zeilen[] = 'DTSTAMP:' . $jetzt;
        $zeilen[] = 'DTSTART;VALUE=DATE:' . str_replace('-', '', $e['von']);
        $zeilen[] = 'DTEND;VALUE=DATE:' . str_replace('-', '', $e['bis']);
        $zeilen[] = ical_falten('SUMMARY:' . ical_text($e['titel']));
        $zeilen[] = 'TRANSP:OPAQUE';
        $zeilen[] = 'END:VEVENT';
    }

    $zeilen[] = 'END:VCALENDAR';
    return implode("\r\n", $zeilen) . "\r\n";
}
