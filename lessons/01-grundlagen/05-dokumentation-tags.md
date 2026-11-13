---
title: Dokumentation und Tags
---
Testfälle können **Einstellungen** in eckigen Klammern haben. Sie stehen direkt unter dem Testnamen, vor den Schritten.

## [Documentation]

Beschreibt, was der Test prüft. Die Dokumentation erscheint im Log und Report, und sie hilft Kollegen, die den Test in einem Jahr lesen.

```robot
*** Test Cases ***
Überweisung mit ausreichender Deckung
    [Documentation]    Prüft, dass eine Überweisung innerhalb des Kontostands
    ...                gebucht wird und der Saldo korrekt reduziert ist.
    Log    ...
```

Die drei Punkte `...` setzen eine Zeile fort. Das funktioniert überall in Robot, wenn eine Zeile zu lang wird.

## [Tags]

Tags sind Etiketten, nach denen man Tests **auswählen** oder **auswerten** kann. Beim Ausführen auf der Kommandozeile:

```text
robot --include smoke tests/          # nur Tests mit dem Tag smoke
robot --exclude langsam tests/        # alle außer langsam
```

```robot
Überweisung mit ausreichender Deckung
    [Tags]    smoke    zahlungsverkehr
```

Im Report werden die Ergebnisse zusätzlich **pro Tag** zusammengefasst. Teams nutzen Tags typischerweise für Testebene (`smoke`, `regression`), Fachbereich oder Ticketnummern.

Sollen alle Tests einer Datei dieselben Tags bekommen, geht das einmal zentral im Settings-Abschnitt mit `Test Tags`:

```robot
*** Settings ***
Test Tags    zahlungsverkehr
```

## Aufgabe

Gib dem Test eine `[Documentation]` (mindestens ein Satz) und die beiden Tags `smoke` und `beispiel`.

```robot start
*** Test Cases ***
Kontostand ist positiv
    Should Be True    150 > 0

```

```robot solution
*** Test Cases ***
Kontostand ist positiv
    [Documentation]    Prüft, dass der Beispiel-Kontostand größer als null ist.
    [Tags]    smoke    beispiel
    Should Be True    150 > 0
```

```checks
[
  {"type": "pass"},
  {"type": "documentation", "scope": "test"},
  {"type": "tag_used", "name": "smoke"},
  {"type": "tag_used", "name": "beispiel"}
]
```

```hints
Beide Einstellungen stehen eingerückt direkt unter dem Testnamen: `[Documentation]    Text` und `[Tags]    a    b`.
---
Tags werden wie Argumente durch mindestens zwei Leerzeichen getrennt.
```
