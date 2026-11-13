---
title: Rückgabewerte zuweisen
---
Viele Keywords **geben etwas zurück**: einen berechneten Wert, den Inhalt einer Datei, die Antwort eines Servers. Diesen Rückgabewert fängst du mit einer Variablen auf. Die Variable steht **vor** dem Keyword, gefolgt von `=`:

```robot
*** Test Cases ***
Beispiel
    ${laenge}=    Get Length    Robot Framework
    Log    Der Text hat ${laenge} Zeichen
```

Das `=` ist optional, aber Konvention, weil man die Zuweisung so sofort erkennt. Die Variable gilt ab hier im aktuellen Test (bzw. Keyword) – das nennt man den **lokalen Scope**.

## Nützliche Keywords mit Rückgabewert

| Keyword | Gibt zurück |
|---|---|
| `Set Variable    wert` | den Wert selbst (zum Anlegen lokaler Variablen) |
| `Get Length    ${x}` | Länge von Text oder Liste |
| `Get Time` | aktuelle Zeit als Text |
| `Convert To Integer    42` | Zahl statt Text |
| `Create List    a    b    c` | eine neue Liste |
| `Create Dictionary    k=v` | ein neues Dictionary |
| `Evaluate    2 ** 10` | Ergebnis eines Python-Ausdrucks |

Wenn ein Keyword eine Liste zurückgibt, kannst du sie auch direkt in einzelne Variablen zerlegen:

```robot
${vorname}    ${nachname}=    Create List    Erika    Muster
```

## Aufgabe

Vervollständige den Test:

1. Weise `${text}` mit `Set Variable` den Wert `Robot Framework` zu.
2. Ermittle die Länge von `${text}` mit `Get Length` und speichere sie in `${laenge}`.
3. Prüfe mit `Should Be Equal As Integers`, dass die Länge `15` ist.
4. Erzeuge mit `Create List` eine Liste `${sprachen}` aus `Robot` und `Python` und logge ihr zweites Element.

```robot start
*** Test Cases ***
Werte auffangen
    # 1. ${text} zuweisen
    # 2. Länge ermitteln
    # 3. Länge prüfen
    # 4. Liste erzeugen und zweites Element loggen

```

```robot solution
*** Test Cases ***
Werte auffangen
    ${text}=    Set Variable    Robot Framework
    ${laenge}=    Get Length    ${text}
    Should Be Equal As Integers    ${laenge}    15
    ${sprachen}=    Create List    Robot    Python
    Log    ${sprachen}[1]
```

```checks
[
  {"type": "pass"},
  {"type": "variable_assigned", "name": "${text}"},
  {"type": "variable_assigned", "name": "${laenge}"},
  {"type": "variable_assigned", "name": "${sprachen}"},
  {"type": "keyword_used", "name": "Get Length"},
  {"type": "keyword_used", "name": "Should Be Equal As Integers"},
  {"type": "keyword_used", "name": "Create List"},
  {"type": "message_regex", "pattern": "^Python$", "msg": "Logge das zweite Element der Liste – die Nachricht muss genau „Python“ sein."}
]
```

```hints
Zuweisung: `${text}=    Set Variable    Robot Framework` – nach dem `=` folgen wieder mindestens zwei Leerzeichen.
---
`${laenge}=    Get Length    ${text}`
---
Das zweite Element: `Log    ${sprachen}[1]`
```
