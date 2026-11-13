---
title: Dein erstes eigenes Keyword
---
Bisher hast du eingebaute Keywords aufgerufen. Die eigentliche Stärke von Robot Framework ist, dass du **eigene Keywords** aus vorhandenen zusammensetzt. So entsteht eine Sprache, die die Fachlichkeit beschreibt:

```robot
*** Test Cases ***
Überweisung
    Melde Benutzer an
    Öffne Konto    Giro
    Überweise    100    an    DE12 3456 ...
    Kontostand sollte sein    900
```

Jedes dieser Keywords ist irgendwo definiert und kapselt die technischen Details. Der Test liest sich wie eine Fachbeschreibung.

## Der Keywords-Abschnitt

Eigene Keywords definierst du unter `*** Keywords ***`, genau wie Testfälle: Name ganz links, Schritte eingerückt.

```robot
*** Keywords ***
Melde Benutzer an
    Log    Öffne Login-Seite
    Log    Gebe Zugangsdaten ein
    Log    Klicke auf Anmelden
```

Ein eigenes Keyword darf natürlich andere eigene Keywords aufrufen. So bauen sich Ebenen auf: technische Keywords unten, fachliche oben.

## Namensregeln

- Keywords werden wie Sätze geschrieben: `Öffne Konto`, `Kontostand sollte sein`.
- Groß-/Kleinschreibung, Leerzeichen und Unterstriche werden beim Aufruf ignoriert: `öffne konto` findet `Öffne Konto`. Trotzdem: einheitlich schreiben.
- Ein Keyword sollte **eine** Sache tun. Wenn der Name ein „und“ enthält, sind es meist zwei.

## Aufgabe

Erstelle ein Keyword `Begrüße Team`, das drei Log-Nachrichten schreibt: `Guten Morgen`, `Willkommen im Team` und `Los geht's`. Rufe es im Test auf.

```robot start
*** Test Cases ***
Begrüßung
    # Keyword hier aufrufen

*** Keywords ***
# Keyword hier definieren

```

```robot solution
*** Test Cases ***
Begrüßung
    Begrüße Team

*** Keywords ***
Begrüße Team
    Log    Guten Morgen
    Log    Willkommen im Team
    Log    Los geht's
```

```checks
[
  {"type": "pass"},
  {"type": "keyword_defined", "name": "Begrüße Team"},
  {"type": "keyword_used_in", "name": "Begrüße Team", "test": "Begrüßung"},
  {"type": "message_contains", "text": "Guten Morgen"},
  {"type": "message_contains", "text": "Willkommen im Team"},
  {"type": "message_contains", "text": "Los geht's"}
]
```

```hints
Unter `*** Keywords ***`: Name ganz links, darunter die drei `Log`-Schritte eingerückt.
---
Im Test steht dann nur noch der Aufruf: `    Begrüße Team`
```
