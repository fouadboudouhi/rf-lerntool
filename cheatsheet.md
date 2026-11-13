## Die eine Regel

**Zwei oder mehr Leerzeichen trennen Keyword und Argumente.** Ein einzelnes Leerzeichen gehört zum Text.

```robot
Log    Hallo Welt        # Keyword + ein Argument
Log Hallo Welt           # Keyword namens "Log Hallo Welt" – gibt es nicht
Log    Hallo    Welt     # Keyword + ZWEI Argumente
```

## Aufbau einer Datei

```robot
*** Settings ***
Documentation     Wofür diese Datei da ist
Library           Collections
Resource          ../resources/konto.resource
Test Setup        Melde Benutzer an
Test Tags         zahlungsverkehr

*** Variables ***
${URL}            https://beispiel.de
@{FARBEN}         rot    grün    blau
&{KUNDE}          name=Erika    nummer=4711

*** Test Cases ***
Beschreibender Testname
    [Documentation]    Was dieser Test prüft.
    [Tags]             smoke    ticket-1234
    [Setup]            Eigenes Setup    # überschreibt Test Setup
    Schritt eins
    Schritt zwei
    [Teardown]         Räume auf

*** Keywords ***
Mein Keyword
    [Documentation]    Was es tut.
    [Arguments]        ${pflicht}    ${optional}=Standard
    Log                ${pflicht}
    RETURN             ${pflicht}
```

## Variablen

| Schreibweise | Bedeutung |
|---|---|
| `${name}` | einzelner Wert |
| `@{liste}` | Liste, beim Aufruf in einzelne Argumente entpackt |
| `&{dict}` | Dictionary, entpackt zu `name=wert` |
| `${liste}[0]` | erstes Element, `[-1]` das letzte |
| `${dict}[schluessel]` | Wert aus dem Dictionary |
| `${10}` | echte Zahl statt Text |
| `${{ 2 + 3 }}` | Python-Ausdruck, Variablen darin als `$name` |
| `%{PATH}` | Umgebungsvariable |

```robot
${wert}=    Set Variable    Hallo
${laenge}=    Get Length    ${wert}
VAR    ${lokal}     Wert
VAR    ${weiter}    Wert    scope=SUITE
```

Gültigkeit: Zuweisung und `VAR` sind lokal, der Variables-Abschnitt gilt für die Datei, `scope=SUITE` für alle Tests darin, `--variable` von der Kommandozeile global.

## Kontrollstrukturen

```robot
IF    $betrag > 100
    Log    Groß
ELSE IF    $betrag > 10
    Log    Mittel
ELSE
    Log    Klein
END

FOR    ${element}    IN    @{LISTE}
    Log    ${element}
END
FOR    ${i}    IN RANGE    1    4        # 1, 2, 3
FOR    ${i}    ${wert}    IN ENUMERATE    @{LISTE}

WHILE    $status != "fertig"    limit=30 seconds
    ${status}=    Hole Status
END

TRY
    Riskanter Schritt
EXCEPT    Fehlermeldung*    type=GLOB    AS    ${fehler}
    Log    ${fehler}
ELSE
    Log    Kein Fehler
FINALLY
    Räume auf
END
```

In Bedingungen die Variablen als `$name` schreiben (ohne Klammern), Text in Anführungszeichen: `IF    $status == "OK"`.

## Häufige BuiltIn-Keywords

| Keyword | Zweck |
|---|---|
| `Log    text    level=INFO` | ins Log schreiben |
| `Set Variable    wert` | Wert zuweisen |
| `Should Be Equal    a    b` | Textvergleich |
| `Should Be Equal As Integers / As Numbers` | Zahlenvergleich |
| `Should Contain    ganzes    teil` | enthält |
| `Should Be True    $x > 1` | Ausdruck ist wahr |
| `Should Be Empty` / `Should Not Be Empty` | leer |
| `Get Length    ${x}` | Länge |
| `Create List` / `Create Dictionary` | erzeugen |
| `Evaluate    2 ** 10` | Python auswerten |
| `Convert To Integer / String / Number` | umwandeln |
| `Fail    Meldung` | absichtlich fehlschlagen |
| `Sleep    1s` | warten (möglichst vermeiden) |
| `Wait Until Keyword Succeeds    30s    2s    Keyword` | wiederholen bis es klappt |
| `Run Keyword And Expect Error    Muster    Keyword` | erwarteter Fehler |

Aus **Collections**: `Append To List`, `List Should Contain Value`, `Get From Dictionary`, `Set To Dictionary`, `Sort List`.
Aus **String**: `Convert To Upper Case`, `Split String`, `Get Substring`, `Replace String`, `Should Match Regexp`.

## Kommandozeile

```text
robot tests/                          alles im Verzeichnis
robot -d out tests/                   Ergebnisse nach out/
robot --include smoke tests/          nur dieser Tag
robot --exclude langsam tests/        ohne diesen Tag
robot --include smokeANDkonto tests/  Tags verknüpfen
robot -v UMGEBUNG:test tests/         Variable von außen setzen
robot --loglevel DEBUG tests/         ausführlicheres Log
robot --dryrun tests/                 nur Syntax prüfen
robot --rerunfailed out/output.xml tests/
                                      nur die gescheiterten
```

Rückgabecode: `0` alles grün, `1`–`249` Anzahl fehlgeschlagener Tests, darüber ein grundsätzlicher Fehler.

Bei uns mit Poetry davor: `poetry run robot -d out tests/`

## Ergebnisdateien

| Datei | Wofür |
|---|---|
| `log.html` | jeder Schritt aufklappbar, hier sucht man Fehler |
| `report.html` | Übersicht, grün oder rot, Statistik pro Tag |
| `output.xml` | Rohdaten für Werkzeuge und `--rerunfailed` |

## Fehlermeldungen übersetzt

| Meldung | Bedeutung |
|---|---|
| `No keyword with name 'X' found.` | Tippfehler, fehlender Import — oder zu wenig Leerzeichen |
| `Variable '${x}' not found.` | Tippfehler im Namen oder falscher Gültigkeitsbereich |
| `Keyword 'X' expected 2 arguments, got 3.` | Argumentzahl passt nicht zur Signatur |
| `Several keywords with name 'X' found.` | Namenskonflikt — mit `Library.X` eindeutig machen |
| `Suite contains no tests.` | leerer Test-Cases-Abschnitt oder alles weggefiltert |
| `Invalid IF condition ... str and int` | in der Bedingung `${x}` statt `$x` benutzt |

## Eigene Keywords in Python

```python
from robot.api import logger

def berechne_zinsen(kapital: float, zinssatz: float, jahre: int) -> float:
    logger.info(f"Berechne für {kapital}")
    return kapital * zinssatz / 100 * jahre
```

Einbinden mit `Library    bank.py`, aufrufen als `Berechne Zinsen`. Unterstriche werden zu Leerzeichen, Typ-Annotationen sorgen für die Umwandlung der Argumente.

---

*Platz für eure Hauskonventionen: Verzeichnisstruktur, Namensregeln, verwendete Libraries, Robocop-Regeln.*
