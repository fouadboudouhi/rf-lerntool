---
title: Resource-Dateien
---
Sobald mehrere Testdateien dieselben Keywords brauchen, gehören diese in eine **Resource-Datei**. Sie hat die Endung `.resource`, denselben Aufbau wie eine `.robot`-Datei, aber **keinen** Test-Cases-Abschnitt.

```robot
# konto.resource
*** Settings ***
Library    Collections

*** Variables ***
${STANDARD_WAEHRUNG}    EUR

*** Keywords ***
Öffne Konto
    [Arguments]    ${typ}
    Log    Öffne ${typ}
```

Eingebunden wird sie im Settings-Abschnitt mit `Resource`:

```robot
*** Settings ***
Resource    konto.resource

*** Test Cases ***
Beispiel
    Öffne Konto    Giro
    Log    ${STANDARD_WAEHRUNG}
```

Alles aus der Resource ist danach verfügbar: Keywords, Variablen und auch die Libraries, die sie importiert.

## Typische Projektstruktur

```text
tests/
    zahlungsverkehr/
        ueberweisung.robot
        dauerauftrag.robot
resources/
    common.resource        # Anmeldung, Navigation, Setup/Teardown
    konto.resource         # fachliche Keywords rund ums Konto
    variables.resource     # Umgebungsdaten
```

Pfade sind relativ zur importierenden Datei: `Resource    ../../resources/konto.resource`. Ein Resource darf andere Resources einbinden.

## Aufgabe

Rechts gibt es einen zweiten Reiter `konto.resource` (schreibgeschützt). Binde ihn in `test.robot` ein und nutze die darin definierten Keywords `Öffne Konto` und `Kontostand sollte sein` sowie die Variable `${STANDARD_WAEHRUNG}`: Öffne das Konto `Giro`, prüfe, dass der Kontostand `1500` ist, und logge `Währung: EUR` über die Variable.

```robot start
*** Settings ***
# Resource einbinden

*** Test Cases ***
Girokonto prüfen
    # Öffne Konto, Kontostand prüfen, Währung loggen

```

```robot readonly:konto.resource
*** Variables ***
${STANDARD_WAEHRUNG}    EUR
&{KONTOSTAENDE}         Giro=1500    Depot=12000

*** Keywords ***
Öffne Konto
    [Arguments]    ${typ}
    Log    Konto ${typ} geöffnet

Kontostand sollte sein
    [Arguments]    ${typ}    ${erwartet}
    Should Be Equal As Numbers    ${KONTOSTAENDE}[${typ}]    ${erwartet}
```

```robot solution
*** Settings ***
Resource    konto.resource

*** Test Cases ***
Girokonto prüfen
    Öffne Konto    Giro
    Kontostand sollte sein    Giro    1500
    Log    Währung: ${STANDARD_WAEHRUNG}
```

```checks
[
  {"type": "pass"},
  {"type": "resource_imported"},
  {"type": "keyword_used", "name": "Öffne Konto"},
  {"type": "keyword_used", "name": "Kontostand sollte sein"},
  {"type": "message_contains", "text": "Konto Giro geöffnet"},
  {"type": "message_contains", "text": "Währung: EUR"}
]
```

```hints
`Resource    konto.resource` im Settings-Abschnitt.
---
Danach sind die Keywords wie eigene verwendbar: `Öffne Konto    Giro`
```
