"""
Robot Framework Runner + Prüflogik.

Läuft innerhalb von Pyodide im Web Worker. Bekommt die Dateien einer Lektion,
führt `robot` aus und wertet die deklarativen Checks der Lektion aus.

Checks (JSON-Liste in der Lektion), jeweils mit optionalem "msg" (Fehlermeldung):

  {"type": "pass"}                                 alle Tests bestanden
  {"type": "tests_min", "count": 2}                mindestens N Testfälle
  {"type": "test_named", "name": "Mein Test"}      Testfall mit diesem Namen existiert
  {"type": "test_status", "name": "X", "status": "FAIL"}
  {"type": "keyword_used", "name": "Log"}          Keyword wurde (irgendwo) aufgerufen
  {"type": "keyword_used_in", "name": "Log", "test": "Mein Test"}
  {"type": "keyword_defined", "name": "Begrüße"}   eigenes Keyword im Keywords-Abschnitt
  {"type": "keyword_args_min", "name": "Begrüße", "count": 1}   eigenes Keyword hat >= N Argumente
  {"type": "keyword_returns", "name": "Addiere"}   eigenes Keyword hat RETURN
  {"type": "message_contains", "text": "Hallo"}    Log-Nachricht enthält Text
  {"type": "message_regex", "pattern": "^Hallo"}   Log-Nachricht passt auf Regex
  {"type": "control", "kind": "FOR"}               FOR/IF/WHILE/TRY wurde ausgeführt
  {"type": "variable_defined", "name": "${NAME}"}  Variable im Variables-Abschnitt
  {"type": "variable_assigned", "name": "${x}"}    Variable per Zuweisung (${x}=) gesetzt
  {"type": "library_imported", "name": "Collections"}
  {"type": "resource_imported"}
  {"type": "tag_used", "name": "smoke"}
  {"type": "setup_used"} / {"type": "teardown_used"}   Test- oder Suite-Setup/-Teardown vorhanden
  {"type": "template_used"}
  {"type": "documentation", "scope": "test"|"keyword"|"suite"}
  {"type": "source_regex", "pattern": "..."}       Fallback auf den Quelltext
  {"type": "source_not_regex", "pattern": "..."}
  {"type": "tests_executed", "names": ["A", "B"]}  GENAU diese Testfälle wurden ausgeführt
  {"type": "tests_count", "count": 2}              genau N Testfälle ausgeführt
  {"type": "robocop_max", "count": 0}              höchstens N Robocop-Meldungen (braucht Robocop)
  {"type": "robocop_no_rule", "rule": "LEN08"}     diese Regel wird nicht mehr gemeldet

Ausführungsoptionen: Eine Lektion kann im Frontmatter `run_options` setzen, z. B.

    run_options: include=smoke

Erlaubt sind include, exclude, loglevel und variable (mehrere durch ; getrennt,
variable mehrfach möglich). Sie werden an robot.run() durchgereicht — damit lässt
sich die Wirkung von --include & Co. im Tool erleben statt nur beschreiben.
"""

import contextlib
import io
import json
import os
import re
import shutil
import traceback

WORK = "/work"
OUT = "/work/out"


# --------------------------------------------------------------------------
# Ausführung
# --------------------------------------------------------------------------

def _reset_work():
    os.chdir("/")
    if os.path.isdir(WORK):
        shutil.rmtree(WORK)
    os.makedirs(OUT, exist_ok=True)


def _write_files(files):
    for name, content in files.items():
        path = os.path.join(WORK, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            # Abschließender Zeilenumbruch: sonst meldet jeder Linter zu Recht
            # "missing trailing blank line" – ein Artefakt des Editors, kein Fehler
            # der Lernenden.
            f.write(content if content.endswith("\n") else content + "\n")


def _forget_user_modules():
    """Python-Libraries aus /work bei jedem Lauf frisch importieren."""
    import importlib
    import sys
    for name, mod in list(sys.modules.items()):
        f = getattr(mod, "__file__", None) or ""
        if f.startswith(WORK):
            del sys.modules[name]
    importlib.invalidate_caches()


def _read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def parse_run_options(spec):
    """"include=smoke; variable=X:1" -> {"include": "smoke", "variable": ["X:1"]}"""
    allowed = {"include", "exclude", "loglevel", "variable", "test", "suite", "dryrun"}
    opts = {}
    for part in (spec or "").split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        key, value = part.split("=", 1)
        key, value = key.strip().lower(), value.strip()
        if key not in allowed:
            continue
        if key == "dryrun":
            opts["dryrun"] = value.lower() in ("1", "true", "ja", "yes")
        elif key in ("variable", "test", "suite", "include", "exclude"):
            opts.setdefault(key, []).append(value)
        else:
            opts[key] = value
    # robot.run nimmt Listen für mehrfach verwendbare Optionen, Einzelwerte sonst
    for key in ("include", "exclude"):
        if key in opts and len(opts[key]) == 1:
            opts[key] = opts[key][0]
    return opts


def run_lesson(files_json, checks_json, main_file="test.robot", options_spec=""):
    """Einstiegspunkt aus JavaScript. Gibt JSON-String zurück."""
    files = json.loads(files_json)
    checks = json.loads(checks_json) if checks_json else []
    run_options = parse_run_options(options_spec)
    _reset_work()
    _write_files(files)
    _forget_user_modules()

    console = io.StringIO()
    rc = -1
    error = None
    try:
        from robot import run
        os.chdir(WORK)
        kwargs = dict(
            outputdir=OUT,
            loglevel="INFO",
            consolecolors="off",
            consolewidth=78,
            stdout=console,
            stderr=console,
        )
        kwargs.update(run_options)
        rc = run(os.path.join(WORK, main_file), **kwargs)
    except SystemExit as e:  # robot.run wirft SystemExit bei Parse-Fehlern
        rc = e.code if isinstance(e.code, int) else 252
    except Exception:
        error = traceback.format_exc()

    output_xml = os.path.join(OUT, "output.xml")
    result = {
        "rc": rc,
        "options": run_options,
        "console": console.getvalue(),
        "error": error,
        "log": _read(os.path.join(OUT, "log.html")),
        "hasOutput": os.path.exists(output_xml),
        "checks": [],
    }
    if checks:
        result["checks"] = evaluate_checks(checks, files, main_file, output_xml if result["hasOutput"] else None)
    return json.dumps(result)


# --------------------------------------------------------------------------
# Robocop (wird erst geladen, wenn eine Lektion es braucht)
# --------------------------------------------------------------------------

def run_robocop(files_json, main_file="test.robot"):
    """Führt `robocop check` über die Dateien der Lektion aus. Gibt JSON zurück."""
    files = json.loads(files_json)
    _reset_work()
    _write_files(files)
    return json.dumps(_robocop(list(files)))


def _robocop(names):
    """Ruft die echte Robocop-Kommandozeile auf und fängt ihre Ausgabe ab."""
    import contextlib
    import io
    import sys

    robot_files = [n for n in names if n.endswith((".robot", ".resource"))]
    if not robot_files:
        return {"output": "Keine Robot-Dateien zum Prüfen.", "issues": 0, "rules": [], "rc": 0}

    from robocop.run import app

    buf = io.StringIO()
    rc = 0
    argv = sys.argv
    cwd = os.getcwd()
    try:
        os.chdir(WORK)
        sys.argv = ["robocop", "check", *robot_files]
        with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
            app()
    except SystemExit as e:
        rc = e.code if isinstance(e.code, int) else 1
    except BaseException as e:  # noqa: BLE001 - Ausgabe soll den Lernenden erreichen
        buf.write(f"\nRobocop-Fehler: {e!r}")
        rc = -1
    finally:
        sys.argv = argv
        os.chdir(cwd)

    text = buf.getvalue()
    # Regel-IDs aus Zeilen wie "test.robot:2:1 NAME07 Test case ..." ziehen
    rules = re.findall(r"^\S+:\d+:\d+\s+([A-Z]{2,}\d{2,})\b", text, re.M)
    m = re.search(r"Found (\d+) issue", text)
    issues = int(m.group(1)) if m else len(rules)
    return {"output": text.strip() or "Robocop hat nichts zu beanstanden.", "issues": issues,
            "rules": sorted(set(rules)), "rc": rc}


# --------------------------------------------------------------------------
# Analyse
# --------------------------------------------------------------------------

def _norm(name):
    return re.sub(r"[\s_]", "", (name or "")).lower()


def _kw_matches(actual, wanted):
    """Vergleicht Keyword-Namen, ignoriert Library-Präfix, Whitespace, Groß/Klein."""
    a = _norm(actual)
    w = _norm(wanted)
    if "." in w:
        return a == w
    return a == w or a.endswith("." + w)


class Analysis:
    """Sammelt alles Interessante aus dem Result-Modell und dem Running-Modell."""

    def __init__(self, files, main_file, output_xml, robocop=None):
        self.files = files
        self.robocop = robocop
        self.source = files.get(main_file, "")
        self.all_sources = "\n".join(files.values())
        self.tests = {}            # name -> status
        self.executed = []         # Namen der tatsächlich ausgeführten Testfälle
        self.keywords_called = []  # (kwname, testname)
        self.messages = []         # (text, level)
        self.controls = set()      # FOR, IF, WHILE, TRY, RETURN, ...
        self.assigned = set()      # ${x} zugewiesen
        self.user_keywords = {}    # name -> running.UserKeyword
        self.variables = set()
        self.libraries = []
        self.resources = []
        self.tags = set()
        self.has_setup = False
        self.has_teardown = False
        self.has_template = False
        self.docs = {"suite": False, "test": False, "keyword": False}
        self.parse_error = None

        if output_xml:
            try:
                self._analyze_result(output_xml)
            except Exception as e:  # pragma: no cover
                self.parse_error = f"Result: {e}"
        try:
            self._analyze_running(os.path.join(WORK, main_file))
        except Exception as e:
            self.parse_error = (self.parse_error or "") + f" Running: {e}"

    # -- Result-Modell (was wirklich ausgeführt wurde) --
    def _analyze_result(self, output_xml):
        from robot.api import ExecutionResult, SuiteVisitor

        analysis = self

        class V(SuiteVisitor):
            def __init__(self):
                self.current_test = None

            def visit_test(self, test):
                analysis.tests[test.name] = test.status
                analysis.executed.append(test.name)
                analysis.tags.update(str(t) for t in test.tags)
                self.current_test = test.name
                if test.has_setup:
                    analysis.has_setup = True
                if test.has_teardown:
                    analysis.has_teardown = True
                test.body.visit(self)
                if test.has_setup:
                    test.setup.visit(self)
                if test.has_teardown:
                    test.teardown.visit(self)
                self.current_test = None

            def visit_suite(self, suite):
                if suite.has_setup:
                    analysis.has_setup = True
                    suite.setup.visit(self)
                if suite.has_teardown:
                    analysis.has_teardown = True
                    suite.teardown.visit(self)
                suite.suites.visit(self)
                suite.tests.visit(self)

            def visit_keyword(self, kw):
                analysis.keywords_called.append((kw.full_name or kw.name, self.current_test))
                for a in kw.assign:
                    analysis.assigned.add(a.rstrip("=").strip())
                kw.body.visit(self)
                if kw.has_setup:
                    kw.setup.visit(self)
                if kw.has_teardown:
                    kw.teardown.visit(self)

            def visit_message(self, msg):
                analysis.messages.append((msg.message, msg.level))

            def _ctrl(self, item, kind):
                analysis.controls.add(kind)
                item.body.visit(self)

            def visit_for(self, item):
                self._ctrl(item, "FOR")

            def visit_while(self, item):
                self._ctrl(item, "WHILE")

            def visit_if(self, item):
                self._ctrl(item, "IF")

            def visit_try(self, item):
                self._ctrl(item, "TRY")

            def visit_return(self, item):
                analysis.controls.add("RETURN")

            def visit_break(self, item):
                analysis.controls.add("BREAK")

            def visit_continue(self, item):
                analysis.controls.add("CONTINUE")

            def visit_var(self, item):
                analysis.controls.add("VAR")
                analysis.assigned.add(item.name)

            def visit_group(self, item):
                analysis.controls.add("GROUP")
                item.body.visit(self)

        ExecutionResult(output_xml).suite.visit(V())

    # -- Running-Modell (was in der Datei definiert ist) --
    def _analyze_running(self, path):
        from robot.running import TestSuiteBuilder

        suite = TestSuiteBuilder().build(path)
        res = suite.resource
        for kw in res.keywords:
            self.user_keywords[kw.name] = kw
            if kw.doc:
                self.docs["keyword"] = True
        for var in res.variables:
            self.variables.add(var.name)
        for imp in res.imports:
            if imp.type == "LIBRARY":
                self.libraries.append(imp.name)
            elif imp.type == "RESOURCE":
                self.resources.append(imp.name)
        if suite.doc:
            self.docs["suite"] = True
        for test in suite.tests:
            if test.doc:
                self.docs["test"] = True
            if test.template:
                self.has_template = True
            if test.has_setup:
                self.has_setup = True
            if test.has_teardown:
                self.has_teardown = True
            self.tags.update(str(t) for t in test.tags)
            if test.name not in self.tests:
                self.tests[test.name] = "NOT RUN"
        if suite.has_setup:
            self.has_setup = True
        if suite.has_teardown:
            self.has_teardown = True


def evaluate_checks(checks, files, main_file, output_xml, robocop=None):
    a = Analysis(files, main_file, output_xml, robocop)
    results = []
    for c in checks:
        try:
            ok, default_msg = _check(c, a)
        except Exception as e:
            ok, default_msg = False, f"Interner Fehler bei Prüfung: {e}"
        results.append({
            "type": c.get("type"),
            "ok": bool(ok),
            "label": c.get("label") or _label(c),
            "msg": None if ok else (c.get("msg") or default_msg),
        })
    return results


def _label(c):
    t = c.get("type")
    n = c.get("name", "")
    return {
        "pass": "Alle Tests bestehen",
        "tests_min": f"Mindestens {c.get('count')} Testfälle",
        "test_named": f"Testfall „{n}“ vorhanden",
        "test_status": f"Testfall „{n}“ hat Status {c.get('status')}",
        "keyword_used": f"Keyword „{n}“ wird verwendet",
        "keyword_used_in": f"Keyword „{n}“ wird in „{c.get('test')}“ verwendet",
        "keyword_defined": f"Eigenes Keyword „{n}“ definiert",
        "keyword_args_min": f"Keyword „{n}“ hat mindestens {c.get('count')} Argument(e)",
        "keyword_returns": f"Keyword „{n}“ gibt einen Wert zurück",
        "message_contains": f"Log enthält „{c.get('text')}“",
        "message_regex": "Log enthält erwartete Nachricht",
        "control": f"{c.get('kind')} wird verwendet",
        "variable_defined": f"Variable {n} im Variables-Abschnitt",
        "variable_assigned": f"Variable {n} wird zugewiesen",
        "library_imported": f"Library „{n}“ importiert",
        "resource_imported": "Resource-Datei importiert",
        "tag_used": f"Tag „{n}“ gesetzt",
        "setup_used": "Setup vorhanden",
        "teardown_used": "Teardown vorhanden",
        "template_used": "Test Template verwendet",
        "documentation": "Dokumentation vorhanden",
        "robocop_max": "Robocop meldet nichts mehr" if not c.get("count") else f"Höchstens {c.get('count')} Robocop-Meldungen",
        "robocop_no_rule": f"Regel {c.get('rule')} ist behoben",
        "source_regex": c.get("label", "Quelltext-Prüfung"),
        "source_not_regex": c.get("label", "Quelltext-Prüfung"),
    }.get(t, t)


def _check(c, a):
    t = c["type"]
    n = c.get("name", "")

    if t == "pass":
        # Nur tatsächlich ausgeführte Testfälle zählen. Durch --include o. Ä.
        # herausgefilterte Tests sind nicht gescheitert, sie liefen gar nicht.
        if not a.executed:
            return False, "Es wurde kein Testfall ausgeführt. Prüfe die Konsole auf Fehler."
        failed = [n for n in a.executed if a.tests.get(n) != "PASS"]
        return (not failed), f"Nicht bestanden: {', '.join(failed)}"

    if t == "tests_executed":
        wanted = [_norm(n) for n in c["names"]]
        got = [_norm(n) for n in a.executed]
        missing = [n for n, w in zip(c["names"], wanted) if w not in got]
        extra = [n for n in a.executed if _norm(n) not in wanted]
        if missing or extra:
            parts = []
            if missing:
                parts.append("nicht gelaufen: " + ", ".join(missing))
            if extra:
                parts.append("lief zusätzlich: " + ", ".join(extra))
            return False, "; ".join(parts) + "."
        return True, ""

    if t == "tests_count":
        return len(a.executed) == c["count"], \
            f"Es wurden {len(a.executed)} Testfälle ausgeführt, erwartet {c['count']}."

    if t == "robocop_max":
        rc = a.robocop or _robocop(list(a.files))
        limit = c.get("count", 0)
        if rc["issues"] <= limit:
            return True, ""
        regeln = ", ".join(rc["rules"]) or "siehe Reiter Robocop"
        return False, f"Robocop meldet noch {rc['issues']} Punkt(e): {regeln}."

    if t == "robocop_no_rule":
        rc = a.robocop or _robocop(list(a.files))
        rule = c["rule"].upper()
        if rule not in rc["rules"]:
            return True, ""
        return False, f"Regel {rule} wird weiterhin gemeldet."

    if t == "tests_min":
        return len(a.tests) >= c["count"], f"Es wurden nur {len(a.tests)} Testfälle gefunden."

    if t == "test_named":
        return any(_norm(x) == _norm(n) for x in a.tests), f"Kein Testfall namens „{n}“ gefunden."

    if t == "test_status":
        for name, s in a.tests.items():
            if _norm(name) == _norm(n):
                return s == c["status"], f"„{n}“ hat Status {s}, erwartet {c['status']}."
        return False, f"Kein Testfall namens „{n}“ gefunden."

    if t == "keyword_used":
        return any(_kw_matches(k, n) for k, _ in a.keywords_called), f"Keyword „{n}“ wurde nicht aufgerufen."

    if t == "keyword_used_in":
        return any(_kw_matches(k, n) and _norm(tn) == _norm(c["test"]) for k, tn in a.keywords_called), \
            f"„{n}“ wurde im Test „{c['test']}“ nicht aufgerufen."

    if t == "keyword_defined":
        return any(_norm(k) == _norm(n) for k in a.user_keywords), f"Kein eigenes Keyword „{n}“ im Keywords-Abschnitt."

    if t == "keyword_args_min":
        for k, kw in a.user_keywords.items():
            if _norm(k) == _norm(n):
                cnt = len(list(kw.args))
                return cnt >= c["count"], f"„{n}“ hat {cnt} Argument(e), erwartet mindestens {c['count']}."
        return False, f"Kein eigenes Keyword „{n}“ gefunden."

    if t == "keyword_returns":
        for k, kw in a.user_keywords.items():
            if _norm(k) == _norm(n):
                has = any(getattr(item, "type", "") == "RETURN" for item in kw.body) or bool(getattr(kw, "return_", None))
                return has, f"„{n}“ hat kein RETURN."
        return False, f"Kein eigenes Keyword „{n}“ gefunden."

    if t == "message_contains":
        return any(c["text"] in m for m, _ in a.messages), f"Keine Log-Nachricht enthält „{c['text']}“."

    if t == "message_regex":
        rx = re.compile(c["pattern"])
        return any(rx.search(m) for m, _ in a.messages), "Keine passende Log-Nachricht gefunden."

    if t == "control":
        return c["kind"].upper() in a.controls, f"{c['kind']} wurde nicht ausgeführt."

    if t == "variable_defined":
        return any(_norm(v) == _norm(n) for v in a.variables), f"Variable {n} nicht im Variables-Abschnitt."

    if t == "variable_assigned":
        return any(_norm(v) == _norm(n) for v in a.assigned), f"Variable {n} wurde nicht zugewiesen."

    if t == "library_imported":
        return any(_norm(os.path.basename(l)) == _norm(n) for l in a.libraries), f"Library „{n}“ nicht importiert."

    if t == "resource_imported":
        return bool(a.resources), "Keine Resource-Datei importiert."

    if t == "tag_used":
        return any(_norm(x) == _norm(n) for x in a.tags), f"Tag „{n}“ nicht gefunden."

    if t == "setup_used":
        return a.has_setup, "Kein Setup gefunden."

    if t == "teardown_used":
        return a.has_teardown, "Kein Teardown gefunden."

    if t == "template_used":
        return a.has_template, "Kein Test Template verwendet."

    if t == "documentation":
        scope = c.get("scope", "test")
        return a.docs.get(scope, False), f"Keine [Documentation] ({scope}) gefunden."

    if t == "source_regex":
        return re.search(c["pattern"], a.all_sources, re.M) is not None, "Erwartetes Muster nicht im Quelltext."

    if t == "source_not_regex":
        return re.search(c["pattern"], a.all_sources, re.M) is None, "Unerwünschtes Muster im Quelltext."

    return False, f"Unbekannter Check-Typ: {t}"
