---
title: Woher die Keywords kommen
---
Du hast jetzt `Log`, `Should Be Equal` und `Create List` benutzt, ohne je zu fragen, woher die eigentlich stammen. Zeit für einen kurzen Blick unter die Haube — er erspart dir später viel Rätselraten.

## Robot Framework kann nichts

Das ist ernst gemeint und der Schlüssel zum Verständnis. Der Kern von Robot Framework kann **keine** Webseite bedienen, **keine** Datenbank abfragen und **keine** Datei lesen. Er kann nur eines: deine `.robot`-Dateien lesen, die Schritte der Reihe nach abarbeiten und protokollieren, was dabei herauskam.

Alles Können steckt in **Libraries**. Sie sind in Python geschrieben und stellen die Keywords bereit:

```text
deine .robot-Datei
        ↓
  Robot Framework          liest, führt aus, protokolliert
        ↓
     Libraries             BuiltIn, Collections, Browser, Requests …
        ↓
  das getestete System     Webseite, REST-Schnittstelle, Datenbank
```

Deshalb sieht ein Test für eine Weboberfläche genauso aus wie einer für eine Schnittstelle. Nur die Library darunter ist eine andere. Und deshalb ist Robot Framework auch nicht auf Testen beschränkt — dieselbe Mechanik automatisiert Geschäftsprozesse, dann heißen die Testfälle eben Tasks.

## Die drei Quellen

Jedes Keyword, das du aufrufst, kommt aus genau einer von drei Richtungen:

1. **BuiltIn** — immer da, ohne Import. `Log`, `Should Be Equal`, `Set Variable`, `Evaluate`.
2. **Eine importierte Library** — muss in die Settings: `Library    Collections`. Mitgeliefert sind unter anderem `Collections`, `String`, `DateTime`, `OperatingSystem`, `Process`. Alles Weitere wird installiert, etwa `Browser` für Weboberflächen oder `RequestsLibrary` für REST.
3. **Du selbst** — im Keywords-Abschnitt oder in einer Resource-Datei.

Findet Robot ein Keyword in keiner dieser Quellen, kommt die Meldung, die du schon kennst: `No keyword with name '...' found.`

> **Kleines Rätsel für zwischendurch:** Was passiert wohl, wenn zwei Libraries ein Keyword mit demselben Namen anbieten? Robot meldet den Konflikt und bricht ab — du löst ihn, indem du den Namen mit der Library davor eindeutig machst: `String.Replace String`.

## Aufgabe

Baue einen Testfall, der Keywords aus **allen drei Quellen** benutzt:

1. `Log` aus BuiltIn,
2. `Convert To Upper Case` aus der Library `String` — die musst du importieren,
3. ein eigenes Keyword `Begrüße Kunden`, das einen Namen als Argument nimmt und ihn loggt.

**Erst raten, dann ausprobieren:** Was sagt Robot, wenn du `Convert To Upper Case` benutzt, *ohne* die Library zu importieren? Probier es ruhig erst falsch — die Fehlermeldung ist die lehrreichste des ganzen Frameworks.

```robot start
*** Settings ***
# fehlt hier etwas?

*** Test Cases ***
Drei Quellen
    ${gross}=    Convert To Upper Case    erika muster
    Log    ${gross}

*** Keywords ***
# eigenes Keyword hierher

```

```robot solution
*** Settings ***
Library    String

*** Test Cases ***
Drei Quellen
    ${gross}=    Convert To Upper Case    erika muster
    Log    ${gross}
    Begrüße Kunden    ${gross}

*** Keywords ***
Begrüße Kunden
    [Arguments]    ${name}
    Log    Willkommen, ${name}!
```

```checks
[
  {"type": "pass"},
  {"type": "library_imported", "name": "String", "msg": "Die Library String muss in den Settings-Abschnitt."},
  {"type": "keyword_used", "name": "Convert To Upper Case"},
  {"type": "keyword_defined", "name": "Begrüße Kunden"},
  {"type": "keyword_args_min", "name": "Begrüße Kunden", "count": 1},
  {"type": "message_contains", "text": "ERIKA MUSTER"},
  {"type": "message_contains", "text": "Willkommen, ERIKA MUSTER!"}
]
```

```hints
`Library    String` im Settings-Abschnitt — Name genau so geschrieben, mit großem S.
---
Das eigene Keyword bekommt wie gewohnt `[Arguments]    ${name}` und darunter ein `Log`.
---
Ruf dein Keyword im Testfall auf und übergib ihm `${gross}`, damit der Gruß den umgewandelten Namen enthält.
```
