#!/usr/bin/env node
/* Prüft alle Lektionen: Musterlösung besteht alle Checks, Startcode besteht sie NICHT.
   Aufruf: node tools/check-lessons.mjs   (benötigt Node 18+, läuft mit dem gebündelten Pyodide) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLesson } from "../lib/lesson.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { loadPyodide } = require(path.join(ROOT, "vendor/pyodide/pyodide.js"));

const py = await loadPyodide({ indexURL: path.join(ROOT, "vendor/pyodide/") + "/" });
py.FS.writeFile("/tmp/rf.whl", new Uint8Array(fs.readFileSync(path.join(ROOT, "vendor/robotframework-7.3.2-py3-none-any.whl"))));
py.runPython(`
import zipfile, sys
sp = [p for p in sys.path if p.endswith('site-packages')][0]
zipfile.ZipFile('/tmp/rf.whl').extractall(sp)
`);
// Robocop mitladen, damit auch robocop_*-Checks geprüft werden können
const rcZip = path.join(ROOT, "vendor/robocop-bundle.zip");
if (fs.existsSync(rcZip)) {
  py.FS.writeFile("/tmp/robocop.zip", new Uint8Array(fs.readFileSync(rcZip)));
  py.runPython(`
import zipfile, sys
sp = [p for p in sys.path if p.endswith('site-packages')][0]
zipfile.ZipFile('/tmp/robocop.zip').extractall(sp)
`);
}
py.FS.writeFile("/tmp/runner.py", fs.readFileSync(path.join(ROOT, "lib/runner.py"), "utf8"));
py.runPython("import sys; sys.path.insert(0, '/tmp'); import runner");
const run = py.globals.get("runner").run_lesson;

const index = JSON.parse(fs.readFileSync(path.join(ROOT, "lessons/index.json"), "utf8"));
let failures = 0;
for (const ch of index.chapters) {
  for (const rel of ch.lessons) {
    const file = path.join(ROOT, "lessons", rel);
    if (!fs.existsSync(file)) { console.log(`✘ ${rel}: Datei fehlt`); failures++; continue; }
    const lesson = parseLesson(fs.readFileSync(file, "utf8"), rel);
    const problems = [];
    const frei = lesson.meta.freeform === "true" || !lesson.checks.length && !Object.keys(lesson.solution).length;
    if (!lesson.files.length) problems.push("kein Startcode (```robot start)");
    if (!frei) {
      if (!lesson.checks.length) problems.push("keine Checks");
      if (!Object.keys(lesson.solution).length) problems.push("keine Musterlösung");
    }

    const startFiles = Object.fromEntries(lesson.files.map((f) => [f.name, f.content]));
    const solFiles = { ...startFiles, ...lesson.solution };

    const opts = lesson.meta.run_options || "";
    if (frei) {
      const rf = JSON.parse(run(JSON.stringify(startFiles), JSON.stringify([{ type: "pass" }]), lesson.mainFile, opts));
      if (!rf.checks.every((c) => c.ok)) problems.push("Startcode der freien Übung läuft nicht durch: " + rf.checks.map((c) => c.msg).join(" "));
      if (problems.length) { failures++; console.log(`✘ ${rel} (${lesson.title})`); for (const p of problems) console.log("    " + p); }
      else console.log(`✔ ${rel} (${lesson.title}) – freie Übung, Startcode läuft`);
      continue;
    }
    const rs = JSON.parse(run(JSON.stringify(solFiles), JSON.stringify(lesson.checks), lesson.mainFile, opts));
    const failedSol = rs.checks.filter((c) => !c.ok);
    if (rs.error) problems.push("Lösung: Laufzeitfehler " + rs.error.split("\n").slice(-2).join(" "));
    for (const c of failedSol) problems.push(`Lösung scheitert an: ${c.label} – ${c.msg}`);

    const rt = JSON.parse(run(JSON.stringify(startFiles), JSON.stringify(lesson.checks), lesson.mainFile, opts));
    if (rt.checks.length && rt.checks.every((c) => c.ok)) problems.push("Startcode besteht bereits alle Checks");

    if (frei && !problems.length) { console.log(`✔ ${rel} (${lesson.title}) – freie Übung, Startcode läuft`); continue; }
    if (problems.length) { failures++; console.log(`✘ ${rel} (${lesson.title})`); for (const p of problems) console.log("    " + p); }
    else console.log(`✔ ${rel} (${lesson.title}) – ${lesson.checks.length} Checks, Start scheitert an ${rt.checks.filter((c) => !c.ok).length}`);
  }
}
console.log(failures ? `\n${failures} Lektion(en) mit Problemen` : "\nAlle Lektionen in Ordnung.");
process.exit(failures ? 1 : 0);
