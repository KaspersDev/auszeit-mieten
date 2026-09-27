<?php
/**
 * Ablage der Reservierungen.
 *
 * Bewusst eine JSON-Datei statt einer Datenbank: Bei zwei Wohnungen und
 * einem Anhaenger reden wir von wenigen Eintraegen im Monat. Eine Datei
 * braucht keine Einrichtung, laeuft auf jedem IONOS-Paket und laesst sich
 * im Zweifel im Texteditor lesen.
 *
 * Jeder Schreibvorgang sperrt die Datei (flock). Ohne das koennten zwei
 * gleichzeitige Anfragen einander ueberschreiben.
 */

function daten_pfad()
{
    return dirname(__DIR__, 2) . '/daten';
}

function reservierungen_datei()
{
    return daten_pfad() . '/reservierungen.json';
}

/** Legt die Datenordner an, falls sie fehlen. */
function speicher_vorbereiten()
{
    $pfad = daten_pfad();
    if (!is_dir($pfad)) {
        @mkdir($pfad, 0750, true);
    }
    if (!is_dir($pfad . '/cache')) {
        @mkdir($pfad . '/cache', 0750, true);
    }
    // Der Ordner darf von aussen nicht lesbar sein. Die Sperre wird hier
    // angelegt statt nur mitgeliefert: So ist sie auch dann vorhanden,
    // wenn der Ordner erst auf dem Server entsteht oder beim Hochladen
    // vergessen wurde - versteckte Dateien uebersehen FTP-Programme gern.
    $htaccess = $pfad . '/.htaccess';
    if (!file_exists($htaccess)) {
        @file_put_contents($htaccess,
            "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n" .
            "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
    }

    // Zweiter Schutz: ein leerer Index verhindert die Auflistung, falls
    // der Server .htaccess ignoriert.
    $index = $pfad . '/index.html';
    if (!file_exists($index)) {
        @file_put_contents($index, '');
    }
    return is_dir($pfad) && is_writable($pfad);
}

/** Liest alle Reservierungen. Fehlt die Datei, ist die Liste leer. */
function reservierungen_lesen()
{
    $datei = reservierungen_datei();
    if (!is_readable($datei)) {
        return [];
    }
    $inhalt = file_get_contents($datei);
    if ($inhalt === false || trim($inhalt) === '') {
        return [];
    }
    $daten = json_decode($inhalt, true);
    return is_array($daten) ? $daten : [];
}

/**
 * Aendert die Reservierungen unter Sperre.
 *
 * Die Aenderung wird als Funktion uebergeben: Sie bekommt die aktuelle
 * Liste und gibt die neue zurueck. So liegen Lesen, Aendern und Schreiben
 * innerhalb derselben Sperre.
 *
 * @return array|false Die neue Liste, oder false bei Fehler.
 */
function reservierungen_aendern(callable $aenderung)
{
    if (!speicher_vorbereiten()) {
        return false;
    }

    $datei = reservierungen_datei();
    $griff = @fopen($datei, 'c+');
    if ($griff === false) {
        return false;
    }

    if (!flock($griff, LOCK_EX)) {
        fclose($griff);
        return false;
    }

    $inhalt = stream_get_contents($griff);
    $liste = [];
    if ($inhalt !== false && trim($inhalt) !== '') {
        $daten = json_decode($inhalt, true);
        if (is_array($daten)) {
            $liste = $daten;
        }
    }

    $neu = $aenderung($liste);

    ftruncate($griff, 0);
    rewind($griff);
    fwrite($griff, json_encode($neu, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($griff);
    flock($griff, LOCK_UN);
    fclose($griff);
    @chmod($datei, 0640);

    return $neu;
}

/**
 * Bestaetigte Reservierungen eines Angebots.
 * Nur diese erscheinen im eigenen iCal-Feed.
 */
function reservierungen_bestaetigt($angebot)
{
    $treffer = [];
    foreach (reservierungen_lesen() as $r) {
        if (($r['angebot'] ?? '') === $angebot && ($r['status'] ?? '') === 'bestaetigt') {
            $treffer[] = $r;
        }
    }
    return $treffer;
}

/**
 * Vorgemerkte Zeitraeume eines Angebots (noch nicht bestaetigt).
 * Werden im Kalender der Website als "angefragt" angezeigt, blockieren
 * aber nichts bei Airbnb oder Booking.
 */
function reservierungen_vorgemerkt($angebot)
{
    $heute = date('Y-m-d');
    $treffer = [];
    foreach (reservierungen_lesen() as $r) {
        if (($r['angebot'] ?? '') !== $angebot || ($r['status'] ?? '') !== 'offen') {
            continue;
        }
        // Abgelaufene Anfragen halten nichts mehr frei.
        if (($r['bis'] ?? '') <= $heute) {
            continue;
        }
        $treffer[] = $r;
    }
    return $treffer;
}

/** Sucht eine Reservierung anhand ihrer ID. */
function reservierung_finden($id)
{
    foreach (reservierungen_lesen() as $r) {
        if (($r['id'] ?? '') === $id) {
            return $r;
        }
    }
    return null;
}

/**
 * Einfache Bremse gegen Massenanfragen: zaehlt die Anfragen einer
 * IP-Adresse in der laufenden Stunde.
 */
function limit_erreicht($ip, $grenze)
{
    if (!speicher_vorbereiten()) {
        return false;
    }
    $datei = daten_pfad() . '/cache/limit-' . date('Y-m-d-H') . '.json';

    // Aeltere Zaehldateien aufraeumen.
    foreach (glob(daten_pfad() . '/cache/limit-*.json') ?: [] as $alt) {
        if ($alt !== $datei && filemtime($alt) < time() - 7200) {
            @unlink($alt);
        }
    }

    $zaehler = [];
    if (is_readable($datei)) {
        $daten = json_decode((string) file_get_contents($datei), true);
        if (is_array($daten)) {
            $zaehler = $daten;
        }
    }

    $schluessel = hash('sha256', (string) $ip);
    $stand = (int) ($zaehler[$schluessel] ?? 0);
    if ($stand >= $grenze) {
        return true;
    }

    $zaehler[$schluessel] = $stand + 1;
    @file_put_contents($datei, json_encode($zaehler), LOCK_EX);
    return false;
}
