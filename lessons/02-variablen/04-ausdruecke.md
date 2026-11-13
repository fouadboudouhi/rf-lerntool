---
title: Ausdrücke, VAR und Scopes
---
## Python-Ausdrücke inline

Robot Framework kann an fast jeder Stelle **Python auswerten**. Die Schreibweise mit doppelten geschweiften Klammern `${{ ... }}` wertet den Ausdruck aus und setzt das Ergebnis ein:

```robot
Log    ${{ 2 + 3 }}                    # 5
Log    ${{ "Robot".upper() }}          # ROBOT
Log    ${{ len($FARBEN) }}             # Länge einer Liste
```

Innerhalb des Ausdrucks greifst du auf Robot-Variablen mit `$NAME` (ohne Klammern) zu. Das `Evaluate`-Keyword macht dasselbe als Keyword-Aufruf:

```robot
${summe}=    Evaluate    10 * 1.19
```

Ausdrücke sind praktisch, aber ein Test voller Python ist schwer lesbar. Faustregel: Für einen kleinen Ausdruck ok, für Logik lieber ein eigenes Keyword oder eine Python-Library (Kapitel 5).

## VAR: Variablen im Test anlegen

Seit Robot Framework 7 gibt es die `VAR`-Syntax, um Variablen direkt im Test oder Keyword zu erzeugen. Sie ersetzt `Set Variable` und die älteren `Set Test Variable` / `Set Suite Variable`:

```robot
VAR    ${name}      Erika                   # lokal
VAR    @{liste}     a    b    c             # Liste
VAR    ${status}    OK    scope=SUITE       # für die ganze Suite sichtbar
```

## Scopes

Wo eine Variable sichtbar ist, hängt davon ab, wo sie angelegt wurde:

| Scope | Sichtbar in | Angelegt durch |
|---|---|---|
| Lokal | nur im aktuellen Test / Keyword | Zuweisung `${x}=`, `VAR` |
| Test | im aktuellen Test inkl. aufgerufener Keywords | `VAR ... scope=TEST` |
| Suite | in allen Tests der Datei | Variables-Abschnitt, `VAR ... scope=SUITE` |
| Global | überall | Kommandozeile `--variable`, `VAR ... scope=GLOBAL` |

Die Variable aus einem Test ist im **nächsten Test nicht mehr da**. Tests sollen unabhängig voneinander sein, deshalb ist das Absicht.

## Aufgabe

1. Lege mit `VAR` die Variable `${netto}` mit dem Wert `${100}` an.
2. Berechne `${brutto}` als `netto * 1.19` mit einem Inline-Ausdruck oder `Evaluate`.
3. Prüfe mit `Should Be Equal As Numbers`, dass `${brutto}` gleich `119` ist.
4. Logge die Nachricht `Brutto: 119.0`.

```robot start
*** Test Cases ***
Mehrwertsteuer
    # Hier geht es los

```

```robot solution
*** Test Cases ***
Mehrwertsteuer
    VAR    ${netto}    ${100}
    ${brutto}=    Evaluate    $netto * 1.19
    Should Be Equal As Numbers    ${brutto}    119
    Log    Brutto: ${brutto}
```

```checks
[
  {"type": "pass"},
  {"type": "control", "kind": "VAR", "msg": "Lege ${netto} mit der VAR-Syntax an."},
  {"type": "variable_assigned", "name": "${netto}"},
  {"type": "source_regex", "pattern": "Evaluate|\\$\\{\\{", "label": "Inline-Ausdruck oder Evaluate verwendet"},
  {"type": "keyword_used", "name": "Should Be Equal As Numbers"},
  {"type": "message_contains", "text": "Brutto: 119.0"}
]
```

```hints
`VAR    ${netto}    ${100}` – das `${100}` macht aus dem Text eine Zahl.
---
Entweder `${brutto}=    Evaluate    $netto * 1.19` oder `VAR    ${brutto}    ${{ $netto * 1.19 }}`.
---
Für die Log-Nachricht: `Log    Brutto: ${brutto}`
```
