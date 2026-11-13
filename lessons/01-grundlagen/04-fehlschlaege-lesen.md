---
title: Fehlschläge lesen
---
Tests schlagen fehl, das ist ihr Zweck. Entscheidend ist, dass du schnell verstehst, **warum**. Robot Framework erzeugt bei jedem Lauf drei Dateien:

- **output.xml**: alle Rohdaten (für Werkzeuge)
- **log.html**: der detaillierte Ablauf, jeder Schritt aufklappbar, mit Zeiten und Nachrichten
- **report.html**: die Übersicht, grün oder rot

In diesem Tool siehst du die **Konsole** und das **Log** direkt unter dem Editor. Das Log ist genau dieselbe `log.html`, die du auch bei einem echten Lauf bekommst.

## Was passiert bei einem Fehler?

Sobald ein Keyword fehlschlägt, wird der **Rest des Testfalls übersprungen**. Die anderen Testfälle laufen aber normal weiter. Die Fehlermeldung steht in der Konsole direkt unter dem Testnamen und im Log rot markiert.

```robot
*** Test Cases ***
Beispiel
    Should Be Equal    1    2      # schlägt fehl: 1 != 2
    Log    Wird nie ausgeführt
```

Mit dem Keyword `Fail` kannst du einen Test absichtlich fehlschlagen lassen, zum Beispiel für noch nicht umgesetzte Fälle:

```robot
Fail    Noch nicht implementiert
```

Eine eigene Fehlermeldung macht die Analyse leichter. Fast alle Should-Keywords akzeptieren dafür ein zusätzliches Argument `msg=`:

```robot
Should Be Equal    ${status}    OK    msg=Der Import ist nicht durchgelaufen
```

## Aufgabe

Der Test `Fehlersuche` schlägt fehl. Finde im Log heraus, an welcher Stelle, und korrigiere den **Erwartungswert**, sodass er besteht. Der Test `Absichtlich rot` soll dagegen bewusst mit `Fail` und einer sinnvollen Meldung fehlschlagen. Am Ende ist also ein Test grün und einer rot, und das ist hier richtig so.

```robot start
*** Test Cases ***
Fehlersuche
    Log    Schritt 1
    Should Be Equal    Robot Framework    Robot Framewerk
    Log    Schritt 3

Absichtlich rot
    Log    Dieser Test soll fehlschlagen

```

```robot solution
*** Test Cases ***
Fehlersuche
    Log    Schritt 1
    Should Be Equal    Robot Framework    Robot Framework
    Log    Schritt 3

Absichtlich rot
    Log    Dieser Test soll fehlschlagen
    Fail    Noch nicht implementiert
```

```checks
[
  {"type": "test_status", "name": "Fehlersuche", "status": "PASS", "msg": "„Fehlersuche“ muss bestehen – korrigiere den Erwartungswert."},
  {"type": "test_status", "name": "Absichtlich rot", "status": "FAIL", "msg": "„Absichtlich rot“ soll fehlschlagen."},
  {"type": "keyword_used_in", "name": "Fail", "test": "Absichtlich rot"},
  {"type": "message_contains", "text": "Schritt 3", "msg": "Schritt 3 wurde nicht erreicht – der Test bricht vorher ab."}
]
```

```hints
Öffne den Reiter **Log** und klappe den Test „Fehlersuche“ auf. Der rote Schritt zeigt den Vergleich.
---
„Framewerk“ ist ein Tippfehler im Erwartungswert.
---
Für den zweiten Test: `Fail    Noch nicht implementiert`
```
