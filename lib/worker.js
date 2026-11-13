/* Web Worker: lädt Pyodide + Robot Framework und führt Lektionen aus.
   Protokoll (postMessage):
     -> {type:'init'}
     <- {type:'progress', text}
     <- {type:'ready', version}
     -> {type:'run', id, files:{name:content}, checks:[...], mainFile, runOptions, mode}
        mode: 'robot' (Standard), 'dryrun' oder 'robocop' 
     <- {type:'result', id, ...runner.py-Ergebnis}
     <- {type:'error', id?, message}
*/
// Pfade der beiden Binärdateien. Beim Veröffentlichen als Web-Artefakt werden sie
// durch tools/build-web.sh auf .wasm-Namen umgeschrieben (Artefakt-Hosting liefert
// keine .zip/.whl aus); lokal bleiben die Originalnamen.
const STDLIB_URL = "../vendor/pyodide/python_stdlib.zip";
const WHEEL_URL = "../vendor/robotframework-7.3.2-py3-none-any.whl";
const ROBOCOP_URL = "../vendor/robocop-bundle.zip";

importScripts("../vendor/pyodide/pyodide.js");

let pyodide = null;
let runLesson = null;
let runRobocop = null;
let robocopReady = false;

// Robocop wird erst geladen, wenn eine Lektion es braucht (rund 3 MB).
async function ensureRobocop() {
  if (robocopReady) return;
  progress("Robocop wird geladen …");
  const res = await fetch(ROBOCOP_URL);
  if (!res.ok) throw new Error("Robocop-Paket nicht gefunden (" + res.status + ")");
  pyodide.FS.writeFile("/tmp/robocop.zip", new Uint8Array(await res.arrayBuffer()));
  pyodide.runPython(`
import zipfile, sys
sp = [p for p in sys.path if p.endswith('site-packages')][0]
zipfile.ZipFile('/tmp/robocop.zip').extractall(sp)
import importlib; importlib.invalidate_caches()
import robocop
`);
  robocopReady = true;
  self.postMessage({ type: "ready", version: pyodide.runPython("import robot; robot.__version__") });
}

function progress(text) {
  self.postMessage({ type: "progress", text });
}

async function init() {
  progress("Python-Laufzeit wird geladen …");
  pyodide = await loadPyodide({ indexURL: "../vendor/pyodide/", stdLibURL: STDLIB_URL });

  progress("Robot Framework wird installiert …");
  const whl = await fetch(WHEEL_URL);
  if (!whl.ok) throw new Error("Robot-Framework-Wheel nicht gefunden (" + whl.status + ")");
  pyodide.FS.writeFile("/tmp/rf.whl", new Uint8Array(await whl.arrayBuffer()));
  pyodide.runPython(`
import zipfile, sys
sp = [p for p in sys.path if p.endswith('site-packages')][0]
zipfile.ZipFile('/tmp/rf.whl').extractall(sp)
`);

  const runnerSrc = await (await fetch("runner.py")).text();
  pyodide.FS.writeFile("/tmp/runner.py", runnerSrc);
  pyodide.runPython("import sys; sys.path.insert(0, '/tmp'); import runner");
  const mod = pyodide.globals.get("runner");
  runLesson = mod.run_lesson;
  runRobocop = mod.run_robocop;

  const version = pyodide.runPython("import robot; robot.__version__");
  self.postMessage({ type: "ready", version });
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  try {
    if (msg.type === "init") {
      await init();
    } else if (msg.type === "run") {
      if (!runLesson) throw new Error("Laufzeit ist noch nicht bereit.");
      const mode = msg.mode || "robot";
      const braucht = mode === "robocop" || JSON.stringify(msg.checks || []).includes("robocop");
      if (braucht) await ensureRobocop();

      if (mode === "robocop") {
        const json = runRobocop(JSON.stringify(msg.files), msg.mainFile || "test.robot");
        self.postMessage({ type: "result", id: msg.id, mode, robocop: JSON.parse(json), checks: [] });
        return;
      }
      let options = msg.runOptions || "";
      if (mode === "dryrun") options = (options ? options + "; " : "") + "dryrun=true";
      const json = runLesson(
        JSON.stringify(msg.files),
        JSON.stringify(msg.checks || []),
        msg.mainFile || "test.robot",
        options
      );
      self.postMessage({ type: "result", id: msg.id, mode, ...JSON.parse(json) });
    }
  } catch (e) {
    self.postMessage({ type: "error", id: msg.id, message: String(e && e.message ? e.message : e) });
  }
};
