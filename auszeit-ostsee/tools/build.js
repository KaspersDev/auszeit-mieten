#!/usr/bin/env node
/*
 * Build-Skript fuer Auszeit Ostsee - ohne externe Abhaengigkeiten.
 *
 * Es kopiert die Website nach dist/ und verkleinert dabei HTML, CSS und
 * JavaScript. Die Dateinamen bleiben gleich, dist/ kann also unveraendert
 * auf den Webspace geladen werden.
 *
 * Die Verkleinerung ist bewusst zurueckhaltend: entfernt werden Kommentare
 * und ueberfluessige Leerraeume, es findet keine Umbenennung von Variablen
 * statt. Dadurch kann der Build nichts kaputt machen, was vorher lief.
 * Wer mehr Ersparnis braucht, ersetzt minifyJs durch terser oder esbuild.
 *
 * Aufruf:  node tools/build.js   (oder: npm run build)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

/* Was in die Auslieferung gehoert. */
const FILES = ["index.html", "impressum.html", "datenschutz.html", "favicon.png", "robots.txt", "sitemap.xml"];
const DIRS = ["css", "js", "images", "fonts"];

/* Diese Dateien werden nicht angefasst, nur kopiert. */
const BINARY = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".ico", ".woff", ".woff2", ".ttf"]);

// ---------------------------------------------------------------------------
// Platzhalter-Technik: empfindliche Bereiche werden vor dem Verkleinern
// ausgeschnitten und danach unveraendert wieder eingesetzt.
// ---------------------------------------------------------------------------

function extract(source, pattern) {
  const store = [];
  const text = source.replace(pattern, function (match) {
    store.push(match);
    return "\u0000" + (store.length - 1) + "\u0000";
  });
  return { text: text, store: store };
}

function restore(text, store) {
  return text.replace(/\u0000(\d+)\u0000/g, function (_, index) {
    return store[Number(index)];
  });
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

function minifyCss(source) {
  // Zeichenketten schuetzen, damit Leerzeichen darin erhalten bleiben.
  const safe = extract(source, /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g);
  let css = safe.text;

  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  css = css.replace(/\s+/g, " ");
  css = css.replace(/\s*([{};,])\s*/g, "$1");
  // Nach dem Doppelpunkt darf gekuerzt werden, davor nicht - sonst leiden
  // Pseudoklassen wie "a :hover" bzw. Selektorlisten.
  css = css.replace(/:\s+/g, ":");
  css = css.replace(/;}/g, "}");
  // Abstaende in calc() bleiben unangetastet, dort sind sie bedeutungstragend.

  return restore(css.trim(), safe.store);
}

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------

function minifyJs(source) {
  const lines = source.split("\n");
  const out = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (inBlockComment) {
      if (line.indexOf("*/") !== -1) {
        inBlockComment = false;
        line = line.slice(line.indexOf("*/") + 2).trim();
        if (!line) {
          continue;
        }
      } else {
        continue;
      }
    }

    // Nur vollstaendige Kommentarzeilen entfernen. Ein "//" mitten in einer
    // Zeile koennte Teil einer Zeichenkette oder eines regulaeren Ausdrucks
    // sein und bleibt deshalb stehen.
    if (line.indexOf("//") === 0) {
      continue;
    }

    if (line.indexOf("/*") === 0) {
      const end = line.indexOf("*/");
      if (end === -1) {
        inBlockComment = true;
        continue;
      }
      line = line.slice(end + 2).trim();
      if (!line) {
        continue;
      }
    }

    if (!line) {
      continue;
    }

    out.push(line);
  }

  // Zeilenumbrueche bleiben erhalten: die Datei verlaesst sich nirgends auf
  // automatisches Semikolon-Einfuegen, aber sicher ist sicher.
  return out.join("\n");
}

function assertParses(code, label) {
  try {
    // Kompiliert den Code, ohne ihn auszufuehren - reine Syntaxpruefung.
    new Function(code);
  } catch (error) {
    throw new Error("Syntaxfehler nach dem Verkleinern von " + label + ": " + error.message);
  }
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

function minifyHtml(source) {
  // Bereiche, in denen Leerraum bedeutungstragend ist, herausnehmen.
  const safe = extract(source, /<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi);
  let html = safe.text;

  html = html.replace(/<!--[\s\S]*?-->/g, "");
  // Einrueckung entfernen, den Zeilenumbruch aber behalten: er wird im
  // Browser wie ein einzelnes Leerzeichen behandelt, genau wie zuvor.
  html = html.replace(/^[ \t]+/gm, "");
  html = html.replace(/[ \t]+$/gm, "");
  html = html.replace(/\n{2,}/g, "\n");

  return restore(html.trim(), safe.store) + "\n";
}

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------

let originalTotal = 0;
let builtTotal = 0;

function report(relative, before, after) {
  originalTotal += before;
  builtTotal += after;
  const saved = before === 0 ? 0 : Math.round((1 - after / before) * 100);
  console.log(
    "  " + relative.padEnd(34) +
    String((before / 1024).toFixed(1) + " kB").padStart(9) + "  ->  " +
    String((after / 1024).toFixed(1) + " kB").padStart(9) +
    (saved > 0 ? "   -" + saved + " %" : "")
  );
}

function processFile(absolute) {
  const relative = path.relative(ROOT, absolute);
  const target = path.join(DIST, relative);
  const extension = path.extname(absolute).toLowerCase();

  fs.mkdirSync(path.dirname(target), { recursive: true });

  if (BINARY.has(extension)) {
    fs.copyFileSync(absolute, target);
    const size = fs.statSync(absolute).size;
    report(relative, size, size);
    return;
  }

  const source = fs.readFileSync(absolute, "utf8");
  let output = source;

  if (extension === ".css") {
    output = minifyCss(source);
  } else if (extension === ".js") {
    output = minifyJs(source);
    assertParses(output, relative);
  } else if (extension === ".html") {
    output = minifyHtml(source);
  }

  fs.writeFileSync(target, output, "utf8");
  report(relative, Buffer.byteLength(source), Buffer.byteLength(output));
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  entries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  entries.forEach(function (entry) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
    } else {
      processFile(absolute);
    }
  });
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  console.log("Build nach dist/ ...\n");

  FILES.forEach(function (name) {
    const absolute = path.join(ROOT, name);
    if (fs.existsSync(absolute)) {
      processFile(absolute);
    }
  });

  DIRS.forEach(function (name) {
    const absolute = path.join(ROOT, name);
    if (fs.existsSync(absolute)) {
      walk(absolute);
    }
  });

  const gzipped = ["css/styles.css", "js/main.js", "index.html"].reduce(function (sum, name) {
    const file = path.join(DIST, name);
    return fs.existsSync(file) ? sum + zlib.gzipSync(fs.readFileSync(file)).length : sum;
  }, 0);

  console.log(
    "\n  Gesamt: " + (originalTotal / 1024).toFixed(1) + " kB  ->  " +
    (builtTotal / 1024).toFixed(1) + " kB"
  );
  console.log("  index.html + CSS + JS, gzip-komprimiert: " + (gzipped / 1024).toFixed(1) + " kB");
  console.log("\nFertig. Der Inhalt von dist/ kann hochgeladen werden.");
}

build();
