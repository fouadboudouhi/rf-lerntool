---
title: Keywords mit Argumenten
---
Ein Keyword ohne Argumente macht immer dasselbe. Richtig nützlich wird es mit **Argumenten**, die du mit der Einstellung `[Arguments]` deklarierst:

```robot
*** Keywords ***
Begrüße
    [Arguments]    ${name}
    Log    Hallo ${name}!

*** Test Cases ***
Beispiel
    Begrüße    Erika
    Begrüße    Max
```

Innerhalb des Keywords ist `${name}` eine lokale Variable mit dem übergebenen Wert.

## Mehrere Argumente und Standardwerte

```robot
Überweise
    [Arguments]    ${betrag}    ${empfaenger}    ${waehrung}=EUR
    Log    Überweise ${betrag} ${waehrung} an ${empfaenger}
```

- Argumente mit Standardwert (`${waehrung}=EUR`) sind optional und müssen **nach** den Pflichtargumenten stehen.
- Beim Aufruf kann man Argumente auch **benannt** übergeben: `Überweise    100    Erika    waehrung=CHF`. Das macht Aufrufe mit vielen Argumenten lesbarer.

## Dokumentation für Keywords

Auch Keywords bekommen eine `[Documentation]`. Bei einer wachsenden Keyword-Bibliothek ist sie unverzichtbar, weil Werkzeuge wie `libdoc` daraus eine durchsuchbare Referenz erzeugen:

```robot
Überweise
    [Documentation]    Führt eine Überweisung aus. Währung ist optional (Standard EUR).
    [Arguments]    ${betrag}    ${empfaenger}    ${waehrung}=EUR
```

## Aufgabe

Schreibe ein Keyword `Prüfe Kontostand` mit zwei Argumenten `${konto}` und `${erwartet}`, das

1. `Sollte ${erwartet} auf ${konto} haben` loggt und
2. mit `Should Be Equal As Numbers` prüft, dass `${erwartet}` gleich dem Wert aus dem Dictionary `&{KONTOSTAENDE}` für dieses Konto ist.

Rufe es im Test für `Giro` (erwartet `1500`) und `Depot` (erwartet `12000`) auf.

```robot start
*** Variables ***
&{KONTOSTAENDE}    Giro=1500    Depot=12000

*** Test Cases ***
Kontostände prüfen
    # zwei Aufrufe

*** Keywords ***
Prüfe Kontostand
    # [Arguments] ...

```

```robot solution
*** Variables ***
&{KONTOSTAENDE}    Giro=1500    Depot=12000

*** Test Cases ***
Kontostände prüfen
    Prüfe Kontostand    Giro    1500
    Prüfe Kontostand    Depot    12000

*** Keywords ***
Prüfe Kontostand
    [Arguments]    ${konto}    ${erwartet}
    Log    Sollte ${erwartet} auf ${konto} haben
    Should Be Equal As Numbers    ${erwartet}    ${KONTOSTAENDE}[${konto}]
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_defined", "name": "Prüfe Kontostand"},
  {"type": "keyword_args_min", "name": "Prüfe Kontostand", "count": 2},
  {"type": "message_contains", "text": "Sollte 1500 auf Giro haben"},
  {"type": "message_contains", "text": "Sollte 12000 auf Depot haben"},
  {"type": "keyword_used", "name": "Should Be Equal As Numbers"}
]
```

```hints
`[Arguments]    ${konto}    ${erwartet}` als erste Zeile im Keyword.
---
Dictionary-Zugriff mit einer Variablen als Schlüssel: `${KONTOSTAENDE}[${konto}]`
---
Aufruf: `Prüfe Kontostand    Giro    1500`
```
