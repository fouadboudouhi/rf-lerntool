---
title: Fehler abfangen mit TRY
---
Normalerweise beendet ein fehlgeschlagenes Keyword den Test. Manchmal ist ein Fehler aber **erwartet** oder du willst trotzdem weitermachen. Dafür gibt es `TRY` / `EXCEPT`:

```robot
*** Test Cases ***
Beispiel
    TRY
        Überweise    -100    Erika
    EXCEPT    Betrag muss positiv sein
        Log    Erwarteter Fehler
    END
```

- Der `EXCEPT`-Zweig läuft nur, wenn im `TRY`-Block ein Fehler auftritt.
- Ohne Muster fängt `EXCEPT` **jeden** Fehler. Mit Muster nur passende Fehlermeldungen. Für Teilübereinstimmungen: `EXCEPT    Betrag*    type=GLOB` oder `type=REGEXP`.
- Die Fehlermeldung fängst du mit `AS` auf: `EXCEPT    AS    ${fehler}`.
- `ELSE` läuft, wenn **kein** Fehler auftrat; `FINALLY` läuft **immer**.

```robot
TRY
    Verbinde
EXCEPT    AS    ${fehler}
    Log    Verbindung fehlgeschlagen: ${fehler}
ELSE
    Log    Verbunden
FINALLY
    Log    Aufräumen
END
```

## Erwartete Fehler prüfen

Wenn ein Test **prüfen** soll, dass etwas fehlschlägt, ist `Run Keyword And Expect Error` oft kürzer als TRY:

```robot
Run Keyword And Expect Error    Betrag muss positiv sein    Überweise    -100    Erika
```

TRY ist besser, wenn du nach dem Fehler noch mehrere Schritte ausführen willst.

## Aufgabe

Das Keyword `Überweise` wirft bei negativen Beträgen den Fehler `Betrag muss positiv sein`. Ergänze den Test so, dass

1. der Aufruf `Überweise    ${-50}` in einem `TRY`-Block steht (`${-50}` statt `-50`, damit eine Zahl und kein Text ankommt),
2. der `EXCEPT`-Zweig die Fehlermeldung mit `AS    ${fehler}` auffängt und `Abgefangen: <fehlermeldung>` loggt,
3. ein `FINALLY`-Zweig `Vorgang abgeschlossen` loggt.

Der Test soll am Ende **bestehen**.

```robot start
*** Test Cases ***
Negative Überweisung wird abgelehnt
    Überweise    ${-50}

*** Keywords ***
Überweise
    [Arguments]    ${betrag}
    IF    $betrag <= 0
        Fail    Betrag muss positiv sein
    END
    Log    ${betrag} überwiesen

```

```robot solution
*** Test Cases ***
Negative Überweisung wird abgelehnt
    TRY
        Überweise    ${-50}
    EXCEPT    AS    ${fehler}
        Log    Abgefangen: ${fehler}
    FINALLY
        Log    Vorgang abgeschlossen
    END

*** Keywords ***
Überweise
    [Arguments]    ${betrag}
    IF    $betrag <= 0
        Fail    Betrag muss positiv sein
    END
    Log    ${betrag} überwiesen
```

```checks
[
  {"type": "pass", "msg": "Der Test muss bestehen – der Fehler soll abgefangen werden."},
  {"type": "control", "kind": "TRY"},
  {"type": "message_contains", "text": "Abgefangen: Betrag muss positiv sein"},
  {"type": "message_contains", "text": "Vorgang abgeschlossen"},
  {"type": "source_regex", "pattern": "^\\s+FINALLY\\s*$", "label": "FINALLY verwendet"},
  {"type": "source_regex", "pattern": "^\\s+EXCEPT\\b.*\\bAS\\s{2,}\\$\\{", "label": "Fehlermeldung mit AS aufgefangen"}
]
```

```hints
Rahmen: `TRY` … `EXCEPT    AS    ${fehler}` … `FINALLY` … `END`
---
Im EXCEPT-Zweig: `Log    Abgefangen: ${fehler}`
```
