---
title: Leerzeichen sind Syntax
---
Die wichtigste Regel in Robot Framework, und die häufigste Fehlerquelle für Einsteiger:

> **Zwei oder mehr Leerzeichen trennen Keyword und Argumente.** Ein einzelnes Leerzeichen gehört zum Text.

```robot
Log    Hallo Welt          # Keyword "Log" mit dem Argument "Hallo Welt"
Log Hallo Welt             # Keyword "Log Hallo Welt" – existiert nicht!
Log    Hallo    Welt       # Keyword "Log" mit ZWEI Argumenten
```

Die letzte Zeile ist ein Fehler, weil `Log` zwar ein zweites Argument (den Log-Level) akzeptiert, „Welt“ aber kein gültiger Level ist.

## Einrückung

Die Schritte eines Tests werden eingerückt, üblich sind **4 Leerzeichen**. Was ganz links steht, ist ein neuer Testfall- oder Keyword-Name. Tabs funktionieren auch, werden aber in den meisten Teams vermieden.

## Mehrere Argumente

Keywords können mehrere Argumente haben, jeweils durch 2+ Leerzeichen getrennt:

```robot
Should Be Equal    1    1
Should Contain     Robot Framework    Robot
```

Ein Tipp für die Praxis: Viele Teams richten Argumente mit **4 Leerzeichen** aus, damit der Code lesbar bleibt. Der Editor hier setzt bei `Tab` automatisch 4 Leerzeichen.

## Aufgabe

Der Test unten ist kaputt, weil die Leerzeichen falsch gesetzt sind. Repariere ihn, ohne die Nachrichten zu verändern. Der Test soll drei Log-Nachrichten schreiben: `Erste Zeile`, `Zweite Zeile` und `Alles klar`.

```robot start
*** Test Cases ***
Kaputter Test
    Log Erste Zeile
    Log  Zweite    Zeile
  Log    Alles klar
```

```robot solution
*** Test Cases ***
Kaputter Test
    Log    Erste Zeile
    Log    Zweite Zeile
    Log    Alles klar
```

```checks
[
  {"type": "pass"},
  {"type": "message_contains", "text": "Erste Zeile"},
  {"type": "message_contains", "text": "Zweite Zeile"},
  {"type": "message_contains", "text": "Alles klar"},
  {"type": "source_not_regex", "pattern": "^\\s{1,3}\\S", "label": "Einheitliche Einrückung mit 4 Leerzeichen", "msg": "Mindestens eine Zeile ist mit weniger als 4 Leerzeichen eingerückt."}
]
```

```hints
`Log Erste Zeile` wird als Keyword mit dem Namen „Log Erste Zeile“ gelesen. Füge nach `Log` weitere Leerzeichen ein.
---
`Zweite    Zeile` sind zwei Argumente. Ersetze die vier Leerzeichen dazwischen durch ein einzelnes.
---
Die letzte Zeile ist nur mit 2 Leerzeichen eingerückt. Das funktioniert zwar, ist aber uneinheitlich – rücke sie wie die anderen mit 4 ein.
```
