---
title: Log-Level und Fehlersuche
run_options: loglevel=DEBUG
---
Wenn ein Test rot ist und die Meldung nicht weiterhilft, dreht man die Ausführlichkeit hoch.

Jede Log-Nachricht hat eine Stufe:

| Stufe | Wofür |
|---|---|
| `TRACE` | jeder Keyword-Aufruf mit Argumenten und Rückgabewert — sehr viel |
| `DEBUG` | Details für die Fehlersuche, etwa Rohantworten |
| `INFO` | der Normalfall, das siehst du standardmäßig |
| `WARN` | etwas ist auffällig, der Test läuft weiter |
| `ERROR` | etwas ist kaputt |

Im Log siehst du normalerweise ab `INFO` aufwärts. Wer tiefer graben will:

```text
robot --loglevel DEBUG tests/       # zeigt auch DEBUG-Nachrichten
robot --loglevel TRACE tests/       # zusätzlich jeden Keyword-Aufruf
robot --loglevel DEBUG:INFO tests/  # aufzeichnen ab DEBUG, anzeigen ab INFO
```

Die letzte Schreibweise ist ein netter Trick: Alles wird protokolliert, aber das Log öffnet sich in der ruhigen Ansicht. Die Details blendet man im Log per Schalter ein, wenn man sie braucht.

Im eigenen Code schreibst du die Stufe als Argument:

```robot
Log    Depot geladen
Log    Rohantwort: {...}    level=DEBUG
Log    Das dauert ungewöhnlich lang    level=WARN
```

> **Faustregel:** `INFO` für das, was fachlich passiert („Überweisung gebucht"), `DEBUG` für das, was technisch passiert („HTTP 200, 4 kB Antwort"). Wer alles auf INFO schreibt, macht das Log unlesbar — und wer nichts schreibt, sucht später im Dunkeln.

## Aufgabe

**Diese Lektion läuft mit `--loglevel DEBUG`** — unter dem Ergebnis steht der nachgestellte Befehl.

Ergänze den Test um drei Log-Nachrichten: `Depot geladen` auf der Normalstufe, `Rohantwort vom Server` auf `DEBUG` und `Antwort kam spät` auf `WARN`. Sieh dir danach im Reiter **Log** an, wie die drei unterschiedlich markiert sind.

**Erst raten:** Welche der drei Zeilen fehlt im Log, wenn man ohne `--loglevel DEBUG` startet?

```robot start
*** Test Cases ***
Depot laden
    # drei Log-Zeilen ergänzen
    Should Be Equal    1    1
```

```robot solution
*** Test Cases ***
Depot laden
    Log    Depot geladen
    Log    Rohantwort vom Server    level=DEBUG
    Log    Antwort kam spät    level=WARN
    Should Be Equal    1    1
```

```checks
[
  {"type": "pass"},
  {"type": "message_contains", "text": "Depot geladen"},
  {"type": "message_contains", "text": "Rohantwort vom Server"},
  {"type": "message_contains", "text": "Antwort kam spät"},
  {"type": "source_regex", "pattern": "level=DEBUG", "label": "Zweite Nachricht auf Stufe DEBUG", "msg": "Hänge level=DEBUG als weiteres Argument an."},
  {"type": "source_regex", "pattern": "level=WARN", "label": "Dritte Nachricht auf Stufe WARN", "msg": "Hänge level=WARN als weiteres Argument an."}
]
```

```hints
Die Stufe ist einfach ein weiteres Argument: `Log    Text    level=DEBUG`.
---
Die erste Zeile braucht keine Stufe — INFO ist die Voreinstellung.
---
Nach dem Lauf: Reiter „Log“ öffnen und den Testfall aufklappen. Die WARN-Zeile taucht zusätzlich ganz oben im Report auf — Warnungen werden gesammelt.
```
