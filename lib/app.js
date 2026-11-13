import { Editor } from "./editor.js";
import { renderMarkdown } from "./markdown.js";
import { loadIndex, loadLesson } from "./lesson.js";

const $ = (sel, root = document) => root.querySelector(sel);
const STORE = "rf-lerntool:";
const RUN_TIMEOUT_MS = 30000;

// ---------------------------------------------------------------- Laufzeit (Worker)
class Runtime {
  constructor(onStatus) {
    this.onStatus = onStatus;
    this.pending = new Map();
    this.ready = false;
    this.start();
  }
  start() {
    this.ready = false;
    this.worker = new Worker("lib/worker.js");
    this.worker.onmessage = (ev) => this.handle(ev.data);
    this.worker.onerror = (e) => this.onStatus("error", "Worker-Fehler: " + e.message);
    this.onStatus("loading", "Laufzeit wird gestartet …");
    this.worker.postMessage({ type: "init" });
  }
  handle(msg) {
    if (msg.type === "progress") this.onStatus("loading", msg.text);
    else if (msg.type === "ready") { this.ready = true; this.onStatus("ready", `Robot Framework ${msg.version} bereit`); }
    else if (msg.type === "result" || msg.type === "error") {
      const p = this.pending.get(msg.id);
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(msg.id);
      msg.type === "error" ? p.reject(new Error(msg.message)) : p.resolve(msg);
    }
  }
  run(files, checks, mainFile, runOptions, mode) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.worker.terminate();
        reject(new Error(`Abbruch nach ${RUN_TIMEOUT_MS / 1000} s – vermutlich eine Endlosschleife. Die Laufzeit wird neu gestartet.`));
        this.start();
      }, RUN_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: "run", id, files, checks, mainFile, runOptions, mode });
    });
  }
}

// ---------------------------------------------------------------- Speicher
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(STORE + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch { /* privater Modus o. ä. */ } },
  del(key) { try { localStorage.removeItem(STORE + key); } catch { /* ignorieren */ } },
};

// Ausführungsmodi, die eine Lektion über `run_modes` anbieten kann
const MODI = {
  robot:   { label: "▶ Ausführen",    titel: "Tests wirklich ausführen (Strg+Enter)", primary: true },
  dryrun:  { label: "🔍 Trockenlauf", titel: "robot --dryrun: prüft nur die Syntax, führt nichts aus" },
  robocop: { label: "📏 Robocop",     titel: "Stilprüfung mit Robocop, wie in der Pipeline" },
};

// Ausführungsoptionen als Kommandozeile darstellen, damit sichtbar wird,
// welcher robot-Aufruf gerade nachgestellt wurde
function cliFromOptions(options) {
  if (!options) return "";
  const parts = [];
  for (const [key, value] of Object.entries(options)) {
    for (const v of Array.isArray(value) ? value : [value]) parts.push(`--${key} ${v}`);
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------- Rückfrage
// Kein confirm(): Browser-Dialoge sind in eingebetteten Seiten (iframe ohne
// allow-modals, z. B. beim Hosting als Artefakt) blockiert und liefern still false.
function ask(text, okLabel = "OK") {
  return new Promise((resolve) => {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
        <p class="modal-text"></p>
        <div class="modal-actions">
          <button class="btn" data-no>Abbrechen</button>
          <button class="btn primary" data-yes></button>
        </div>
      </div>`;
    back.querySelector(".modal-text").textContent = text;
    back.querySelector("[data-yes]").textContent = okLabel;
    const close = (value) => {
      document.removeEventListener("keydown", onKey, true);
      back.remove();
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(false); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); close(true); }
    };
    back.querySelector("[data-no]").addEventListener("click", () => close(false));
    back.querySelector("[data-yes]").addEventListener("click", () => close(true));
    back.addEventListener("click", (e) => { if (e.target === back) close(false); });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(back);
    back.querySelector("[data-yes]").focus();
  });
}

// ---------------------------------------------------------------- App
class App {
  constructor() {
    this.index = null;
    this.flat = [];        // [{path, chapter}]
    this.lesson = null;
    this.files = [];       // aktuelle Dateien (Kopie aus Lektion + Änderungen)
    this.activeFile = 0;
    this.hintsShown = 0;
    this.freeform = new Set();   // Lektionen ohne Prüfung (Spielwiese)
    this.progress = store.get("progress", {});
    this.editor = new Editor($("#editor"));
    this.editor.onChange = (v) => { if (this.files[this.activeFile]) { this.files[this.activeFile].content = v; this.saveDraft(); } };
    this.runtime = new Runtime((state, text) => this.setStatus(state, text));
    this.bind();
  }

  async init() {
    this.index = await loadIndex();
    for (const ch of this.index.chapters) for (const path of ch.lessons) this.flat.push({ path, chapter: ch.title });
    this.renderNav();
    window.addEventListener("hashchange", () => this.route());
    await this.route();
  }

  bind() {
    $("#btn-reset").addEventListener("click", () => this.reset());
    $("#btn-hint").addEventListener("click", () => this.showHint());
    $("#btn-solution").addEventListener("click", () => this.showSolution());
    $("#btn-prev").addEventListener("click", () => this.go(-1));
    $("#btn-next").addEventListener("click", () => this.go(1));
    $("#btn-menu").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    $("#btn-reset-progress").addEventListener("click", async () => {
      if (!(await ask("Gesamten Fortschritt und alle Entwürfe löschen?", "Alles löschen"))) return;
      try {
        Object.keys(localStorage).filter((k) => k.startsWith(STORE)).forEach((k) => localStorage.removeItem(k));
      } catch { /* Speicher nicht verfügbar */ }
      this.progress = {};
      location.reload();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); this.run("robot"); }
    });
    const sheet = $("#cheatsheet");
    const toggleSheet = async (show) => {
      if (show && !sheet.dataset.loaded) {
        try {
          const md = await (await fetch("cheatsheet.md")).text();
          $("#cheatsheet-body").innerHTML = renderMarkdown(md);
          sheet.dataset.loaded = "1";
        } catch {
          $("#cheatsheet-body").innerHTML = "<p class='fail'>Spickzettel konnte nicht geladen werden.</p>";
        }
      }
      sheet.hidden = !show;
    };
    $("#btn-cheatsheet").addEventListener("click", () => toggleSheet(sheet.hidden));
    $("#btn-cheatsheet-close").addEventListener("click", () => toggleSheet(false));
    $("#btn-cheatsheet-print").addEventListener("click", () => window.print());
    sheet.querySelector(".sheet-backdrop").addEventListener("click", () => toggleSheet(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !sheet.hidden) toggleSheet(false);
      // "?" öffnet den Spickzettel, sofern gerade nicht im Editor getippt wird
      const tippt = /^(TEXTAREA|INPUT)$/.test(document.activeElement?.tagName || "");
      if (e.key === "?" && !tippt) { e.preventDefault(); toggleSheet(sheet.hidden); }
    });

    for (const tab of document.querySelectorAll(".result-tabs button")) {
      tab.addEventListener("click", () => this.showResultTab(tab.dataset.tab));
    }
  }

  // -------------------------------------------------------------- Navigation
  renderNav() {
    const nav = $("#nav");
    nav.innerHTML = "";
    for (const ch of this.index.chapters) {
      const h = document.createElement("div");
      h.className = "nav-chapter";
      h.textContent = ch.title;
      nav.appendChild(h);
      for (const path of ch.lessons) {
        const a = document.createElement("a");
        a.href = "#" + path.replace(/\.md$/, "");
        a.dataset.path = path;
        a.className = "nav-lesson" + (this.progress[path]?.done ? " done" : "");
        a.innerHTML = `<span class="check">${this.progress[path]?.done ? "✓" : ""}</span><span class="label">${path}</span>`;
        nav.appendChild(a);
      }
    }
    // Titel nachladen (Lektionen sind klein)
    for (const { path } of this.flat) {
      loadLesson(path).then((l) => {
        const a = nav.querySelector(`a[data-path="${path}"] .label`);
        if (a) a.textContent = l.title;
        if (!l.checks.length) this.freeform.add(path);
        this.updateNavState();
      }).catch(() => {});
    }
    this.updateNavState();
  }

  updateNavState() {
    const zaehlend = this.flat.filter((f) => !this.freeform.has(f.path));
    const done = zaehlend.filter((f) => this.progress[f.path]?.done).length;
    $("#progress-text").textContent = `${done} / ${zaehlend.length} Lektionen`;
    $("#progress-bar").style.width = zaehlend.length ? (100 * done / zaehlend.length) + "%" : "0";
    for (const a of document.querySelectorAll("#nav a")) {
      const p = a.dataset.path;
      a.classList.toggle("done", !!this.progress[p]?.done);
      a.classList.toggle("active", this.lesson && p === this.lesson.path);
      a.querySelector(".check").textContent = this.progress[p]?.done ? "✓" : "";
    }
  }

  async route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const entry = this.flat.find((f) => f.path.replace(/\.md$/, "") === id) || this.flat[0];
    if (!entry) return;
    if (!id) { location.hash = entry.path.replace(/\.md$/, ""); return; }
    await this.openLesson(entry);
    document.body.classList.remove("nav-open");
  }

  go(delta) {
    const i = this.flat.findIndex((f) => f.path === this.lesson?.path);
    const next = this.flat[i + delta];
    if (next) location.hash = next.path.replace(/\.md$/, "");
  }

  // -------------------------------------------------------------- Lektion
  async openLesson(entry) {
    const lesson = await loadLesson(entry.path);
    lesson.path = entry.path;
    this.lesson = lesson;
    this.hintsShown = 0;
    const i = this.flat.findIndex((f) => f.path === entry.path);
    $("#lesson-title").textContent = lesson.title;
    $("#lesson-chapter").textContent = entry.chapter;
    $("#lesson-text").innerHTML = renderMarkdown(lesson.text);
    $("#lesson-text").scrollTop = 0;
    $("#btn-prev").disabled = i <= 0;
    $("#btn-next").disabled = i >= this.flat.length - 1;
    $("#btn-hint").hidden = !lesson.hints.length;
    $("#btn-hint").textContent = `Hinweis (${lesson.hints.length})`;
    $("#btn-hint").disabled = false;
    $("#btn-solution").hidden = !Object.keys(lesson.solution).length;
    $("#hints").innerHTML = "";
    $("#hints").hidden = true;

    const draft = store.get("draft:" + entry.path, null);
    this.files = lesson.files.map((f) => ({ ...f, content: draft?.[f.name] ?? f.content }));
    this.activeFile = 0;
    this.renderModeButtons();
    this.renderFileTabs();
    this.loadFileIntoEditor();
    this.clearResults();
    document.title = `${lesson.title} · Robot Framework Lerntool`;
    this.updateNavState();
    if (!lesson.files.length) $("#editor-pane").classList.add("no-editor"); else $("#editor-pane").classList.remove("no-editor");
  }

  renderModeButtons() {
    const box = $("#run-modes");
    box.innerHTML = "";
    const modi = (this.lesson.meta.run_modes || "robot").split(/[;,|]/).map((m) => m.trim()).filter((m) => MODI[m]);
    if (!modi.length) modi.push("robot");
    for (const id of modi) {
      const def = MODI[id];
      const b = document.createElement("button");
      b.className = "btn" + (def.primary ? " primary" : "");
      b.textContent = def.label;
      b.title = def.titel;
      b.dataset.mode = id;
      b.addEventListener("click", () => this.run(id));
      box.appendChild(b);
    }
  }

  renderFileTabs() {
    const tabs = $("#file-tabs");
    tabs.innerHTML = "";
    this.files.forEach((f, i) => {
      const b = document.createElement("button");
      b.textContent = f.name + (f.editable ? "" : " 🔒");
      b.className = i === this.activeFile ? "active" : "";
      b.addEventListener("click", () => { this.activeFile = i; this.renderFileTabs(); this.loadFileIntoEditor(); });
      tabs.appendChild(b);
    });
  }

  loadFileIntoEditor() {
    const f = this.files[this.activeFile];
    if (!f) { this.editor.setValue(""); return; }
    this.editor.setLanguage(f.language);
    this.editor.ta.readOnly = !f.editable;
    this.editor.setValue(f.content);
  }

  saveDraft() {
    const d = {};
    for (const f of this.files) if (f.editable) d[f.name] = f.content;
    store.set("draft:" + this.lesson.path, d);
  }

  async reset() {
    if (!(await ask("Code dieser Lektion auf den Ausgangszustand zurücksetzen?", "Zurücksetzen"))) return;
    store.del("draft:" + this.lesson.path);
    this.files = this.lesson.files.map((f) => ({ ...f }));
    this.loadFileIntoEditor();
    this.clearResults();
  }

  showHint() {
    if (this.hintsShown >= this.lesson.hints.length) return;
    const box = $("#hints");
    box.hidden = false;
    const div = document.createElement("div");
    div.className = "hint";
    div.innerHTML = `<strong>Hinweis ${this.hintsShown + 1}:</strong> ${renderMarkdown(this.lesson.hints[this.hintsShown])}`;
    box.appendChild(div);
    this.hintsShown++;
    $("#btn-hint").textContent = this.hintsShown < this.lesson.hints.length ? `Hinweis (${this.lesson.hints.length - this.hintsShown})` : "Keine weiteren Hinweise";
    $("#btn-hint").disabled = this.hintsShown >= this.lesson.hints.length;
  }

  async showSolution() {
    if (!(await ask("Musterlösung einfügen? Dein aktueller Code wird ersetzt.", "Lösung einfügen"))) return;
    for (const f of this.files) if (this.lesson.solution[f.name] !== undefined) f.content = this.lesson.solution[f.name];
    this.saveDraft();
    this.loadFileIntoEditor();
  }

  // -------------------------------------------------------------- Ausführung
  setStatus(state, text) {
    const el = $("#status");
    el.dataset.state = state;
    el.textContent = text;
    for (const b of document.querySelectorAll("#run-modes button")) b.disabled = state !== "ready";
  }

  clearResults() {
    $("#checks").innerHTML = '<p class="muted">Noch nicht ausgeführt. Klicke auf „Ausführen“ oder drücke Strg+Enter.</p>';
    $("#console").textContent = "";
    $("#log-frame").srcdoc = "";
    const v = $("#verdict");
    v.hidden = true;
    v.className = "verdict";
    v.textContent = "";
    this.showResultTab("checks");
  }

  showResultTab(name) {
    for (const b of document.querySelectorAll(".result-tabs button")) b.classList.toggle("active", b.dataset.tab === name);
    for (const p of document.querySelectorAll(".result-panel")) p.hidden = p.dataset.panel !== name;
  }

  async run(mode = "robot") {
    if (!this.runtime.ready || !this.lesson) return;
    const files = {};
    for (const f of this.files) files[f.name] = f.content;
    this.setStatus("running", mode === "robocop" ? "Robocop läuft …" : "Wird ausgeführt …");
    $("#checks").innerHTML = '<p class="muted">Läuft …</p>';
    const t0 = performance.now();
    try {
      const r = await this.runtime.run(files, this.lesson.checks, this.lesson.mainFile, this.lesson.meta.run_options || "", mode);
      this.showResult(r, performance.now() - t0);
      this.setStatus("ready", "Bereit");
    } catch (e) {
      $("#checks").innerHTML = `<p class="fail">${e.message}</p>`;
      $("#console").textContent = e.message;
    }
  }

  showResult(r, ms) {
    if (r.mode === "robocop") return this.showRobocop(r, ms);
    $("#console").textContent = (r.console || "") + (r.error ? "\n" + r.error : "");
    $("#log-frame").srcdoc = r.log || "<p style='font-family:sans-serif'>Kein Log erzeugt (Fehler vor der Ausführung, siehe Konsole).</p>";

    const box = $("#checks");
    box.innerHTML = "";
    const allOk = r.checks.length > 0 && r.checks.every((c) => c.ok);
    const verdict = $("#verdict");
    verdict.hidden = false;
    if (!r.checks.length) {
      verdict.className = "verdict info";
      verdict.textContent = r.rc === 0 ? "Alle Tests bestanden." : "Es sind Tests fehlgeschlagen – siehe Konsole und Log.";
    } else if (allOk) {
      verdict.className = "verdict ok";
      verdict.textContent = "Lektion geschafft! 🎉";
      this.markDone();
    } else {
      verdict.className = "verdict fail";
      verdict.textContent = r.rc === 0 && r.hasOutput ? "Tests laufen, aber die Aufgabe ist noch nicht vollständig gelöst." : "Noch nicht ganz – sieh dir die Prüfungen und die Konsole an.";
    }
    for (const c of r.checks) {
      const div = document.createElement("div");
      div.className = "check " + (c.ok ? "ok" : "fail");
      div.innerHTML = `<span class="icon">${c.ok ? "✔" : "✘"}</span><span><strong>${c.label}</strong>${c.msg ? `<br><span class="msg">${c.msg}</span>` : ""}</span>`;
      box.appendChild(div);
    }
    const meta = document.createElement("p");
    meta.className = "muted";
    const cli = cliFromOptions(r.options);
    meta.textContent = `Laufzeit ${Math.round(ms)} ms · Rückgabecode ${r.rc}` + (cli ? ` · ausgeführt als: robot ${cli} test.robot` : "");
    box.appendChild(meta);
    if (!allOk && r.rc !== 0) this.showResultTab("checks");
  }

  showRobocop(r, ms) {
    const rc = r.robocop || {};
    $("#console").textContent = rc.output || "";
    this.showResultTab("console");
    const verdict = $("#verdict");
    verdict.hidden = false;
    if (rc.issues === 0) {
      verdict.className = "verdict ok";
      verdict.textContent = "Robocop ist zufrieden – kein Stilverstoß.";
    } else {
      verdict.className = "verdict info";
      verdict.textContent = `Robocop meldet ${rc.issues} Punkt(e): ${rc.rules.join(", ")}`;
    }
    const box = $("#checks");
    box.innerHTML = `<p class="muted">Stilprüfung – die Aufgabenprüfung läuft weiter über „Ausführen“.</p>
      <p class="muted">Laufzeit ${Math.round(ms)} ms · ausgeführt als: robocop check test.robot</p>`;
  }

  markDone() {
    if (this.progress[this.lesson.path]?.done) return;
    this.progress[this.lesson.path] = { done: true, at: new Date().toISOString() };
    store.set("progress", this.progress);
    this.updateNavState();
  }
}

const app = new App();
app.init().catch((e) => {
  $("#lesson-text").innerHTML = `<p class="fail">Lektionen konnten nicht geladen werden: ${e.message}</p>
  <p>Wurde die Seite über einen Webserver geöffnet (z. B. <code>python serve.py</code>) und nicht per Doppelklick auf die HTML-Datei?</p>`;
});
