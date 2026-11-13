---
title: Stil prüfen mit Robocop
run_modes: robocop | robot
---
Dein Test ist grün. Trotzdem kann er im Review durchfallen — weil er sich nicht liest wie die anderen dreihundert im Repo.

Dafür gibt es **Robocop**: einen Linter für Robot Framework. Er führt nichts aus, sondern liest den Code und meldet, was gegen vereinbarte Regeln verstößt. Bei uns läuft er in der Pipeline, und zwar bevor die Tests starten.

```text
poetry run robocop check tests/      # prüfen
poetry run robocop format tests/     # formatieren (früher Robotidy)
```

## Wie eine Meldung aussieht

```text
test.robot:2:1 DOC02 Missing documentation in 'depot anlegen' test case
test.robot:2:1 NAME07 Test case 'depot anlegen' title does not start with capital letter
test.robot:4:120 LEN08 Line is too long (203/120)
```

Zu lesen als: **Datei:Zeile:Spalte**, dann die **Regel-ID**, dann der Befund. Die ID ist das Wichtigste — nach ihr sucht man in der Dokumentation, und mit ihr schaltet man eine Regel ab, wenn das Team sie für Unsinn hält. Die Kürzel gruppieren nach Thema: `DOC` Dokumentation, `NAME` Benennung, `LEN` Länge, `SPC` Leerzeichen, `ORD` Reihenfolge, `MISC` Verschiedenes.

Robocop zeigt zu jedem Fund die betroffene Zeile an und schlägt meistens eine Lösung vor. Anders als ein roter Test heißt eine Meldung nicht „kaputt", sondern „so machen wir das hier nicht".

Ein Teil der Meldungen betrifft reine Formatierung. Die muss man nicht von Hand beheben: `robocop format` macht das automatisch, so wie `black` bei Python. Hier machst du es einmal selbst, damit du siehst, was dabei passiert.

> **Wichtig für später:** Welche Regeln gelten, steht in der Projektkonfiguration. Was du hier siehst, sind die Standardregeln — eure können strenger oder lockerer sein. Wenn du dich über eine Regel wunderst: Sie ist eine Vereinbarung, kein Naturgesetz, und diskutierbar.

## Aufgabe

**Diese Lektion hat den Knopf „Robocop"** neben „Ausführen". Robocop wird dafür einmalig nachgeladen, das dauert einen Moment.

Der Test unten ist grün, aber stilistisch eine Zumutung. Lass Robocop laufen, lies die Meldungen und räum auf, bis nichts mehr übrig ist. Du brauchst dafür:

- eine `[Documentation]` für die Suite (ganz oben in einem `*** Settings ***`-Abschnitt) und eine für den Testfall,
- einen Testnamen, der groß anfängt und beschreibt, was geprüft wird,
- Zeilen, die nicht länger als 120 Zeichen sind,
- und **zwei** Leerzeilen zwischen den Abschnitten — eine Formatierungsregel, über die jeder einmal stolpert.

**Erst raten:** Wie viele Punkte findet Robocop, bevor du etwas änderst?

```robot start
*** Test Cases ***
depot test
    Log    Der folgende Text ist absichtlich viel zu lang und sprengt die Zeilenlänge, die Robocop standardmäßig erlaubt, nämlich einhundertzwanzig Zeichen, was hier locker überschritten wird.
    Should Be Equal    1    1
```

```robot solution
*** Settings ***
Documentation    Beispiele für den Depot-Service.


*** Test Cases ***
Depot wird korrekt angelegt
    [Documentation]    Prüft, dass das Anlegen eines Depots erfolgreich ist.
    Log    Der folgende Text ist jetzt kurz genug.
    Should Be Equal    1    1
```

```checks
[
  {"type": "pass"},
  {"type": "robocop_max", "count": 0, "label": "Robocop meldet nichts mehr"},
  {"type": "documentation", "scope": "suite", "msg": "Die Suite braucht oben eine Documentation im Settings-Abschnitt."},
  {"type": "documentation", "scope": "test", "msg": "Der Testfall braucht eine [Documentation]."}
]
```

```hints
Klick zuerst auf „Robocop“ und lies die Meldungen in der Konsole. Jede nennt Zeile, Regel-ID und einen Vorschlag.
---
Die Suite-Dokumentation ist eine eigene Zeile im Settings-Abschnitt: `Documentation    Text`. Die des Testfalls steht eingerückt als `[Documentation]    Text` unter dem Namen.
---
`depot test` verstößt gleich doppelt: kleingeschrieben und nichtssagend. Ein guter Name beschreibt das erwartete Verhalten, etwa „Depot wird korrekt angelegt“.
---
`SPC03` verlangt zwei Leerzeilen zwischen `*** Settings ***` und `*** Test Cases ***`. Genau solche Regeln erledigt sonst `robocop format` für dich.
---
Die lange Zeile kürzt du einfach — oder du brichst sie mit `...` um. Robocop sagt dir die erlaubte Länge in der Meldung.
```
