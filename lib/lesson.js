/* Parser für Lektionsdateien (Markdown mit speziellen Code-Zäunen).

   ---
   title: Hallo Welt
   ---
   Erklärung in Markdown …

   ```robot start          -> Startcode für test.robot (editierbar)
   ```robot solution       -> Musterlösung für test.robot
   ```python file:helpers.py       -> zusätzliche editierbare Datei
   ```python solution:helpers.py   -> Musterlösung dieser Datei
   ```robot readonly:common.resource -> zusätzliche, nicht editierbare Datei
   ```checks               -> JSON-Liste der Prüfungen
   ```hints                -> Hinweise, getrennt durch Zeilen mit ---

   Alle anderen Zäune (```robot, ```python, ```text …) gehören zur Erklärung. */

export function parseLesson(md, id) {
  md = md.replace(/\r\n?/g, "\n");
  const lesson = {
    id, title: id, meta: {}, text: "", files: [], solution: {}, checks: [], hints: [], mainFile: "test.robot",
  };

  const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const l of fm[1].split("\n")) {
      const m = l.match(/^(\w+):\s*(.*)$/);
      if (m) lesson.meta[m[1]] = m[2].trim();
    }
    md = md.slice(fm[0].length);
  }
  lesson.title = lesson.meta.title || id;

  const textParts = [];
  const re = /^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm;
  let last = 0, m;
  const langOf = (name) => (/\.py$/.test(name) ? "python" : /\.(robot|resource)$/.test(name) ? "robot" : "text");
  while ((m = re.exec(md))) {
    const info = m[1].trim();
    const body = m[2].replace(/\n$/, "");
    const [lang, spec] = info.split(/\s+/, 2);
    let special = true;
    if (spec === "start") lesson.files.push({ name: "test.robot", language: "robot", content: body, editable: true });
    else if (spec === "solution") lesson.solution["test.robot"] = body;
    else if (spec && spec.startsWith("file:")) lesson.files.push({ name: spec.slice(5), language: langOf(spec), content: body, editable: true });
    else if (spec && spec.startsWith("readonly:")) lesson.files.push({ name: spec.slice(9), language: langOf(spec), content: body, editable: false });
    else if (spec && spec.startsWith("solution:")) lesson.solution[spec.slice(9)] = body;
    else if (lang === "checks") { try { lesson.checks = JSON.parse(body); } catch (e) { console.error(id, "checks-JSON ungültig:", e); } }
    else if (lang === "hints") lesson.hints = body.split(/^---\s*$/m).map((h) => h.trim()).filter(Boolean);
    else special = false;
    if (special) {
      textParts.push(md.slice(last, m.index));
      last = re.lastIndex;
    }
  }
  textParts.push(md.slice(last));
  lesson.text = textParts.join("").trim();
  if (!lesson.files.some((f) => f.name === lesson.mainFile) && lesson.files.length) lesson.mainFile = lesson.files[0].name;
  return lesson;
}

export async function loadIndex(base = "lessons/") {
  const idx = await (await fetch(base + "index.json")).json();
  return idx;
}

export async function loadLesson(path, base = "lessons/") {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`Lektion ${path} nicht gefunden (${res.status})`);
  return parseLesson(await res.text(), path.replace(/\.md$/, ""));
}
