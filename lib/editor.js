/* Schlanker Code-Editor ohne Abhängigkeiten:
   Textarea (Eingabe) über einem <pre> (Syntax-Highlighting), synchron gescrollt.
   Unterstützt Robot-Framework- und Python-Highlighting, Zeilennummern, Tab = 4 Leerzeichen,
   Auto-Einrückung bei Enter. */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const RF_CONTROL = new Set([
  "FOR", "END", "IF", "ELSE IF", "ELSE", "WHILE", "TRY", "EXCEPT", "FINALLY",
  "RETURN", "BREAK", "CONTINUE", "IN", "IN RANGE", "IN ENUMERATE", "IN ZIP", "VAR", "GROUP",
]);
const SETTINGS = /^(Library|Resource|Variables|Documentation|Suite Setup|Suite Teardown|Test Setup|Test Teardown|Test Tags|Test Template|Test Timeout|Task Setup|Task Teardown|Default Tags|Metadata|Name|Keyword Tags)$/i;
const IS_ASSIGN = /^[$@&]\{[^}]*\}\s*=?$/;

function hlVars(text) {
  return text.replace(/([$@&%])\{[^}]*\}(\[[^\]]*\])?/g, (m) => `<span class="tk-var">${m}</span>`);
}

function sectionOf(line) {
  const m = line.match(/^\*+\s*([A-Za-z ]+?)\s*\**\s*$/);
  if (!m) return null;
  const n = m[1].toLowerCase().replace(/s$/, "");
  if (n.startsWith("setting")) return "settings";
  if (n.startsWith("variable")) return "variables";
  if (n.startsWith("test") || n.startsWith("task")) return "tests";
  if (n.startsWith("keyword")) return "keywords";
  return "comments";
}

function highlightRobot(src) {
  const out = [];
  let section = "tests";
  for (const raw of src.split("\n")) {
    if (/^\*/.test(raw)) {
      section = sectionOf(raw) || section;
      out.push(`<span class="tk-section">${esc(raw)}</span>`);
      continue;
    }
    if (section === "comments") { out.push(`<span class="tk-comment">${esc(raw)}</span>`); continue; }

    // Kommentar abtrennen
    let code = raw, comment = "";
    if (raw.trimStart().startsWith("#")) { code = ""; comment = raw; }
    else {
      const cm = raw.match(/^(.*?\S)(\s{2,}|\t+)(#.*)$/);
      if (cm) { code = cm[1] + cm[2]; comment = cm[3]; }
    }
    if (!code.trim()) {
      out.push(esc(code) + (comment ? `<span class="tk-comment">${esc(comment)}</span>` : ""));
      continue;
    }

    const parts = code.split(/( {2,}|\t+)/);
    const indented = /^\s/.test(code);
    let html = "", idx = 0, seenKeyword = false;
    for (const p of parts) {
      if (p === "" || /^( {2,}|\t+)$/.test(p)) { html += esc(p); continue; }
      const e = esc(p), t = p.trim(), upper = t.toUpperCase();
      let cls = null;
      if (section === "settings") cls = idx === 0 ? "tk-setting" : null;
      else if (section === "variables") cls = idx === 0 ? "tk-var" : null;
      else if (!indented && idx === 0) cls = "tk-name";
      else if (RF_CONTROL.has(upper)) { cls = "tk-control"; seenKeyword = true; }
      else if (!seenKeyword && /^\[[A-Za-z ]+\]$/.test(t)) { cls = "tk-setting"; seenKeyword = true; }
      else if (!seenKeyword && IS_ASSIGN.test(t)) cls = "tk-var";
      else if (!seenKeyword) { cls = "tk-keyword"; seenKeyword = true; }
      else if (!indented && idx === 1 && SETTINGS.test(t)) cls = "tk-setting";
      html += cls === "tk-var" || cls === null ? hlVars(e) : (cls === "tk-keyword" ? `<span class="${cls}">${hlVars(e)}</span>` : `<span class="${cls}">${e}</span>`);
      idx++;
    }
    if (comment) html += `<span class="tk-comment">${esc(comment)}</span>`;
    out.push(html);
  }
  return out.join("\n");
}

const PY_KW = /\b(def|return|import|from|class|if|elif|else|for|while|in|not|and|or|is|None|True|False|try|except|finally|raise|with|as|pass|lambda|yield|global|nonlocal|assert|del|break|continue)\b/g;

function highlightPython(src) {
  const re = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(#[^\n]*)|(@\w+)|(\b\d+(?:\.\d+)?\b)/g;
  let out = "", last = 0, m;
  const plain = (t) => esc(t).replace(PY_KW, '<span class="tk-control">$1</span>');
  while ((m = re.exec(src))) {
    out += plain(src.slice(last, m.index));
    if (m[1]) out += `<span class="tk-string">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tk-comment">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="tk-setting">${esc(m[3])}</span>`;
    else out += `<span class="tk-var">${esc(m[4])}</span>`;
    last = re.lastIndex;
  }
  return out + plain(src.slice(last));
}

export function highlight(src, language) {
  return language === "python" ? highlightPython(src) : highlightRobot(src);
}

export class Editor {
  constructor(container, { language = "robot", readOnly = false } = {}) {
    this.container = container;
    this.language = language;
    container.classList.add("ed");
    container.innerHTML = `
      <div class="ed-gutter"><div class="ed-gutter-inner"></div></div>
      <div class="ed-scroll">
        <pre class="ed-pre" aria-hidden="true"><code></code></pre>
        <textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Code-Editor"></textarea>
      </div>`;
    this.gutter = container.querySelector(".ed-gutter-inner");
    this.pre = container.querySelector("code");
    this.ta = container.querySelector("textarea");
    this.ta.readOnly = readOnly;
    this.onChange = null;

    this.ta.addEventListener("input", () => { this.render(); this.onChange && this.onChange(this.getValue()); });
    this.ta.addEventListener("scroll", () => this.syncScroll());
    this.ta.addEventListener("keydown", (e) => this.keydown(e));
  }

  setLanguage(lang) { this.language = lang; this.render(); }
  getValue() { return this.ta.value; }
  setValue(v) { this.ta.value = v; this.render(); this.ta.scrollTop = 0; this.syncScroll(); }
  focus() { this.ta.focus(); }

  render() {
    const src = this.ta.value;
    this.pre.innerHTML = highlight(src, this.language) + "\n";
    const n = src.split("\n").length;
    let g = "";
    for (let i = 1; i <= n; i++) g += i + "\n";
    this.gutter.textContent = g;
    this.syncScroll();
  }

  syncScroll() {
    this.pre.style.transform = `translate(${-this.ta.scrollLeft}px, ${-this.ta.scrollTop}px)`;
    this.gutter.style.transform = `translateY(${-this.ta.scrollTop}px)`;
  }

  keydown(e) {
    const ta = this.ta;
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      if (e.shiftKey) {
        const ls = ta.value.lastIndexOf("\n", s - 1) + 1;
        const m = ta.value.slice(ls).match(/^ {1,4}/);
        if (m) {
          ta.setRangeText("", ls, ls + m[0].length, "end");
          ta.selectionStart = ta.selectionEnd = Math.max(ls, s - m[0].length);
        }
      } else {
        ta.setRangeText("    ", s, en, "end");
      }
      ta.dispatchEvent(new Event("input"));
    } else if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const s = ta.selectionStart;
      const ls = ta.value.lastIndexOf("\n", s - 1) + 1;
      const line = ta.value.slice(ls, s);
      let indent = (line.match(/^\s*/) || [""])[0];
      if (this.language === "python" && /:\s*$/.test(line)) indent += "    ";
      ta.setRangeText("\n" + indent, s, ta.selectionEnd, "end");
      ta.dispatchEvent(new Event("input"));
    }
  }
}
