<?php
/**
 * POST api/reservierung.php
 *
 * Nimmt eine Anfrage entgegen, legt sie als "offen" ab und schickt zwei
 * Mails: eine an die Gastgeber mit Bestaetigungslink, eine Eingangs-
 * bestaetigung an die anfragende Person.
 *
 * WICHTIG: Eine Anfrage blockiert nichts. Erst die Bestaetigung ueber den
 * Link macht daraus eine Belegung, die im eigenen iCal-Feed erscheint.
 */

require __DIR__ . '/lib/hilfen.php';
require __DIR__ . '/lib/speicher.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    antwort_fehler(405, 'Nur POST.');
}

$konfig = konfiguration();
date_default_timezone_set($konfig['zeitzone']);

// Eingaben koennen als JSON oder als Formular kommen.
$roh = file_get_contents('php://input');
$daten = json_decode((string) $roh, true);
if (!is_array($daten)) {
    $daten = $_POST;
}

// Honeypot: Menschen fuellen dieses Feld nicht aus.
if (!empty($daten['website'])) {
    // Bots bekommen eine normale Antwort, damit sie nichts lernen.
    antwort_json(['ok' => true, 'status' => 'offen']);
}

if (limit_erreicht(aufrufer_ip(), (int) $konfig['limit_pro_stunde'])) {
    antwort_fehler(429, 'Zu viele Anfragen. Bitte versuchen Sie es spaeter noch einmal.');
}

// --- Pruefung ------------------------------------------------------------
$angebotId = $daten['angebot'] ?? '';
$angebot = angebot_holen($angebotId);
if ($angebot === null) {
    antwort_fehler(400, 'Bitte waehlen Sie ein Angebot.');
}

$von = $daten['von'] ?? '';
$bis = $daten['bis'] ?? '';
if (!ist_datum($von) || !ist_datum($bis)) {
    antwort_fehler(400, 'Bitte geben Sie Anreise und Abreise an.');
}
if ($bis <= $von) {
    antwort_fehler(400, 'Die Abreise muss nach der Anreise liegen.');
}
if ($von < date('Y-m-d')) {
    antwort_fehler(400, 'Die Anreise liegt in der Vergangenheit.');
}

$name = text_saeubern($daten['name'] ?? '', 120);
if ($name === '') {
    antwort_fehler(400, 'Bitte geben Sie Ihren Namen an.');
}

$email = trim((string) ($daten['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    antwort_fehler(400, 'Bitte geben Sie eine gueltige E-Mail-Adresse an.');
}

$nachricht = text_saeubern($daten['nachricht'] ?? '', 4000);
$reservieren = !empty($daten['reservieren']);

// --- Ablegen -------------------------------------------------------------
$id = bin2hex(random_bytes(12));
$eintrag = [
    'id' => $id,
    'angebot' => $angebotId,
    'von' => $von,
    'bis' => $bis,
    'name' => $name,
    'email' => $email,
    'nachricht' => $nachricht,
    'reservieren' => $reservieren,
    'status' => 'offen',
    'erstellt' => date('c'),
    'ip' => hash('sha256', aufrufer_ip()),
];

$ergebnis = reservierungen_aendern(function (array $liste) use ($eintrag) {
    $liste[] = $eintrag;
    // Eintraege, die laenger als zwei Jahre zurueckliegen, entfallen.
    $grenze = date('Y-m-d', strtotime('-2 years'));
    return array_values(array_filter($liste, function ($r) use ($grenze) {
        return ($r['bis'] ?? '9999') >= $grenze;
    }));
});

if ($ergebnis === false) {
    antwort_fehler(500, 'Die Anfrage konnte nicht gespeichert werden. Bitte schreiben Sie uns direkt eine E-Mail.');
}

// --- Mails ---------------------------------------------------------------
$zeitraum = datum_de($von) . ' bis ' . datum_de($bis);
$basis = rtrim($konfig['basis_url'], '/');
$linkJa = $basis . '/api/bestaetigen.php?id=' . $id . '&aktion=bestaetigen&token=' . reservierung_token($id, 'bestaetigen');
$linkNein = $basis . '/api/bestaetigen.php?id=' . $id . '&aktion=ablehnen&token=' . reservierung_token($id, 'ablehnen');

$anGastgeber = "Neue Anfrage über die Website\n"
    . "=============================\n\n"
    . "Angebot:   " . $angebot['name'] . "\n"
    . "Zeitraum:  " . $zeitraum . "\n"
    . "Reservierung gewünscht: " . ($reservieren ? 'ja' : 'nein') . "\n\n"
    . "Name:      " . $name . "\n"
    . "E-Mail:    " . $email . "\n\n"
    . "Nachricht:\n" . ($nachricht !== '' ? $nachricht : '(keine)') . "\n\n"
    . "-----------------------------------------------------------\n"
    . "BESTÄTIGEN (sperrt den Zeitraum im eigenen Kalender-Feed):\n"
    . $linkJa . "\n\n"
    . "ABLEHNEN (Anfrage wird abgeschlossen, nichts wird gesperrt):\n"
    . $linkNein . "\n"
    . "-----------------------------------------------------------\n\n"
    . "Hinweis: Bitte vor dem Bestätigen kurz in Airbnb und Booking.com\n"
    . "nachsehen. Importierte Kalender werden dort nur alle paar Stunden\n"
    . "abgerufen - in diesem Fenster kann parallel gebucht worden sein.\n";

mail_senden($konfig['empfaenger'], 'Anfrage: ' . $angebot['name'] . ', ' . $zeitraum, $anGastgeber, $email);

$anGast = "Guten Tag " . $name . ",\n\n"
    . "vielen Dank für Ihre Anfrage. Wir haben sie notiert:\n\n"
    . "  Angebot:  " . $angebot['name'] . "\n"
    . "  Zeitraum: " . $zeitraum . "\n\n"
    . ($reservieren
        ? "Wir halten den Zeitraum vorerst fest. Verbindlich wird er erst,\nwenn wir Ihnen zusagen.\n\n"
        : "Wir melden uns mit einer Rückmeldung zur Verfügbarkeit.\n\n")
    . "In der Regel antworten wir am selben Tag.\n\n"
    . "Herzliche Grüße\n"
    . $konfig['absender_name'] . "\n";

mail_senden($email, 'Ihre Anfrage: ' . $angebot['name'] . ', ' . $zeitraum, $anGast);

antwort_json([
    'ok' => true,
    'status' => 'offen',
    'meldung' => $reservieren
        ? 'Vielen Dank. Wir halten den Zeitraum fest und melden uns mit einer Zusage.'
        : 'Vielen Dank. Wir melden uns in der Regel am selben Tag.',
]);
