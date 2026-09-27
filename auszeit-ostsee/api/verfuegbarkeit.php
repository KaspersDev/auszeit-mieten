<?php
/**
 * GET api/verfuegbarkeit.php?angebot=duene
 *
 * Liefert die belegten Tage eines Angebots als JSON. Zusammengefuehrt aus:
 *   - den iCal-Feeds von Airbnb und Booking.com
 *   - den eigenen bestaetigten Reservierungen
 *   - den eigenen offenen Anfragen (getrennt ausgewiesen)
 *
 * Die Fremdkalender werden zwischengespeichert, damit nicht jeder
 * Seitenaufruf die Portale abfragt.
 */

require __DIR__ . '/lib/hilfen.php';
require __DIR__ . '/lib/ical.php';
require __DIR__ . '/lib/speicher.php';

$konfig = konfiguration();
$id = $_GET['angebot'] ?? '';
$angebot = angebot_holen($id);

if ($angebot === null) {
    antwort_fehler(400, 'Unbekanntes Angebot.');
}

/**
 * Holt einen iCal-Feed, mit Zwischenspeicher.
 * Bei einem Fehler wird der letzte erfolgreiche Stand verwendet - lieber
 * leicht veraltete Daten als gar keine.
 */
function feed_holen($url, $dauer)
{
    speicher_vorbereiten();
    $datei = daten_pfad() . '/cache/ical-' . hash('sha256', $url) . '.ics';

    if (is_readable($datei) && filemtime($datei) > time() - $dauer) {
        return (string) file_get_contents($datei);
    }

    $inhalt = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_USERAGENT => 'Auszeit-Ostsee-Kalender/1.0',
        ]);
        $antwort = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($antwort !== false && $status >= 200 && $status < 300) {
            $inhalt = $antwort;
        }
    } elseif (ini_get('allow_url_fopen')) {
        $kontext = stream_context_create(['http' => ['timeout' => 12]]);
        $antwort = @file_get_contents($url, false, $kontext);
        if ($antwort !== false) {
            $inhalt = $antwort;
        }
    }

    // Nur speichern, was auch wie ein Kalender aussieht.
    if ($inhalt !== false && strpos($inhalt, 'BEGIN:VCALENDAR') !== false) {
        @file_put_contents($datei, $inhalt, LOCK_EX);
        return $inhalt;
    }

    // Rueckfall auf den letzten guten Stand.
    if (is_readable($datei)) {
        return (string) file_get_contents($datei);
    }
    return '';
}

$zeitraeume = [];
$quellenFehler = 0;

foreach ($angebot['ical_import'] as $url) {
    if (!is_string($url) || $url === '') {
        continue;
    }
    $text = feed_holen($url, (int) $konfig['cache_dauer']);
    if ($text === '') {
        $quellenFehler++;
        continue;
    }
    foreach (ical_zeitraeume($text) as $z) {
        $zeitraeume[] = $z;
    }
}

// Eigene bestaetigte Reservierungen belegen ebenfalls.
foreach (reservierungen_bestaetigt($id) as $r) {
    $zeitraeume[] = ['von' => $r['von'], 'bis' => $r['bis']];
}

$belegt = ical_tage($zeitraeume);

// Offene Anfragen getrennt ausweisen: Sie sind noch nicht verbindlich,
// werden im Kalender aber als "angefragt" markiert.
$offeneZeitraeume = [];
foreach (reservierungen_vorgemerkt($id) as $r) {
    $offeneZeitraeume[] = ['von' => $r['von'], 'bis' => $r['bis']];
}
$angefragt = array_values(array_diff(ical_tage($offeneZeitraeume), $belegt));

// Kurze Frist mit Pflicht zur Rueckfrage: Belegung darf nicht veralten.
// Der teure Teil - der Abruf bei den Portalen - liegt ohnehin im
// serverseitigen Zwischenspeicher.
header('Cache-Control: no-cache, must-revalidate, max-age=0');
antwort_json([
    'angebot' => $id,
    'name' => $angebot['name'],
    'belegt' => $belegt,
    'angefragt' => $angefragt,
    'stand' => date('c'),
    'quellen' => count($angebot['ical_import']),
    'quellen_fehler' => $quellenFehler,
]);
