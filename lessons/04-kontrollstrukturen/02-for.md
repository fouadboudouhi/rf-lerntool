---
title: Schleifen mit FOR
---
Mit `FOR` wiederholst du Schritte für jedes Element einer Liste, einen Zahlenbereich oder mehrere Listen parallel. Auch hier schließt `END` den Block.

## Über eine Liste

```robot
*** Variables ***
@{KONTEN}    Giro    Tagesgeld    Depot

*** Test Cases ***
Alle Konten
    FOR    ${konto}    IN    @{KONTEN}
        Log    Prüfe ${konto}
    END
```

Beachte `@{KONTEN}`: Die Liste wird entpackt, damit die Schleife die einzelnen Elemente sieht. Man kann die Werte auch direkt hinschreiben: `FOR    ${konto}    IN    Giro    Depot`.

## Über einen Zahlenbereich

```robot
FOR    ${i}    IN RANGE    3          # 0, 1, 2
FOR    ${i}    IN RANGE    1    4     # 1, 2, 3
FOR    ${i}    IN RANGE    0    10    2   # 0, 2, 4, 6, 8
```

## Mit Index

```robot
FOR    ${index}    ${konto}    IN ENUMERATE    @{KONTEN}
    Log    ${index}: ${konto}
END
```

## Abbrechen und überspringen

`BREAK` beendet die Schleife, `CONTINUE` springt zum nächsten Durchlauf. Beides meist innerhalb eines `IF`.

## Aufgabe

Die Liste `@{BETRAEGE}` enthält Buchungen. Schreibe einen Test, der

1. mit einer `FOR`-Schleife über alle Beträge läuft,
2. jeden Betrag mit `Log    Buchung: <betrag>` loggt und
3. die Summe in `${summe}` aufaddiert (Tipp: `VAR    ${summe}    ${{ $summe + $betrag }}` oder `Evaluate`).

Prüfe am Ende mit `Should Be Equal As Numbers`, dass die Summe `600` ist.

```robot start
*** Variables ***
@{BETRAEGE}    ${100}    ${250}    ${50}    ${200}

*** Test Cases ***
Summe der Buchungen
    VAR    ${summe}    ${0}
    # FOR-Schleife

    Log    Summe: ${summe}

```

```robot solution
*** Variables ***
@{BETRAEGE}    ${100}    ${250}    ${50}    ${200}

*** Test Cases ***
Summe der Buchungen
    VAR    ${summe}    ${0}
    FOR    ${betrag}    IN    @{BETRAEGE}
        Log    Buchung: ${betrag}
        VAR    ${summe}    ${{ $summe + $betrag }}
    END
    Log    Summe: ${summe}
    Should Be Equal As Numbers    ${summe}    600
```

```checks
[
  {"type": "pass"},
  {"type": "control", "kind": "FOR"},
  {"type": "message_contains", "text": "Buchung: 100"},
  {"type": "message_contains", "text": "Buchung: 200"},
  {"type": "message_contains", "text": "Summe: 600"},
  {"type": "keyword_used", "name": "Should Be Equal As Numbers"}
]
```

```hints
`FOR    ${betrag}    IN    @{BETRAEGE}` … `END`
---
Innerhalb der Schleife die Summe erhöhen: `VAR    ${summe}    ${{ $summe + $betrag }}`
---
Nach dem `END`: `Should Be Equal As Numbers    ${summe}    600`
```
