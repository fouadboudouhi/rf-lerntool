/* Nimmt einen kommentierten Durchlauf durch das Lerntool als Video auf.
   Aufruf: node tools/walkthrough.mjs <ausgabe-verzeichnis> */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] || "/tmp/walkthrough";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "video"), { recursive: true });

const PORT = 8891;
const server = spawn("python3", ["serve.py", String(PORT)], { cwd: ROOT, env: { ...process.env, BROWSER: "none" } });
await new Promise((r) => setTimeout(r, 1000));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: path.join(OUT, "video"), size: { width: 1280, height: 800 } },
  colorScheme: "light",
});
const page = await context.newPage();

let shot = 0;
const snap = async (name) => {
  shot++;
  await page.screenshot({ path: path.join(OUT, `${String(shot).padStart(2, "0")}-${name}.png`) });
};

// Einblendung unten im Bild
async function caption(text, holdMs = 2600) {
  await page.evaluate((t) => {
    let el = document.getElementById("__cap");
    if (!el) {
      el = document.createElement("div");
      el.id = "__cap";
      el.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(17,24,39,.94);color:#fff;" +
        "font:600 19px/1.45 system-ui,-apple-system,sans-serif;padding:14px 26px;text-align:center;" +
        "box-shadow:0 -6px 24px rgba(0,0,0,.28);letter-spacing:.1px";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
  await page.waitForTimeout(holdMs);
}

const type = (text, delay = 55) => page.keyboard.type(text, { delay });

// Ausfuehren und auf das Ergebnis DIESES Laufs warten (Ampel vorher neutralisieren)
async function run(expect) {
  await page.evaluate(() => { const v = document.getElementById("verdict"); v.className = "verdict"; v.hidden = true; });
  await page.click("#run-modes button[data-mode=robot]");
  await page.waitForFunction(() => {
    const v = document.getElementById("verdict");
    return !v.hidden && (v.classList.contains("ok") || v.classList.contains("fail") || v.classList.contains("info"));
  }, null, { timeout: 40000 });
  const cls = await page.evaluate(() => document.getElementById("verdict").className);
  if (expect && !cls.includes(expect)) throw new Error(`Erwartet "${expect}", bekommen "${cls}"`);
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------- Start
await page.goto(`http://localhost:${PORT}/#01-grundlagen/01-erster-test`);
await caption("Das Lerntool startet. Es lädt Python und Robot Framework in den Browser – ganz ohne Server.", 3000);
await page.waitForFunction(() => document.querySelector("#status")?.dataset.state === "ready", null, { timeout: 120000 });
await caption("Bereit: Robot Framework 7.3.2 läuft jetzt im Browser. Links die Lektion, rechts der Editor.", 3400);
await snap("bereit");

await caption("Links steht die Erklärung: Aufbau einer .robot-Datei, Testfälle und Keywords.", 3200);
await page.evaluate(() => document.querySelector("#lesson-text").scrollTo({ top: 420, behavior: "smooth" }));
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector("#lesson-text").scrollTo({ top: 900, behavior: "smooth" }));
await caption("Unten die Aufgabe: den Testfall so ergänzen, dass er „Hallo Welt“ ins Log schreibt.", 3200);
await snap("aufgabe");

// ---------------------------------------------------------------- Startcode ausführen
await caption("Zuerst führe ich den unveränderten Startcode aus – zum Zeigen, was dann passiert.", 3000);
await run("fail");
await caption("Rot. Der Testfall hat keinen einzigen Schritt, deshalb schlägt schon „Alle Tests bestehen“ fehl.", 3600);
await snap("startcode-rot");

await caption("Jede Prüfung wird einzeln angezeigt – mit Begründung statt nur „falsch“.", 3400);

// ---------------------------------------------------------------- Hinweise
await caption("Wer nicht weiterkommt, deckt Hinweise auf. Erst der erste …", 2600);
await page.click("#btn-hint");
await page.waitForTimeout(2200);
await caption("… dann der zweite, der konkreter wird. Die Lösung bleibt bis zuletzt verborgen.", 2800);
await page.click("#btn-hint");
await page.waitForTimeout(2000);
await snap("hinweise");

// ---------------------------------------------------------------- Typischer Anfängerfehler
await caption("Jetzt tippe ich die Lösung – absichtlich erst mit dem häufigsten Anfängerfehler.", 3000);
await page.click(".ed-ta");
await page.keyboard.press("Control+a");
await type("*** Test Cases ***\nHallo Welt\n");
await type("    Log Hallo Welt", 90);
await page.waitForTimeout(800);
await caption("Zwischen „Log“ und dem Text steht nur EIN Leerzeichen. Sieh, was Robot Framework daraus macht.", 4000);
await snap("ein-leerzeichen");
await run("fail");
await page.click('.result-tabs button[data-tab="console"]');
await page.waitForTimeout(600);
await caption("„No keyword with name 'Log Hallo Welt' found.“ – die ganze Zeile wurde als Keyword-Name gelesen.", 4200);
await snap("fehler-konsole");

// ---------------------------------------------------------------- Korrektur
await caption("Zwei Leerzeichen trennen Keyword und Argument. Das ist die wichtigste Regel im ganzen Framework.", 3600);
await page.click(".ed-ta");
await page.keyboard.press("Control+a");
await type("*** Test Cases ***\nHallo Welt\n");
await type("    Log    Hallo Welt", 90);
await page.waitForTimeout(900);
await snap("korrigiert");
await caption("Und ausführen.", 1600);
await run("ok");
await page.click('.result-tabs button[data-tab="checks"]');
await page.waitForTimeout(700);
await caption("Grün. Geprüft wird nicht nur, ob der Test läuft, sondern ob „Log“ wirklich benutzt wurde.", 4000);
await snap("geloest");
await caption("Die Lektion ist links abgehakt, der Fortschrittsbalken oben ist gewachsen.", 3200);

// ---------------------------------------------------------------- Log
await page.click('.result-tabs button[data-tab="log"]');
await page.waitForTimeout(1400);
await caption("Im Reiter „Log“ steckt die echte log.html von Robot Framework – dieselbe Datei wie bei einem echten Lauf.", 4200);
await snap("log");

// ---------------------------------------------------------------- FOR-Lektion
await caption("Sprung zu einer späteren Lektion: Schleifen mit FOR.", 2600);
await page.click('a[href="#04-kontrollstrukturen/02-for"]');
await page.waitForTimeout(1600);
await snap("for-lektion");
await caption("Aufgabe: über eine Liste von Buchungen laufen und die Summe bilden.", 3000);
await caption("Die Musterlösung ist hinterlegt – ich nehme sie hier, um die Prüfung zu zeigen.", 3000);
page.once("dialog", (d) => d.accept());
await page.click("#btn-solution");
await page.waitForTimeout(1600);
await snap("for-loesung");
await run("ok");
await caption("Hier prüft das Tool zusätzlich, dass wirklich eine FOR-Schleife ausgeführt wurde – nicht bloß ein grüner Test.", 4400);
await snap("for-gruen");

// ---------------------------------------------------------------- Python-Lektion
await caption("Letzte Station: eigene Keywords in Python. Diese Lektion hat zwei Dateien.", 3000);
await page.click('a[href="#05-struktur/02-python-keywords"]');
await page.waitForTimeout(1600);
await snap("python-lektion");
await caption("Oben die Reiter: test.robot und bank.py. Die Funktion in bank.py ist noch unfertig.", 3400);
await page.click("#file-tabs button:nth-child(2)");
await page.waitForTimeout(1600);
await snap("bank-py");
await caption("Ich ersetze das TODO durch die Berechnung – mit Typ-Annotationen, damit Robot die Argumente umwandelt.", 3800);
await page.click(".ed-ta");
await page.keyboard.press("Control+a");
await type("from robot.api import logger\n\n\n", 25);
await type("def berechne_zinsen(kapital: float, zinssatz: float, jahre: int) -> float:\n", 25);
await type('"""Gibt die einfachen Zinsen zurück."""\n', 22);
await type("return kapital * zinssatz / 100 * jahre", 45);
await caption("Nach dem Doppelpunkt rückt der Editor automatisch ein – wie in einer IDE.", 2600);
await page.waitForTimeout(900);
await snap("bank-py-fertig");
await run("ok");
await caption("Grün: Der Robot-Test ruft das Python-Keyword „Berechne Zinsen“ auf und bekommt 75 zurück.", 4200);
await snap("python-gruen");

await caption("Das war der Durchlauf: 20 Lektionen, jede mit Aufgabe, Hinweisen, Prüfung und echtem Log.", 4000);
await page.evaluate(() => document.getElementById("__cap")?.remove());
await page.waitForTimeout(700);

await context.close();
await browser.close();
server.kill();

const videos = fs.readdirSync(path.join(OUT, "video")).filter((f) => f.endsWith(".webm"));
console.log("Screenshots:", shot, "Video:", videos.join(", "));
