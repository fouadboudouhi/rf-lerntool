---
title: Skalare Variablen
---
Variablen machen Tests lesbar und wartbar: Ein Wert steht an **einer** Stelle, und alle Schritte greifen darauf zu.

## Der Variables-Abschnitt

```robot
*** Variables ***
${BENUTZER}    max.mustermann
${TIMEOUT}     10
${URL}         https://beispiel.de/login
```

- Skalare Variablen schreibt man als `${NAME}`.
- Groß geschrieben sind per Konvention Variablen, die für die ganze Datei (oder global) gelten. Innerhalb eines Tests oder Keywords schreibt man sie klein: `${ergebnis}`.
- Robot ist bei Variablennamen nicht case-sensitiv und ignoriert Leerzeichen und Unterstriche: `${Benutzer}` und `${BENUTZER}` sind dieselbe Variable. Bleib trotzdem konsequent.

## Variablen verwenden

Überall dort, wo ein Argument steht, kann eine Variable stehen, auch **mitten im Text**:

```robot
*** Test Cases ***
Anmeldung
    Log    Melde ${BENUTZER} an unter ${URL}
    Should Be Equal    ${TIMEOUT}    10
```

Wenn eine Variable nicht existiert, schlägt der Schritt fehl: `Variable '${FOO}' not found.` Das ist eine der häufigsten Fehlermeldungen. Meist ist es ein Tippfehler.

## Zahlen

Werte aus dem Variables-Abschnitt sind **Text**. `${TIMEOUT}` ist also `"10"`, nicht `10`. Für echte Zahlen gibt es die Schreibweise `${10}` oder `${3.5}`: Alles, was in `${}` wie eine Zahl aussieht, wird zur Zahl.

```robot
*** Variables ***
${ANZAHL}    ${5}      # ganze Zahl 5, kein Text
```

## Aufgabe

Lege im Variables-Abschnitt die Variable `${PRODUKT}` mit dem Wert `Girokonto Plus` und `${PREIS}` mit dem Wert `4.90` an. Ergänze den Test so, dass er mit `Log` die Nachricht `Girokonto Plus kostet 4.90 Euro` ausgibt und mit `Should Be Equal As Numbers` prüft, dass `${PREIS}` gleich `4.9` ist.

```robot start
*** Variables ***
# Variablen hier anlegen

*** Test Cases ***
Produkt anzeigen
    Log    ... kostet ... Euro

```

```robot solution
*** Variables ***
${PRODUKT}    Girokonto Plus
${PREIS}      4.90

*** Test Cases ***
Produkt anzeigen
    Log    ${PRODUKT} kostet ${PREIS} Euro
    Should Be Equal As Numbers    ${PREIS}    4.9
```

```checks
[
  {"type": "pass"},
  {"type": "variable_defined", "name": "${PRODUKT}"},
  {"type": "variable_defined", "name": "${PREIS}"},
  {"type": "message_contains", "text": "Girokonto Plus kostet 4.90 Euro", "msg": "Die Log-Nachricht soll genau „Girokonto Plus kostet 4.90 Euro“ lauten – setze beide Variablen ein."},
  {"type": "keyword_used", "name": "Should Be Equal As Numbers"},
  {"type": "source_regex", "pattern": "Should Be Equal As Numbers\\s{2,}\\$\\{PREIS\\}", "label": "Der Vergleich benutzt ${PREIS}", "msg": "Übergib ${PREIS} als erstes Argument an Should Be Equal As Numbers."}
]
```

```hints
Im Variables-Abschnitt: `${PRODUKT}    Girokonto Plus` – Name und Wert durch mindestens zwei Leerzeichen getrennt.
---
Variablen dürfen mitten im Text stehen: `Log    ${PRODUKT} kostet ${PREIS} Euro`
```
