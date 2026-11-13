---
title: Wie finde ich das richtige Keyword?
---
Die häufigste Frage im Alltag ist nicht „wie schreibe ich eine Schleife", sondern: **Gibt es dafür schon ein Keyword?** Meistens ja. Die Kunst besteht darin, es zu finden und seine Signatur zu lesen.

## Wo man sucht

- Die **Keyword-Dokumentation** jeder Library liegt online unter `robotframework.org/robotframework/` — für BuiltIn, Collections, String und die übrigen mitgelieferten.
- Im Projekt erzeugst du sie selbst: `poetry run libdoc Collections doku.html`. Das funktioniert auch für **eure eigenen** Resource-Dateien: `libdoc konto.resource konto.html`. Deshalb lohnt sich die `[Documentation]` an eigenen Keywords.
- In der IDE (mit der RobotCode-Erweiterung) reicht der Mauszeiger über dem Keyword.

## Eine Signatur lesen

So sieht ein Eintrag in der Dokumentation aus:

```text
Should Be Equal
    first, second, msg=None, values=True, ignore_case=False

Get Substring
    string, start, end=None

Split String
    string, separator=None, max_split=-1
```

Das liest sich so: Namen ohne `=` sind **Pflicht**, Namen mit `=` haben einen **Standardwert** und sind optional. `msg=None` heißt also: Du *kannst* eine eigene Fehlermeldung mitgeben, musst aber nicht.

Optionale Argumente übergibst du am besten **benannt**, dann ist die Reihenfolge egal und der Aufruf bleibt lesbar:

```robot
Should Be Equal    ${status}    OK    msg=Import ist nicht durchgelaufen
Split String       a,b,c        separator=,
Get Substring      Robot Framework    6
```

> **Faustregel aus der Praxis:** Wenn ein Aufruf mehr als drei unbenannte Argumente hat, versteht ihn in drei Monaten niemand mehr — auch du nicht. Ab dem dritten lohnt sich `name=wert`.

## Aufgabe

Hier sind drei Signaturen, frisch aus der Dokumentation kopiert:

```text
Convert To Upper Case    string
Get Substring            string, start, end=None
Should Contain           container, item, msg=None, ignore_case=False
```

Baue damit einen Testfall, der

1. aus `DE02120300000000202051` mit `Get Substring` die ersten beiden Zeichen herausschneidet (das Länderkürzel),
2. prüft, dass das Ergebnis `DE` ist,
3. mit `Should Contain` prüft, dass die IBAN die Ziffernfolge `2051` enthält — und dabei eine **eigene Fehlermeldung** über das Argument `msg=` mitgibt.

**Erst raten:** `Get Substring` mit `start=0` und `end=2` — sind das zwei oder drei Zeichen?

```robot start
*** Settings ***
Library    String

*** Variables ***
${IBAN}    DE02120300000000202051

*** Test Cases ***
IBAN zerlegen
    # hier geht es los

```

```robot solution
*** Settings ***
Library    String

*** Variables ***
${IBAN}    DE02120300000000202051

*** Test Cases ***
IBAN zerlegen
    ${land}=    Get Substring    ${IBAN}    0    2
    Should Be Equal    ${land}    DE
    Should Contain    ${IBAN}    2051    msg=Die Prüfziffernfolge fehlt in der IBAN
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_used", "name": "Get Substring"},
  {"type": "variable_assigned", "name": "${land}"},
  {"type": "keyword_used", "name": "Should Contain"},
  {"type": "source_regex", "pattern": "Should Contain[\\s\\S]{0,120}?msg=\\S", "label": "Should Contain mit eigener Fehlermeldung", "msg": "Hänge msg=… als benanntes Argument an Should Contain an."}
]
```

```hints
`Get Substring` nimmt drei Argumente: den Text, den Startindex und den Endindex. Gezählt wird ab 0, das Ende ist nicht mehr dabei — `0` bis `2` liefert also zwei Zeichen.
---
Das Ergebnis brauchst du in einer Variablen: `${land}=    Get Substring    ${IBAN}    0    2`
---
Benannte Argumente werden wie ein normales Argument angehängt: `Should Contain    ${IBAN}    2051    msg=Dein Text`
```
