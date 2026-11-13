---
title: Tests starten
run_modes: robot | dryrun
---
Bisher hast du auf einen grünen Knopf gedrückt. Im Alltag tippst du stattdessen:

```text
robot tests/
```

Das war's im Kern. Robot Framework sammelt alle `.robot`-Dateien im Verzeichnis ein, führt sie aus und legt drei Dateien ab: `output.xml`, `log.html` und `report.html`.

## Die Optionen, die du wirklich brauchst

| Option | Wirkung |
|---|---|
| `-d out` oder `--outputdir out` | legt die Ergebnisdateien in `out/` statt neben die Tests |
| `--include smoke` | nur Tests mit diesem Tag (nächste Lektion) |
| `--loglevel DEBUG` | ausführlicheres Log (übernächste Lektion) |
| `-v UMGEBUNG:test` | setzt die Variable `${UMGEBUNG}` von außen |
| `--dryrun` | prüft nur, führt nichts aus |
| `--rerunfailed out/output.xml` | wiederholt nur die zuletzt gescheiterten |

Der **Rückgabecode** ist wichtiger, als er aussieht: `0` heißt alles grün, eine Zahl von 1 bis 249 ist die Anzahl fehlgeschlagener Tests, alles darüber bedeutet, dass etwas grundsätzlich schiefging — etwa ein Syntaxfehler. Genau daran erkennt eine CI-Pipeline, ob der Job rot wird. Du siehst ihn hier unter jedem Ergebnis.

## Bei uns: mit Poetry

Robot Framework wird nicht global installiert, sondern gehört zu den Abhängigkeiten des Projekts. Deshalb läuft alles über Poetry:

```text
poetry install                 # einmalig: Abhängigkeiten einrichten
poetry run robot -d out tests/ # Tests starten
```

`poetry run` sorgt dafür, dass genau die Versionen benutzt werden, die im Lockfile stehen — dieselben wie in der Pipeline. Ein `pip install robotframework` in die Systeminstallation ist der schnellste Weg zu „bei mir läuft's aber".

> **Hier noch anzupassen:** Die genauen Befehle und Pfade eures Projekts trägt euer Team hier ein.

## Der Trockenlauf

`--dryrun` geht die Tests durch, **ohne sie auszuführen**: Es prüft die Syntax, ob alle Keywords existieren und ob die Argumentzahl passt. Kein System wird angefasst, keine Testdaten verändert. Bei einer großen Suite dauert das Sekunden statt einer Stunde — die beste Gewohnheit vor jedem Commit, und in vielen Pipelines ein eigener Schritt.

## Aufgabe

**Diese Lektion hat zwei Knöpfe:** neben „Ausführen" jetzt auch „Trockenlauf".

Im Test unten stecken Fehler, die man sonst erst beim Ausführen bemerkt. Finde sie mit dem **Trockenlauf**, ohne den Test laufen zu lassen, und korrigiere sie. Danach ist auch „Ausführen“ grün.

**Erst raten:** Wie viele Fehler findet der Trockenlauf? Und: Was wäre beim normalen Ausführen passiert?

```robot start
*** Test Cases ***
Depot prüfen
    Log    Depot wird geprüft
    Lege Depot an    Erika    Giro
    Shuld Be Equal    ${DEPOT}    Depot von Erika

*** Keywords ***
Lege Depot an
    [Arguments]    ${inhaber}
    VAR    ${DEPOT}    Depot von ${inhaber}    scope=TEST
    Log    Depot angelegt für ${inhaber}
```

```robot solution
*** Test Cases ***
Depot prüfen
    Log    Depot wird geprüft
    Lege Depot an    Erika
    Should Be Equal    ${DEPOT}    Depot von Erika

*** Keywords ***
Lege Depot an
    [Arguments]    ${inhaber}
    VAR    ${DEPOT}    Depot von ${inhaber}    scope=TEST
    Log    Depot angelegt für ${inhaber}
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_used", "name": "Lege Depot an"},
  {"type": "message_contains", "text": "Depot angelegt für Erika"}
]
```

```hints
Klick auf „Trockenlauf“ und lies die Konsole. Sie nennt beide Fundstellen mit Zeilennummer.
---
Der erste Fehler ist ein Tippfehler in einem Keyword-Namen. Groß- und Kleinschreibung wäre Robot egal — ein fehlender Buchstabe nicht.
---
Der zweite: `Lege Depot an` ist mit `[Arguments]    ${inhaber}` für **ein** Argument definiert, bekommt im Test aber zwei.
```
