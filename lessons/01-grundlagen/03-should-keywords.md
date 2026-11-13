---
title: Prüfen mit Should-Keywords
---
Ein Test, der nur loggt, prüft nichts. Die eigentliche Arbeit machen **Verifikations-Keywords**, die fast alle mit `Should` beginnen. Schlägt die Prüfung fehl, schlägt der Test fehl.

Die wichtigsten aus der eingebauten Library **BuiltIn** (sie ist immer verfügbar, ohne Import):

| Keyword | Prüft |
|---|---|
| `Should Be Equal    a    b` | `a` und `b` sind gleich (als Text) |
| `Should Be Equal As Integers    1    1` | gleich, als ganze Zahlen |
| `Should Be Equal As Numbers    1.0    1` | gleich, als Zahlen |
| `Should Not Be Equal    a    b` | ungleich |
| `Should Contain    Robot Framework    Robot` | Text/Liste enthält etwas |
| `Should Start With    Hallo Welt    Hallo` | beginnt mit |
| `Should Be True    1 < 2` | Ausdruck ist wahr |
| `Should Be Empty    ${liste}` | leer |

Achtung bei `Should Be Equal`: Alle Argumente in Robot sind zunächst **Text**. `Should Be Equal    1    1.0` schlägt fehl, `Should Be Equal As Numbers    1    1.0` nicht.

## Mehrere Testfälle

Eine Datei kann beliebig viele Testfälle enthalten. Jeder beginnt mit einem Namen ganz links. Gute Testnamen beschreiben, **was** geprüft wird, nicht wie:

```robot
*** Test Cases ***
Login mit gültigen Daten funktioniert
    ...

Login mit falschem Passwort wird abgelehnt
    ...
```

## Aufgabe

1. Ergänze in `Text-Vergleich` eine Prüfung, dass der Text `Robot Framework` den Teil `Robot` enthält.
2. Schreibe einen **zweiten Testfall** mit dem Namen `Zahlen-Vergleich`, der prüft, dass `42` und `42.0` als Zahlen gleich sind.

```robot start
*** Test Cases ***
Text-Vergleich
    Should Be Equal    Robot    Robot

```

```robot solution
*** Test Cases ***
Text-Vergleich
    Should Be Equal    Robot    Robot
    Should Contain    Robot Framework    Robot

Zahlen-Vergleich
    Should Be Equal As Numbers    42    42.0
```

```checks
[
  {"type": "pass"},
  {"type": "tests_min", "count": 2},
  {"type": "test_named", "name": "Zahlen-Vergleich"},
  {"type": "keyword_used_in", "name": "Should Contain", "test": "Text-Vergleich"},
  {"type": "keyword_used_in", "name": "Should Be Equal As Numbers", "test": "Zahlen-Vergleich", "msg": "Verwende Should Be Equal As Numbers im Test Zahlen-Vergleich."}
]
```

```hints
`Should Contain` nimmt zwei Argumente: den ganzen Text und den erwarteten Teil.
---
Ein neuer Testfall beginnt mit dem Namen ganz links, ohne Einrückung. Eine Leerzeile davor macht es lesbarer.
---
`Should Be Equal    42    42.0` schlägt fehl, weil Texte verglichen werden. Nimm die `As Numbers`-Variante.
```
