---
title: Ein Test, viele Datensätze
---
Irgendwann schreibst du so etwas:

```robot
*** Test Cases ***
IBAN mit 22 Stellen ist gültig
    Prüfe IBAN    DE02120300000000202051    gültig

IBAN mit 21 Stellen ist ungültig
    Prüfe IBAN    DE0212030000000020205    ungültig

IBAN mit Buchstaben mittendrin ist ungültig
    Prüfe IBAN    DE02XX0300000000202051    ungültig
```

Dreimal dieselbe Zeile, nur andere Werte. Dafür gibt es **Test Templates**: Du legst das Keyword einmal als Vorlage fest, und jeder Testfall besteht nur noch aus seinen Daten.

```robot
*** Settings ***
Test Template    Prüfe IBAN

*** Test Cases ***    IBAN                        ERWARTUNG
22 Stellen            DE02120300000000202051      gültig
21 Stellen            DE0212030000000020205       ungültig
Buchstaben drin       DE02XX0300000000202051      ungültig
```

Die Kopfzeile mit `IBAN` und `ERWARTUNG` ist reine Kosmetik für uns Menschen — Robot liest sie als Kommentar. Gilt die Vorlage nur für einen einzelnen Testfall, schreibst du `[Template]    Prüfe IBAN` unter dessen Namen statt `Test Template` in die Settings.

## Der Punkt, auf den es ankommt

Bei normalen Tests bricht ein Testfall beim ersten Fehler ab. Bei Templates ist das anders: **jede Datenzeile ist ein eigener Testfall**, und die folgenden laufen weiter, auch wenn eine scheitert. Genau deshalb sieht man auf einen Blick, welche drei von zwanzig Datensätzen kaputt sind, statt sie einzeln nachzustellen.

## Aufgabe

Schreibe die drei wiederholten Testfälle unten mit einem `Test Template` um. Das Keyword `Prüfe Betrag` ist schon da.

Und jetzt der interessante Teil: **Eine der Datenzeilen ist absichtlich falsch.** Der Betrag `-5` ist nicht gültig, die Zeile behauptet aber das Gegenteil. Lass sie so — dieser Testfall *soll* rot werden. Die Prüfung erwartet genau das: zwei grüne und ein roter Testfall, alle drei ausgeführt.

**Erst raten:** Laufen die Zeilen nach der roten überhaupt noch?

```robot start
*** Test Cases ***
Hundert ist gültig
    Prüfe Betrag    100    gültig

Null ist ungültig
    Prüfe Betrag    0    ungültig

Minus fünf ist gültig
    Prüfe Betrag    -5    gültig

*** Keywords ***
Prüfe Betrag
    [Arguments]    ${betrag}    ${erwartung}
    ${ist_gueltig}=    Evaluate    int($betrag) > 0
    ${soll}=    Evaluate    $erwartung == "gültig"
    Should Be Equal    ${ist_gueltig}    ${soll}

```

```robot solution
*** Settings ***
Test Template    Prüfe Betrag

*** Test Cases ***       BETRAG    ERWARTUNG
Hundert ist gültig       100       gültig
Null ist ungültig        0         ungültig
Minus fünf ist gültig    -5        gültig

*** Keywords ***
Prüfe Betrag
    [Arguments]    ${betrag}    ${erwartung}
    ${ist_gueltig}=    Evaluate    int($betrag) > 0
    ${soll}=    Evaluate    $erwartung == "gültig"
    Should Be Equal    ${ist_gueltig}    ${soll}
```

```checks
[
  {"type": "template_used", "msg": "Setze Test Template im Settings-Abschnitt (oder [Template] je Testfall)."},
  {"type": "tests_count", "count": 3, "label": "Alle drei Datenzeilen wurden ausgeführt", "msg": "Es sollen genau drei Testfälle laufen – einer je Datenzeile."},
  {"type": "test_status", "name": "Hundert ist gültig", "status": "PASS"},
  {"type": "test_status", "name": "Null ist ungültig", "status": "PASS"},
  {"type": "test_status", "name": "Minus fünf ist gültig", "status": "FAIL", "label": "Die falsche Datenzeile ist rot", "msg": "Diese Zeile soll fehlschlagen – lass sie unverändert."},
  {"type": "source_not_regex", "pattern": "^\\s+Prüfe Betrag\\s{2,}", "label": "Keine Aufrufzeilen mehr im Testfall", "msg": "Mit einer Vorlage stehen im Testfall nur noch die Daten, kein Keyword-Aufruf."}
]
```

```hints
In die Settings: `Test Template    Prüfe Betrag`. Dann fällt der Keyword-Name aus allen Testfällen weg.
---
Der Testfall besteht danach aus dem Namen und – in derselben Zeile, durch zwei Leerzeichen getrennt – seinen Argumenten: `Null ist ungültig    0    ungültig`
---
Die dritte Zeile bleibt inhaltlich falsch. Genau daran siehst du, dass die Zeilen unabhängig voneinander laufen.
```
