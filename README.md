# Robot Framework Lerntool

Interaktiver Kurs für Robot-Framework-Einsteiger. Läuft komplett im Browser: Robot Framework 7.3.2 wird über Pyodide (Python in WebAssembly) ausgeführt, es gibt kein Backend, keine Installation und keinen Internetzugriff.

## Starten

Voraussetzung: Python 3.8 oder neuer. Sonst nichts.

```text
python serve.py
```

Der Browser öffnet sich unter <http://localhost:8000>. Anderer Port: `python serve.py 8080`.

Das Tool **muss** über einen Webserver geladen werden. Ein Doppelklick auf `index.html` funktioniert nicht, weil Browser WebAssembly und Web Worker nicht von `file://` laden.

Der erste Start dauert ein paar Sekunden (Laden der Python-Laufzeit, ca. 12 MB). Danach läuft jede Ausführung in unter einer Sekunde.

## Aufbau

```text
index.html, styles.css     Oberfläche
lib/app.js                 Anwendungslogik, Fortschritt (localStorage), Worker-Anbindung
lib/worker.js              Web Worker: lädt Pyodide + Robot Framework
lib/runner.py              führt robot aus und wertet die Checks einer Lektion aus
lib/editor.js              Editor mit Syntax-Highlighting (ohne Abhängigkeiten)
lib/markdown.js            Markdown-Renderer für die Lektionstexte
lib/lesson.js              Parser für Lektionsdateien
lessons/index.json         Reihenfolge der Kapitel und Lektionen
lessons/**/*.md            die Lektionen
cheatsheet.md              Inhalt des Spickzettels (Schaltfläche oben, Taste ?)
vendor/pyodide/            Pyodide 0.28.3 (Core)
vendor/*.whl               Robot Framework 7.3.2
vendor/robocop-bundle.zip  Robocop 8.8.0 samt Abhängigkeiten (wird nachgeladen)
tools/check-lessons.mjs    prüft alle Lektionen (braucht Node 18+)
tools/ui-smoke.mjs         Oberflächentest im Headless-Chromium (braucht Playwright)
tools/walkthrough.mjs      nimmt einen kommentierten Durchlauf als Video auf
tools/build-web.sh         Variante für Hosting ohne .zip/.whl-Auslieferung
serve.py                   lokaler Webserver
```

Der Fortschritt und der Code jeder Lektion werden nur im Browser gespeichert (localStorage). Es werden keine Daten übertragen.

## Lektionen schreiben

Eine Lektion ist eine Markdown-Datei mit Frontmatter und speziellen Code-Zäunen. Neue Lektionen trägst du in `lessons/index.json` ein.

````markdown
---
title: Dein erster Test
---
Erklärung in Markdown. Normale Code-Blöcke (```robot, ```python, ```text)
werden hervorgehoben angezeigt.

## Aufgabe
Was die Lernenden tun sollen.

```robot start
*** Test Cases ***
Hallo Welt
    # Startcode, den die Lernenden bearbeiten
```

```robot solution
*** Test Cases ***
Hallo Welt
    Log    Hallo Welt
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_used", "name": "Log", "msg": "Eigene Fehlermeldung (optional)"}
]
```

```hints
Erster Hinweis.
---
Zweiter Hinweis, wird erst nach dem ersten angezeigt.
```
````

Weitere Zäune:

| Zaun | Bedeutung |
|---|---|
| ```` ```python file:bank.py ```` | zusätzliche editierbare Datei (eigener Reiter) |
| ```` ```python solution:bank.py ```` | Musterlösung für diese Datei |
| ```` ```robot readonly:konto.resource ```` | zusätzliche, nicht editierbare Datei |

### Check-Typen

Die Prüfungen werten sowohl das Ergebnis (`output.xml`) als auch die geparste Datei aus. Jeder Check kann `label` (Anzeigetext) und `msg` (Meldung bei Fehlschlag) überschreiben.

| Typ | Parameter | Prüft |
|---|---|---|
| `pass` | – | alle Tests bestanden |
| `tests_min` | `count` | mindestens N Testfälle |
| `test_named` | `name` | Testfall existiert |
| `test_status` | `name`, `status` (`PASS`/`FAIL`) | Testfall hat diesen Status |
| `keyword_used` | `name` | Keyword wurde aufgerufen (Library-Präfix optional) |
| `keyword_used_in` | `name`, `test` | Keyword wurde in diesem Test aufgerufen |
| `keyword_defined` | `name` | eigenes Keyword ist definiert |
| `keyword_args_min` | `name`, `count` | eigenes Keyword hat ≥ N Argumente |
| `keyword_returns` | `name` | eigenes Keyword hat `RETURN` |
| `message_contains` | `text` | eine Log-Nachricht enthält den Text |
| `message_regex` | `pattern` | eine Log-Nachricht passt auf den Regex |
| `control` | `kind` (`FOR`, `IF`, `WHILE`, `TRY`, `VAR`, `RETURN`, `BREAK`, `CONTINUE`, `GROUP`) | Struktur wurde ausgeführt |
| `variable_defined` | `name` | Variable im Variables-Abschnitt |
| `variable_assigned` | `name` | Variable wurde per Zuweisung oder `VAR` gesetzt |
| `library_imported` | `name` | Library importiert |
| `resource_imported` | – | eine Resource-Datei importiert |
| `tag_used` | `name` | Tag gesetzt |
| `setup_used` / `teardown_used` | – | Setup/Teardown auf Test- oder Suite-Ebene |
| `template_used` | – | Test Template verwendet |
| `documentation` | `scope` (`test`, `keyword`, `suite`) | Dokumentation vorhanden |
| `source_regex` / `source_not_regex` | `pattern` | Regex (mehrzeilig) auf den Quelltext aller Dateien |
| `tests_executed` | `names` | genau diese Testfälle wurden ausgeführt (für Tag-Filter) |
| `tests_count` | `count` | genau N Testfälle ausgeführt |

Wichtig: `pass` bewertet nur **ausgeführte** Testfälle. Durch `--include` herausgefilterte Tests gelten nicht als gescheitert.

### Ausführungsoptionen

Eine Lektion kann im Frontmatter festlegen, mit welchen Optionen Robot Framework gestartet wird:

```yaml
---
title: Mit Tags steuern, was läuft
run_options: include=smoke
---
```

Erlaubt sind `include`, `exclude`, `loglevel`, `variable`, `test`, `suite` und `dryrun`, mehrere durch Semikolon getrennt. Unter dem Ergebnis wird der nachgestellte Befehl angezeigt, damit der Zusammenhang zur Kommandozeile sichtbar ist.

### Ausführungsmodi

Eine Lektion kann zusätzliche Knöpfe anbieten, statt nur „Ausführen":

```yaml
---
title: Stil prüfen mit Robocop
run_modes: robocop | robot
---
```

| Modus | Knopf | Was passiert |
|---|---|---|
| `robot` | ▶ Ausführen | normaler Lauf, Prüfung der Aufgabe |
| `dryrun` | 🔍 Trockenlauf | `robot --dryrun`: prüft Keywords und Argumentzahl, führt nichts aus |
| `robocop` | 📏 Robocop | `robocop check`: Stilprüfung, echte Robocop-Ausgabe |

Robocop (rund 3 MB, `vendor/robocop-bundle.zip`) wird **erst geladen, wenn eine Lektion ihn braucht** — der normale Start bleibt dadurch schnell. Zugehörige Prüftypen: `robocop_max` (höchstens N Meldungen) und `robocop_no_rule` (diese Regel ist behoben).

Eure eigene Robocop-Konfiguration lässt sich später ergänzen, indem eine Konfigurationsdatei mit in das Arbeitsverzeichnis geschrieben wird (`lib/runner.py`, Funktion `_robocop`).

### Freie Übungen

Eine Lektion ohne `checks` und ohne Musterlösung ist eine freie Übung (siehe Spielwiese). Sie zählt nicht zum Fortschritt, und die Prüfung meldet nur, ob die Tests durchlaufen.

Nach Änderungen an Lektionen:

```text
node tools/check-lessons.mjs
```

Der Befehl führt jede Musterlösung aus (muss alle Checks bestehen) und jeden Startcode (darf nicht alle Checks bestehen).

## Grenzen

- Es laufen nur reine Python-Libraries: BuiltIn, Collections, String, DateTime, OperatingSystem (eingeschränkt), XML sowie eigene Python-Keywords. Browser-/Selenium-/Requests-Libraries funktionieren im Browser nicht.
- Ein Lauf wird nach 30 Sekunden abgebrochen (Endlosschleifen), danach startet die Laufzeit neu.

## Deployment

Das Tool ist eine statische Seite. Für GitLab Pages reicht:

```yaml
pages:
  stage: deploy
  script:
    - mkdir public && cp -r index.html styles.css cheatsheet.md lib lessons vendor public/
  artifacts:
    paths: [public]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

Wichtig: Der Server muss `.wasm` als `application/wasm` ausliefern (GitLab Pages tut das).

## Lizenzen

- Robot Framework: Apache License 2.0
- Pyodide: Mozilla Public License 2.0
- CPython (in Pyodide enthalten): PSF License
- Der Code des Lerntools selbst: MIT
