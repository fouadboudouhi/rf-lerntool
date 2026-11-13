---
title: Rückgabewerte mit RETURN
---
Ein Keyword kann einen Wert **zurückgeben**, mit `RETURN`:

```robot
*** Keywords ***
Berechne Brutto
    [Arguments]    ${netto}
    ${brutto}=    Evaluate    ${netto} * 1.19
    RETURN    ${brutto}

*** Test Cases ***
Beispiel
    ${ergebnis}=    Berechne Brutto    100
    Should Be Equal As Numbers    ${ergebnis}    119
```

`RETURN` beendet das Keyword sofort. Es können auch mehrere Werte zurückgegeben werden: `RETURN    ${a}    ${b}`, aufgefangen mit `${x}    ${y}=    Keyword`.

> In älteren Dateien siehst du vielleicht `[Return]` oder `Return From Keyword`. Beides ist veraltet, seit Robot Framework 7 ist `RETURN` der Standard.

## Keywords, die prüfen, und Keywords, die liefern

Eine bewährte Aufteilung:

- **Aktionen** tun etwas (`Öffne Konto`).
- **Getter** liefern einen Wert (`Hole Kontostand`), prüfen aber nichts.
- **Prüfungen** vergleichen (`Kontostand sollte sein`).

So bleibt jedes Keyword klein und lässt sich in verschiedenen Tests kombinieren.

## Aufgabe

Schreibe zwei Keywords:

1. `Hole Kontostand` mit einem Argument `${konto}`, das den Wert aus `&{KONTOSTAENDE}` per `RETURN` zurückgibt.
2. `Kontostand sollte sein` mit `${konto}` und `${erwartet}`, das `Hole Kontostand` benutzt und mit `Should Be Equal As Numbers` vergleicht.

Der Test ist schon fertig und ruft beide auf.

```robot start
*** Variables ***
&{KONTOSTAENDE}    Giro=1500    Depot=12000

*** Test Cases ***
Kontostände prüfen
    ${saldo}=    Hole Kontostand    Giro
    Log    Giro hat ${saldo}
    Kontostand sollte sein    Depot    12000

*** Keywords ***
Hole Kontostand
    [Arguments]    ${konto}
    # Wert zurückgeben

Kontostand sollte sein
    # ...

```

```robot solution
*** Variables ***
&{KONTOSTAENDE}    Giro=1500    Depot=12000

*** Test Cases ***
Kontostände prüfen
    ${saldo}=    Hole Kontostand    Giro
    Log    Giro hat ${saldo}
    Kontostand sollte sein    Depot    12000

*** Keywords ***
Hole Kontostand
    [Arguments]    ${konto}
    RETURN    ${KONTOSTAENDE}[${konto}]

Kontostand sollte sein
    [Arguments]    ${konto}    ${erwartet}
    ${ist}=    Hole Kontostand    ${konto}
    Should Be Equal As Numbers    ${ist}    ${erwartet}
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_defined", "name": "Hole Kontostand"},
  {"type": "keyword_returns", "name": "Hole Kontostand"},
  {"type": "keyword_defined", "name": "Kontostand sollte sein"},
  {"type": "keyword_args_min", "name": "Kontostand sollte sein", "count": 2},
  {"type": "message_contains", "text": "Giro hat 1500", "msg": "Hole Kontostand muss den Wert 1500 für Giro liefern."},
  {"type": "keyword_used", "name": "Should Be Equal As Numbers"}
]
```

```hints
`RETURN    ${KONTOSTAENDE}[${konto}]` gibt den Wert direkt zurück.
---
Im zweiten Keyword: `${ist}=    Hole Kontostand    ${konto}` und dann der Vergleich.
```
