---
title: Spielwiese
---
Keine Aufgabe, keine Prüfung. Hier kannst du ausprobieren, was dir gerade einfällt — Schreibweisen vergessen? Der Spickzettel oben rechts hilft, oder die Taste `?`.

Was hier funktioniert: alles aus BuiltIn, dazu `Collections`, `String`, `DateTime` und eigene Python-Keywords. Nicht verfügbar sind Libraries, die einen Browser oder ein echtes System brauchen — die laufen später in eurem Repo.

Der Code bleibt gespeichert, auch wenn du zwischendurch eine Lektion machst. Über „Zurücksetzen" bekommst du das Startbeispiel zurück.

> Ideen zum Ausprobieren: Was passiert bei `Should Be Equal    1    1.0`? Was macht `Log Many` mit einer Liste? Wie sieht das Log aus, wenn ein Keyword ein anderes aufruft, das ein drittes aufruft? Und was sagt Robot, wenn du absichtlich Unsinn hinschreibst?

```robot start
*** Settings ***
Library    Collections
Library    String
Library    DateTime

*** Variables ***
@{KONTEN}    Giro    Tagesgeld    Depot

*** Test Cases ***
Probierstube
    Log    Hallo Spielwiese
    ${jetzt}=    Get Current Date    result_format=%d.%m.%Y %H:%M
    Log    Es ist ${jetzt}

    FOR    ${konto}    IN    @{KONTEN}
        Log    Konto: ${konto}
    END

    ${gross}=    Convert To Upper Case    probier mich aus
    Log    ${gross}
```
