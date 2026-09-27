<?php
/**
 * Gemeinsame Helfer fuer alle Endpunkte.
 */

/** Laedt die Konfiguration. Fehlt sie, bricht der Aufruf sauber ab. */
function konfiguration()
{
    static $konfig = null;
    if ($konfig !== null) {
        return $konfig;
    }
    $datei = dirname(__DIR__) . '/config.php';
    if (!is_readable($datei)) {
        antwort_fehler(500, 'Die Datei api/config.php fehlt. Bitte api/config.beispiel.php kopieren und ausfuellen.');
    }
    $konfig = require $datei;
    return $konfig;
}

/** Gibt JSON aus und beendet das Skript. */
function antwort_json(array $daten, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function antwort_fehler($status, $meldung)
{
    antwort_json(['fehler' => $meldung], $status);
}

/** Prueft, ob eine Zeichenkette ein Datum im Format JJJJ-MM-TT ist. */
function ist_datum($wert)
{
    if (!is_string($wert) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $wert, $t)) {
        return false;
    }
    return checkdate((int) $t[2], (int) $t[3], (int) $t[1]);
}

/** Kuerzt und saeubert Freitext. */
function text_saeubern($wert, $laenge = 2000)
{
    $wert = is_string($wert) ? $wert : '';
    $wert = str_replace(["\r\n", "\r"], "\n", $wert);
    $wert = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $wert);
    $wert = trim($wert);
    if (function_exists('mb_substr')) {
        return mb_substr($wert, 0, $laenge);
    }
    return substr($wert, 0, $laenge);
}

/**
 * Entfernt Zeilenumbrueche aus Werten, die in E-Mail-Kopfzeilen landen.
 * Ohne das koennte jemand ueber das Namensfeld eigene Kopfzeilen
 * einschleusen und die Mail an Dritte umleiten.
 */
function kopfzeile_saeubern($wert)
{
    return trim(str_replace(["\r", "\n", "\0", '%0a', '%0d'], '', (string) $wert));
}

/** Erzeugt den Bestaetigungs-Schluessel einer Reservierung. */
function reservierung_token($id, $aktion)
{
    $konfig = konfiguration();
    return hash_hmac('sha256', $id . '|' . $aktion, $konfig['geheimnis']);
}

/** Prueft einen Schluessel zeitkonstant. */
function token_gueltig($id, $aktion, $token)
{
    return hash_equals(reservierung_token($id, $aktion), (string) $token);
}

/** Datum in deutscher Schreibweise. */
function datum_de($wert)
{
    if (!ist_datum($wert)) {
        return $wert;
    }
    $t = explode('-', $wert);
    return $t[2] . '.' . $t[1] . '.' . $t[0];
}

/** Die IP-Adresse des Aufrufers, soweit ermittelbar. */
function aufrufer_ip()
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Prueft, ob ein Angebot in der Konfiguration bekannt ist.
 *
 * @return array|null Der Konfigurationsblock des Angebots.
 */
function angebot_holen($id)
{
    $konfig = konfiguration();
    if (!is_string($id) || !isset($konfig['angebote'][$id])) {
        return null;
    }
    return $konfig['angebote'][$id];
}

/** Verschickt eine Textmail mit sauberen Kopfzeilen. */
function mail_senden($an, $betreff, $text, $antwortAn = null)
{
    $konfig = konfiguration();
    $absender = kopfzeile_saeubern($konfig['absender']);
    $name = kopfzeile_saeubern($konfig['absender_name']);

    $kopf = [
        'From: ' . mb_encode_mimeheader($name, 'UTF-8') . ' <' . $absender . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'MIME-Version: 1.0',
    ];
    if ($antwortAn && filter_var($antwortAn, FILTER_VALIDATE_EMAIL)) {
        $kopf[] = 'Reply-To: ' . kopfzeile_saeubern($antwortAn);
    }

    return @mail(
        kopfzeile_saeubern($an),
        mb_encode_mimeheader($betreff, 'UTF-8'),
        $text,
        implode("\r\n", $kopf),
        '-f' . $absender
    );
}
