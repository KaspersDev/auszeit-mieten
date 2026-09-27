<?php
/**
 * GET api/bestaetigen.php?id=...&aktion=bestaetigen|ablehnen&token=...
 *
 * Wird ueber den Link in der Benachrichtigungsmail aufgerufen. Erst hier
 * wird aus einer Anfrage eine Belegung, die im eigenen iCal-Feed landet.
 *
 * Der Schluessel ist aus der ID und dem Geheimnis abgeleitet. Ohne ihn
 * laesst sich nichts bestaetigen, auch wenn jemand die ID kennt.
 */

require __DIR__ . '/lib/hilfen.php';
require __DIR__ . '/lib/speicher.php';

$konfig = konfiguration();
date_default_timezone_set($konfig['zeitzone']);

$id = (string) ($_GET['id'] ?? '');
$aktion = (string) ($_GET['aktion'] ?? '');
$token = (string) ($_GET['token'] ?? '');

function seite($titel, $text, $farbe = '#4c6e7a')
{
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1">'
       . '<meta name="robots" content="noindex">'
       . '<title>' . htmlspecialchars($titel, ENT_QUOTES) . '</title>'
       . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;'
       . 'justify-content:center;background:#faf8f4;color:#4a4742;'
       . 'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.7}'
       . '.k{max-width:34rem;margin:2rem;padding:2.5rem;background:#fffefb;'
       . 'border-radius:22px;box-shadow:0 6px 14px -8px rgba(74,71,66,.1),'
       . '0 24px 48px -24px rgba(74,71,66,.2)}'
       . 'h1{margin:0 0 1rem;font-size:1.5rem;color:' . $farbe . '}'
       . 'p{margin:0 0 .75rem}a{color:#4c6e7a}</style></head><body><div class="k">'
       . '<h1>' . htmlspecialchars($titel, ENT_QUOTES) . '</h1>' . $text
       . '</div></body></html>';
    exit;
}

if ($aktion !== 'bestaetigen' && $aktion !== 'ablehnen') {
    http_response_code(400);
    seite('Ungültiger Aufruf', '<p>Die Adresse ist unvollständig.</p>', '#a9542f');
}

if (!token_gueltig($id, $aktion, $token)) {
    http_response_code(403);
    seite('Link ungültig', '<p>Dieser Link ist nicht gültig oder wurde bereits erneuert.</p>', '#a9542f');
}

$vorher = reservierung_finden($id);
if ($vorher === null) {
    http_response_code(404);
    seite('Nicht gefunden', '<p>Zu diesem Link gibt es keine Anfrage mehr.</p>', '#a9542f');
}

$neuerStatus = $aktion === 'bestaetigen' ? 'bestaetigt' : 'abgelehnt';

// Schon erledigt? Dann nur anzeigen, nicht erneut aendern.
if (($vorher['status'] ?? '') !== 'offen') {
    $angebot = angebot_holen($vorher['angebot']);
    seite(
        'Bereits bearbeitet',
        '<p>Diese Anfrage steht bereits auf <strong>' . htmlspecialchars($vorher['status'], ENT_QUOTES) . '</strong>.</p>'
        . '<p>' . htmlspecialchars(($angebot['name'] ?? $vorher['angebot']) . ', '
            . datum_de($vorher['von']) . ' bis ' . datum_de($vorher['bis']), ENT_QUOTES) . '</p>'
    );
}

$ergebnis = reservierungen_aendern(function (array $liste) use ($id, $neuerStatus) {
    foreach ($liste as $i => $r) {
        if (($r['id'] ?? '') === $id && ($r['status'] ?? '') === 'offen') {
            $liste[$i]['status'] = $neuerStatus;
            $liste[$i]['entschieden'] = date('c');
        }
    }
    return $liste;
});

if ($ergebnis === false) {
    http_response_code(500);
    seite('Fehler beim Speichern', '<p>Die Änderung konnte nicht gespeichert werden.</p>', '#a9542f');
}

$angebot = angebot_holen($vorher['angebot']);
$name = htmlspecialchars($angebot['name'] ?? $vorher['angebot'], ENT_QUOTES);
$zeitraum = htmlspecialchars(datum_de($vorher['von']) . ' bis ' . datum_de($vorher['bis']), ENT_QUOTES);
$gast = htmlspecialchars($vorher['name'], ENT_QUOTES);

if ($neuerStatus === 'bestaetigt') {
    // Der Gast erfaehrt von der Zusage.
    mail_senden(
        $vorher['email'],
        'Zusage: ' . ($angebot['name'] ?? '') . ', ' . datum_de($vorher['von']) . ' bis ' . datum_de($vorher['bis']),
        "Guten Tag " . $vorher['name'] . ",\n\n"
        . "wir können Ihnen den Zeitraum zusagen:\n\n"
        . "  Angebot:  " . ($angebot['name'] ?? '') . "\n"
        . "  Zeitraum: " . datum_de($vorher['von']) . " bis " . datum_de($vorher['bis']) . "\n\n"
        . "Alles Weitere besprechen wir per E-Mail.\n\n"
        . "Herzliche Grüße\n" . $konfig['absender_name'] . "\n"
    );

    seite('Bestätigt', '<p><strong>' . $name . '</strong><br>' . $zeitraum . '<br>' . $gast . '</p>'
        . '<p>Der Zeitraum ist jetzt im eigenen Kalender-Feed gesperrt und wird beim '
        . 'nächsten Abruf von Airbnb und Booking.com übernommen. Das kann einige '
        . 'Stunden dauern.</p>'
        . '<p>Eine Zusage ging soeben an ' . htmlspecialchars($vorher['email'], ENT_QUOTES) . '.</p>');
}

seite('Abgelehnt', '<p><strong>' . $name . '</strong><br>' . $zeitraum . '<br>' . $gast . '</p>'
    . '<p>Die Anfrage ist abgeschlossen. Es wurde nichts gesperrt, und es ging '
    . 'keine Nachricht an den Gast — bitte antworten Sie ihm selbst.</p>');
