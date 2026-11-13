---
title: Setup und Teardown
---
Fast jeder Test braucht **Vorbereitung** (anmelden, Testdaten anlegen) und **Aufräumen** (abmelden, Daten löschen). Dafür gibt es Setup und Teardown.

## Pro Test

```robot
*** Test Cases ***
Überweisung
    [Setup]    Melde Benutzer an
    Überweise    100    Erika
    [Teardown]    Melde Benutzer ab
```

Das Teardown läuft **immer**, auch wenn der Test fehlschlägt. Deshalb gehört Aufräumen ins Teardown und nicht ans Ende der Schritte, wo es bei einem Fehler übersprungen würde.

## Für alle Tests einer Datei

Statt jedem Test dasselbe Setup zu geben, definierst du es einmal im Settings-Abschnitt:

```robot
*** Settings ***
Test Setup       Melde Benutzer an
Test Teardown    Melde Benutzer ab
Suite Setup      Verbinde mit Testsystem
Suite Teardown   Trenne Verbindung
```

- `Test Setup` / `Test Teardown` laufen **vor und nach jedem Test**.
- `Suite Setup` / `Suite Teardown` laufen **einmal** vor dem ersten und nach dem letzten Test der Datei.

Ein Test kann das Datei-Setup mit `[Setup]` überschreiben, oder mit `[Setup]    NONE` abschalten.

## Mehrere Keywords im Teardown

Setup und Teardown nehmen genau **ein** Keyword. Für mehrere Schritte gibt es `Run Keywords`:

```robot
[Teardown]    Run Keywords    Schließe Dialog    AND    Melde Benutzer ab
```

Übersichtlicher ist meist ein eigenes Keyword `Räume auf`, das die Schritte bündelt.

## Aufgabe

1. Richte im Settings-Abschnitt `Test Setup` mit `Bereite Testdaten vor` und `Test Teardown` mit `Räume auf` ein.
2. Definiere beide Keywords. `Bereite Testdaten vor` loggt `Testdaten angelegt`, `Räume auf` loggt `Testdaten gelöscht`.
3. Beide Tests sollen bestehen. Sieh dir im Log an, dass Setup und Teardown bei **jedem** Test erscheinen.

```robot start
*** Settings ***
# Test Setup / Test Teardown

*** Test Cases ***
Erster Test
    Log    Prüfe etwas

Zweiter Test
    Log    Prüfe etwas anderes

*** Keywords ***

```

```robot solution
*** Settings ***
Test Setup       Bereite Testdaten vor
Test Teardown    Räume auf

*** Test Cases ***
Erster Test
    Log    Prüfe etwas

Zweiter Test
    Log    Prüfe etwas anderes

*** Keywords ***
Bereite Testdaten vor
    Log    Testdaten angelegt

Räume auf
    Log    Testdaten gelöscht
```

```checks
[
  {"type": "pass"},
  {"type": "tests_min", "count": 2},
  {"type": "setup_used"},
  {"type": "teardown_used"},
  {"type": "keyword_defined", "name": "Bereite Testdaten vor"},
  {"type": "keyword_defined", "name": "Räume auf"},
  {"type": "keyword_used_in", "name": "Bereite Testdaten vor", "test": "Zweiter Test", "msg": "Das Setup muss für jeden Test laufen – nutze Test Setup im Settings-Abschnitt."},
  {"type": "keyword_used_in", "name": "Räume auf", "test": "Erster Test", "msg": "Das Teardown muss für jeden Test laufen – nutze Test Teardown im Settings-Abschnitt."}
]
```

```hints
Im Settings-Abschnitt: `Test Setup    Bereite Testdaten vor` (ohne eckige Klammern, nicht eingerückt).
---
Die Keywords werden ganz normal unter `*** Keywords ***` definiert.
```
