---
title: Dein erster Test
---
Willkommen! In diesem Kurs lernst du **Robot Framework** Schritt für Schritt, direkt im Browser. Rechts siehst du einen Editor, darunter das Ergebnis. Du kannst jederzeit auf **Ausführen** klicken (oder `Strg+Enter` drücken).

## Wie eine Robot-Datei aufgebaut ist

Eine `.robot`-Datei besteht aus **Abschnitten**, die mit drei Sternen beginnen:

```robot
*** Settings ***      # Imports, Setup/Teardown, Dokumentation
*** Variables ***     # Variablen, die in der ganzen Datei gelten
*** Test Cases ***    # die eigentlichen Testfälle
*** Keywords ***      # eigene Keywords (wiederverwendbare Bausteine)
```

Du brauchst nicht alle Abschnitte. Für den Anfang reicht `*** Test Cases ***`.

## Testfälle und Keywords

Unter `*** Test Cases ***` steht jeder Testfall **ganz links** in einer eigenen Zeile. Darunter folgen **eingerückt** die Schritte. Jeder Schritt ist ein Aufruf eines **Keywords**, das ist so etwas wie eine Funktion.

```robot
*** Test Cases ***
Mein erster Test
    Log    Das ist ein Schritt
    Log    Und noch einer
```

`Log` ist ein eingebautes Keyword: Es schreibt eine Nachricht ins Log. Nach dem Keyword-Namen folgt das Argument, getrennt durch **mindestens zwei Leerzeichen** (dazu gleich mehr).

## Aufgabe

Ergänze den Testfall `Hallo Welt` so, dass er mit `Log` die Nachricht **Hallo Welt** ausgibt. Führe den Test aus und sieh dir danach die Reiter **Konsole** und **Log** an.

```robot start
*** Test Cases ***
Hallo Welt
    # Hier fehlt noch ein Schritt

```

```robot solution
*** Test Cases ***
Hallo Welt
    Log    Hallo Welt
```

```checks
[
  {"type": "pass"},
  {"type": "test_named", "name": "Hallo Welt"},
  {"type": "keyword_used", "name": "Log", "msg": "Verwende das Keyword Log."},
  {"type": "message_contains", "text": "Hallo Welt", "msg": "Die Nachricht muss genau „Hallo Welt“ lauten."}
]
```

```hints
Ein Schritt steht eingerückt (4 Leerzeichen) unter dem Testnamen.
---
Zwischen `Log` und der Nachricht müssen mindestens zwei Leerzeichen stehen: `Log    Hallo Welt`.
```
