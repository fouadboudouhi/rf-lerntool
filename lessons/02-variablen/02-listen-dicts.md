---
title: Listen und Dictionaries
---
Neben skalaren Werten kennt Robot **Listen** (`@{}`) und **Dictionaries** (`&{}`).

## Listen

```robot
*** Variables ***
@{FARBEN}    rot    grün    blau
```

Zugriff auf einzelne Elemente mit eckigen Klammern, wie in Python (Zählung ab 0, negative Indizes vom Ende):

```robot
Log    ${FARBEN}[0]      # rot
Log    ${FARBEN}[-1]     # blau
```

Wichtig ist der Unterschied zwischen `${FARBEN}` und `@{FARBEN}` bei der **Verwendung**:

- `${FARBEN}` übergibt die Liste als **ein** Argument (ein Objekt).
- `@{FARBEN}` **entpackt** die Liste in einzelne Argumente: `Log Many    @{FARBEN}` ist dasselbe wie `Log Many    rot    grün    blau`.

## Dictionaries

```robot
*** Variables ***
&{KUNDE}    name=Erika Muster    kundennummer=4711
```

Zugriff per Schlüssel:

```robot
Log    ${KUNDE}[name]            # Erika Muster
Log    ${KUNDE.kundennummer}     # geht auch, wenn der Schlüssel ein gültiger Bezeichner ist
```

## Die Collections-Library

Für Listen und Dictionaries gibt es die Standard-Library **Collections**. Sie muss importiert werden:

```robot
*** Settings ***
Library    Collections
```

Nützliche Keywords: `Append To List`, `Get Length` (BuiltIn), `List Should Contain Value`, `Dictionary Should Contain Key`, `Get From Dictionary`, `Sort List`.

## Aufgabe

1. Importiere die Library `Collections`.
2. Lege die Liste `@{KONTEN}` mit den Werten `Giro`, `Tagesgeld` und `Depot` an.
3. Lege das Dictionary `&{INHABER}` mit `name=Erika Muster` und `alter=42` an.
4. Prüfe im Test mit `List Should Contain Value`, dass `Depot` in den Konten ist, und logge den Namen des Inhabers über den Dictionary-Zugriff.

```robot start
*** Settings ***

*** Variables ***

*** Test Cases ***
Konten und Inhaber
    Log    Erstes Konto: ${KONTEN}[0]

```

```robot solution
*** Settings ***
Library    Collections

*** Variables ***
@{KONTEN}     Giro    Tagesgeld    Depot
&{INHABER}    name=Erika Muster    alter=42

*** Test Cases ***
Konten und Inhaber
    Log    Erstes Konto: ${KONTEN}[0]
    List Should Contain Value    ${KONTEN}    Depot
    Log    Inhaber: ${INHABER}[name]
```

```checks
[
  {"type": "pass"},
  {"type": "library_imported", "name": "Collections"},
  {"type": "variable_defined", "name": "@{KONTEN}"},
  {"type": "variable_defined", "name": "&{INHABER}"},
  {"type": "message_contains", "text": "Erstes Konto: Giro"},
  {"type": "keyword_used", "name": "List Should Contain Value"},
  {"type": "message_contains", "text": "Erika Muster", "msg": "Logge den Namen des Inhabers, z. B. mit ${INHABER}[name]."}
]
```

```hints
Listen im Variables-Abschnitt: `@{KONTEN}    Giro    Tagesgeld    Depot`
---
Dictionaries: `&{INHABER}    name=Erika Muster    alter=42`
---
`List Should Contain Value    ${KONTEN}    Depot` – beachte das `$`, die Liste wird als ein Objekt übergeben.
```
