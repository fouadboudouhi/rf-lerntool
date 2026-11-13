---
title: Mit Tags steuern, was läuft
run_options: include=smoke
---
Tags kennst du schon als Etiketten. Ihr eigentlicher Zweck kommt jetzt: **auswählen, was überhaupt läuft.**

Eine gewachsene Testsuite hat schnell vierhundert Testfälle und braucht eine Stunde. Vor jedem Commit will das niemand abwarten. Also markiert man die wichtigsten und startet nur die:

```text
robot --include smoke tests/           # nur Tests mit dem Tag smoke
robot --exclude langsam tests/         # alles außer langsam
robot --include smoke --exclude wip tests/
```

Es geht auch mit Logik:

```text
robot --include smokeANDzahlungen tests/    # beide Tags
robot --include smokeORkritisch tests/      # mindestens einer
robot --include smokeNOTwip tests/          # smoke, aber nicht wip
robot --include ticket-* tests/             # Muster mit Platzhalter
```

> **Diese Lektion läuft anders als die bisherigen.** Sie wird mit `--include smoke` ausgeführt. Unter dem Ergebnis steht ab jetzt immer, welcher Befehl gerade nachgestellt wurde — schau da nach dem ersten Lauf mal hin.

## Aufgabe

Unten stehen vier Testfälle für den Depot-Service. Vertagge sie so, dass bei `--include smoke` **genau zwei** laufen: `Depot anlegen` und `Kontostand abfragen`. Die anderen beiden sollen andere Tags bekommen — `langsam` und `wip` bieten sich an.

**Erst raten, dann ausführen:** Was passiert wohl mit einem Testfall, der gar keinen Tag hat?

```robot start
*** Test Cases ***
Depot anlegen
    Log    Depot wird angelegt

Kontostand abfragen
    Log    Kontostand wird gelesen

Jahresabrechnung erzeugen
    Log    Das dauert eine Weile
    Log    Wirklich lange

Neue Order-Maske
    Log    Noch in Arbeit
```

```robot solution
*** Test Cases ***
Depot anlegen
    [Tags]    smoke
    Log    Depot wird angelegt

Kontostand abfragen
    [Tags]    smoke
    Log    Kontostand wird gelesen

Jahresabrechnung erzeugen
    [Tags]    langsam
    Log    Das dauert eine Weile
    Log    Wirklich lange

Neue Order-Maske
    [Tags]    wip
    Log    Noch in Arbeit
```

```checks
[
  {"type": "pass"},
  {"type": "tests_executed", "names": ["Depot anlegen", "Kontostand abfragen"], "label": "Genau die beiden Smoke-Tests laufen"},
  {"type": "tag_used", "name": "smoke"},
  {"type": "source_regex", "pattern": "\\[Tags\\][\\s\\S]*\\[Tags\\][\\s\\S]*\\[Tags\\][\\s\\S]*\\[Tags\\]", "label": "Alle vier Testfälle sind vertaggt", "msg": "Gib jedem der vier Testfälle ein [Tags]. Ein Test ohne Tag ist später nicht auffindbar."}
]
```

```hints
`[Tags]    smoke` steht eingerückt direkt unter dem Testnamen, wie `[Documentation]`.
---
Ein Testfall ohne passenden Tag wird bei `--include smoke` gar nicht erst gestartet — er taucht im Report als „nicht ausgeführt“ auf, nicht als bestanden.
---
Die beiden übrigen Tests brauchen trotzdem Tags, sonst findet sie später niemand gezielt wieder.
```
