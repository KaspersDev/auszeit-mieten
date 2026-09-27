<?php
/**
 * GET api/kalender.php?angebot=duene
 *
 * Der eigene iCal-Feed. Diese Adresse tragen Sie bei Airbnb und
 * Booking.com als externen Kalender ein.
 *
 * Enthalten sind ausschliesslich **bestaetigte** Reservierungen. Offene
 * Anfragen erscheinen hier bewusst nicht - sonst wuerde jede unverbindliche
 * Anfrage Ihre Portale blockieren.
 */

require __DIR__ . '/lib/hilfen.php';
require __DIR__ . '/lib/ical.php';
require __DIR__ . '/lib/speicher.php';

$konfig = konfiguration();
date_default_timezone_set($konfig['zeitzone']);

$id = $_GET['angebot'] ?? '';
$angebot = angebot_holen($id);
if ($angebot === null) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Unbekanntes Angebot.\n";
    exit;
}

$eintraege = [];
foreach (reservierungen_bestaetigt($id) as $r) {
    $eintraege[] = [
        'von' => $r['von'],
        'bis' => $r['bis'],
        'titel' => 'Belegt (Direktbuchung)',
        'uid' => $r['id'],
    ];
}

header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: inline; filename="' . $id . '.ics"');
header('Cache-Control: public, max-age=900');
echo ical_erzeugen($eintraege, 'Auszeit Ostsee - ' . $angebot['name']);
