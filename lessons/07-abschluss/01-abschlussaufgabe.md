---
title: Abschlussaufgabe
---
Zeit, alles zusammenzubringen. Diese Aufgabe gibt weniger vor als die bisherigen. Wenn du hängst, hilft der Blick in die vorherigen Lektionen, die Hinweise oder die Musterlösung.

## Szenario

Ein kleines Buchungssystem: `&{KONTEN}` hält die Salden, `@{BUCHUNGEN}` eine Liste von Buchungen im Format `Konto:Betrag`. Negative Beträge sind Abbuchungen. Eine Buchung darf ein Konto **nicht ins Minus** bringen.

## Anforderungen

1. Ein Keyword `Buche` mit Argumenten `${konto}` und `${betrag}`:
   - Berechnet den neuen Saldo.
   - Schlägt mit `Fail    Konto ${konto} wäre im Minus` fehl, wenn der neue Saldo unter 0 läge.
   - Aktualisiert sonst `&{KONTEN}` mit `Set To Dictionary` (aus Collections) und loggt `Gebucht: <betrag> auf <konto>`.
2. Der Test `Alle Buchungen verarbeiten` läuft mit `FOR` über `@{BUCHUNGEN}`, zerlegt jede Buchung mit `Split String` (aus der Library **String**) am `:` und ruft `Buche` auf. Fehlgeschlagene Buchungen werden mit `TRY` / `EXCEPT` abgefangen und mit `Abgelehnt: <fehlermeldung>` geloggt.
3. Am Ende prüft der Test, dass `Giro` den Saldo `700` und `Depot` den Saldo `12000` hat.

Zur Kontrolle: Von den vier Buchungen wird genau eine abgelehnt.

```robot start
*** Settings ***
Library    Collections
Library    String

*** Variables ***
&{KONTEN}       Giro=1000    Depot=12000
@{BUCHUNGEN}    Giro:-500    Giro:200    Depot:-15000    Giro:0

*** Test Cases ***
Alle Buchungen verarbeiten
    # FOR über @{BUCHUNGEN}, Split String, TRY/EXCEPT um Buche

    Log    Giro: ${KONTEN}[Giro], Depot: ${KONTEN}[Depot]

*** Keywords ***
Buche
    [Arguments]    ${konto}    ${betrag}
    # neuen Saldo berechnen, prüfen, Set To Dictionary, loggen

```

```robot solution
*** Settings ***
Library    Collections
Library    String

*** Variables ***
&{KONTEN}       Giro=1000    Depot=12000
@{BUCHUNGEN}    Giro:-500    Giro:200    Depot:-15000    Giro:0

*** Test Cases ***
Alle Buchungen verarbeiten
    FOR    ${buchung}    IN    @{BUCHUNGEN}
        ${konto}    ${betrag}=    Split String    ${buchung}    :
        TRY
            Buche    ${konto}    ${betrag}
        EXCEPT    AS    ${fehler}
            Log    Abgelehnt: ${fehler}
        END
    END
    Log    Giro: ${KONTEN}[Giro], Depot: ${KONTEN}[Depot]
    Should Be Equal As Numbers    ${KONTEN}[Giro]    700
    Should Be Equal As Numbers    ${KONTEN}[Depot]    12000

*** Keywords ***
Buche
    [Arguments]    ${konto}    ${betrag}
    ${neu}=    Evaluate    int($KONTEN[$konto]) + int($betrag)
    IF    $neu < 0
        Fail    Konto ${konto} wäre im Minus
    END
    Set To Dictionary    ${KONTEN}    ${konto}=${neu}
    Log    Gebucht: ${betrag} auf ${konto}
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_defined", "name": "Buche"},
  {"type": "control", "kind": "FOR"},
  {"type": "control", "kind": "TRY"},
  {"type": "control", "kind": "IF"},
  {"type": "keyword_used", "name": "Split String"},
  {"type": "keyword_used", "name": "Set To Dictionary"},
  {"type": "message_contains", "text": "Gebucht: -500 auf Giro"},
  {"type": "message_contains", "text": "Abgelehnt: Konto Depot wäre im Minus"},
  {"type": "message_contains", "text": "Giro: 700, Depot: 12000"},
  {"type": "source_regex", "pattern": "Should Be Equal As (Numbers|Integers)\\s{2,}\\$\\{KONTEN\\}\\[Giro\\]\\s{2,}700", "label": "Giro-Saldo wird geprüft"},
  {"type": "source_regex", "pattern": "Should Be Equal As (Numbers|Integers)\\s{2,}\\$\\{KONTEN\\}\\[Depot\\]\\s{2,}12000", "label": "Depot-Saldo wird geprüft"}
]
```

```hints
`Split String` liefert eine Liste; mit `${konto}    ${betrag}=    Split String    ${buchung}    :` landen beide Teile direkt in Variablen.
---
Im Keyword: `${neu}=    Evaluate    int($KONTEN[$konto]) + int($betrag)` – die Werte sind Text, deshalb `int()`.
---
`Set To Dictionary    ${KONTEN}    ${konto}=${neu}` schreibt den neuen Saldo zurück. Da das Dictionary ein Objekt ist, sieht der Test die Änderung.
---
Um `Buche` herum im Test: `TRY` … `EXCEPT    AS    ${fehler}` … `END`, alles innerhalb der FOR-Schleife.
```
