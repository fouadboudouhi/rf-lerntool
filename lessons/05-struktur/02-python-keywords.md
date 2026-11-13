---
title: Eigene Keywords in Python
---
Wenn ein Keyword echte Logik braucht (Berechnungen, Datenformate, Zugriff auf Systeme), schreibst du es in **Python**. Jede Python-Funktion in einer importierten Datei wird automatisch zu einem Keyword.

```python
# rechner.py
def addiere(a, b):
    return int(a) + int(b)
```

```robot
*** Settings ***
Library    rechner.py

*** Test Cases ***
Beispiel
    ${summe}=    Addiere    2    3
    Should Be Equal As Integers    ${summe}    5
```

- Der Funktionsname `addiere` wird zum Keyword `Addiere`; Unterstriche werden zu Leerzeichen: `pruefe_iban` → `Pruefe IBAN`.
- Argumente kommen als **Text** an, wenn sie im Robot-Code als Text stehen. Deshalb `int(a)`. Alternativ deklarierst du Typen, dann konvertiert Robot automatisch: `def addiere(a: int, b: int)`.
- Der Rückgabewert der Funktion ist der Rückgabewert des Keywords.
- Eine Exception lässt das Keyword fehlschlagen; die Meldung wird zur Fehlermeldung.

## Logging aus Python

```python
from robot.api import logger

def pruefe_iban(iban: str):
    logger.info(f"Prüfe {iban}")
    if len(iban.replace(" ", "")) != 22:
        raise AssertionError(f"IBAN {iban} hat nicht 22 Stellen")
```

## Klassen als Library

Für Libraries mit Zustand (etwa eine Verbindung) nutzt man eine Klasse, deren Methoden zu Keywords werden. Mit dem Dekorator `@keyword` aus `robot.api.deco` lässt sich der Keyword-Name frei wählen. Für den Einstieg reichen Funktionen.

## Aufgabe

Im Reiter `bank.py` ist die Funktion `berechne_zinsen` unfertig. Implementiere sie: Sie bekommt `kapital`, `zinssatz` (in Prozent) und `jahre` und gibt die Zinsen `kapital * zinssatz / 100 * jahre` als Zahl zurück. Nutze Typ-Annotationen (`float`, `int`), damit Robot die Argumente konvertiert. Der Test in `test.robot` ist fertig und ruft das Keyword auf.

```robot start
*** Settings ***
Library    bank.py

*** Test Cases ***
Zinsen berechnen
    ${zinsen}=    Berechne Zinsen    1000    2.5    3
    Log    Zinsen: ${zinsen}
    Should Be Equal As Numbers    ${zinsen}    75
```

```python file:bank.py
from robot.api import logger


def berechne_zinsen(kapital, zinssatz, jahre):
    """Gibt die einfachen Zinsen zurück: kapital * zinssatz / 100 * jahre."""
    logger.info(f"Berechne Zinsen für {kapital} zu {zinssatz} % über {jahre} Jahre")
    # TODO: implementieren
    return 0
```

```python solution:bank.py
from robot.api import logger


def berechne_zinsen(kapital: float, zinssatz: float, jahre: int) -> float:
    """Gibt die einfachen Zinsen zurück: kapital * zinssatz / 100 * jahre."""
    logger.info(f"Berechne Zinsen für {kapital} zu {zinssatz} % über {jahre} Jahre")
    return kapital * zinssatz / 100 * jahre
```

```checks
[
  {"type": "pass", "msg": "Die Funktion liefert noch nicht 75 für 1000, 2.5 und 3."},
  {"type": "keyword_used", "name": "Berechne Zinsen"},
  {"type": "message_contains", "text": "Zinsen: 75"},
  {"type": "source_regex", "pattern": "def berechne_zinsen\\([^)]*:\\s*(float|int)", "label": "Typ-Annotationen verwendet", "msg": "Annotiere die Parameter, z. B. kapital: float."},
  {"type": "source_not_regex", "pattern": "TODO", "label": "TODO entfernt"}
]
```

```hints
Wechsle oben auf den Reiter `bank.py`.
---
`def berechne_zinsen(kapital: float, zinssatz: float, jahre: int) -> float:`
---
`return kapital * zinssatz / 100 * jahre` – und den TODO-Kommentar löschen.
```
