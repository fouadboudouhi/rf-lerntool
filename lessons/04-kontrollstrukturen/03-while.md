---
title: WHILE und Warten
---
`WHILE` wiederholt Schritte, **solange** eine Bedingung wahr ist. Typischer Einsatz: auf etwas warten, das asynchron passiert, etwa bis ein Auftrag den Status „verarbeitet“ hat.

```robot
*** Test Cases ***
Beispiel
    VAR    ${versuch}    ${0}
    WHILE    $versuch < 5
        VAR    ${versuch}    ${{ $versuch + 1 }}
        Log    Versuch ${versuch}
    END
```

## Endlosschleifen vermeiden

Eine WHILE-Schleife, deren Bedingung nie falsch wird, läuft ewig. Robot hat deshalb ein eingebautes **Limit** (Standard: 10 000 Iterationen), danach schlägt die Schleife fehl. Du kannst es explizit setzen, als Anzahl oder als Zeit:

```robot
WHILE    True    limit=10
WHILE    $status != "fertig"    limit=30 seconds
```

Ein sinnvolles Limit ist Pflicht, sobald die Bedingung von externen Systemen abhängt.

## Die Alternative: Wait Until Keyword Succeeds

Für „versuche es, bis es klappt“ gibt es ein eingebautes Keyword, das oft lesbarer ist als WHILE:

```robot
Wait Until Keyword Succeeds    30 seconds    2 seconds    Status sollte sein    fertig
```

Es ruft `Status sollte sein    fertig` alle 2 Sekunden auf, bis es besteht oder 30 Sekunden vergangen sind.

## Aufgabe

Das Keyword `Hole Status` simuliert ein System, das nach dem dritten Aufruf `fertig` liefert. Schreibe eine `WHILE`-Schleife, die `Hole Status` so lange aufruft, bis `${status}` gleich `fertig` ist. Setze ein `limit=10`, logge in jedem Durchlauf `Status: <status>` und prüfe nach der Schleife, dass `${versuche}` gleich `3` ist.

```robot start
*** Variables ***
${AUFRUFE}    ${0}

*** Test Cases ***
Auf Verarbeitung warten
    VAR    ${status}    offen
    # WHILE ... limit=10

    ${versuche}=    Set Variable    ${AUFRUFE}
    Log    Fertig nach ${versuche} Versuchen

*** Keywords ***
Hole Status
    VAR    ${AUFRUFE}    ${{ $AUFRUFE + 1 }}    scope=SUITE
    IF    $AUFRUFE >= 3
        RETURN    fertig
    END
    RETURN    offen

```

```robot solution
*** Variables ***
${AUFRUFE}    ${0}

*** Test Cases ***
Auf Verarbeitung warten
    VAR    ${status}    offen
    WHILE    $status != "fertig"    limit=10
        ${status}=    Hole Status
        Log    Status: ${status}
    END
    ${versuche}=    Set Variable    ${AUFRUFE}
    Log    Fertig nach ${versuche} Versuchen
    Should Be Equal As Integers    ${versuche}    3

*** Keywords ***
Hole Status
    VAR    ${AUFRUFE}    ${{ $AUFRUFE + 1 }}    scope=SUITE
    IF    $AUFRUFE >= 3
        RETURN    fertig
    END
    RETURN    offen
```

```checks
[
  {"type": "pass"},
  {"type": "control", "kind": "WHILE"},
  {"type": "source_regex", "pattern": "^\\s+WHILE\\s.*limit=", "label": "WHILE hat ein limit", "msg": "Gib der Schleife ein limit=10."},
  {"type": "message_contains", "text": "Status: offen"},
  {"type": "message_contains", "text": "Status: fertig"},
  {"type": "message_contains", "text": "Fertig nach 3 Versuchen"},
  {"type": "source_regex", "pattern": "Should Be Equal As (Integers|Numbers)\\s{2,}\\$\\{versuche\\}", "label": "Anzahl der Versuche wird geprüft", "msg": "Prüfe nach der Schleife, dass ${versuche} gleich 3 ist."}
]
```

```hints
`WHILE    $status != "fertig"    limit=10` – Text in der Bedingung in Anführungszeichen.
---
Im Schleifenkörper: `${status}=    Hole Status` und dann `Log    Status: ${status}`.
```
