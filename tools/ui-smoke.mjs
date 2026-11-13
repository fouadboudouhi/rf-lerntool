/* Öffnet das Tool im Headless-Chromium, führt eine Lektion aus und macht Screenshots.
   Aufruf: node tools/ui-smoke.mjs  (braucht das globale playwright-Paket) */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] || "/tmp";

const server = spawn("python3", ["serve.py", "8765"], { cwd: ROOT, env: { ...process.env, BROWSER: "none" } });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

await page.goto("http://localhost:8765/#01-grundlagen/01-erster-test");
await page.waitForFunction(() => document.querySelector("#status")?.dataset.state === "ready", null, { timeout: 120000 });
console.log("Status:", await page.textContent("#status"));
await page.screenshot({ path: path.join(OUT, "ui-1-start.png") });

// Startcode ausführen -> soll scheitern
await page.click("#run-modes button[data-mode=robot]");
await page.waitForSelector("#verdict:not([hidden])");
console.log("Startcode:", await page.textContent("#verdict"));

// WICHTIG: keine dialog-Handler registrieren. Playwright verwirft Browser-Dialoge
// automatisch – genau wie ein eingebettetes iframe ohne allow-modals. Die Knöpfe
// müssen also ohne confirm() auskommen.
page.on("dialog", () => { errors.push("Unerwarteter Browser-Dialog (confirm/alert) – in eingebetteten Seiten blockiert!"); });

// Abbrechen im Rückfrage-Dialog darf den Code NICHT verändern
const vorher = await page.inputValue(".ed-ta");
await page.click("#btn-solution");
await page.waitForSelector(".modal-back");
await page.click(".modal [data-no]");
await page.waitForSelector(".modal-back", { state: "detached" });
if (await page.inputValue(".ed-ta") !== vorher) errors.push("Abbrechen hat den Code trotzdem verändert");

// Lösung einfügen und ausführen -> soll bestehen
await page.click("#btn-solution");
await page.waitForSelector(".modal-back");
await page.click(".modal [data-yes]");
await page.waitForSelector(".modal-back", { state: "detached" });
if (await page.inputValue(".ed-ta") === vorher) errors.push("Lösung wurde nicht eingefügt");
await page.click("#run-modes button[data-mode=robot]");
await page.waitForFunction(() => document.querySelector("#verdict")?.classList.contains("ok"), null, { timeout: 30000 });
console.log("Lösung:", await page.textContent("#verdict"));
console.log("Fortschritt:", await page.textContent("#progress-text"));
await page.screenshot({ path: path.join(OUT, "ui-2-solved.png") });

// Zurücksetzen stellt den Startcode wieder her
await page.fill(".ed-ta", "kaputt");
await page.click("#btn-reset");
await page.waitForSelector(".modal-back");
await page.click(".modal [data-yes]");
await page.waitForSelector(".modal-back", { state: "detached" });
const zurueck = await page.inputValue(".ed-ta");
if (zurueck === "kaputt" || !zurueck.includes("*** Test Cases ***")) errors.push("Zurücksetzen hat den Startcode nicht wiederhergestellt");
console.log("Zurücksetzen:", zurueck.split("\n")[0]);

// Log-Reiter
await page.click('.result-tabs button[data-tab="log"]');
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, "ui-3-log.png") });

// Python-Lektion mit zwei Dateien
await page.goto("http://localhost:8765/#05-struktur/02-python-keywords");
await page.waitForTimeout(500);
console.log("Tabs:", await page.$$eval("#file-tabs button", (b) => b.map((x) => x.textContent)));
await page.click("#file-tabs button:nth-child(2)");
await page.click("#btn-hint");
await page.screenshot({ path: path.join(OUT, "ui-4-python.png") });

// Schmale Ansicht
await page.setViewportSize({ width: 800, height: 900 });
await page.screenshot({ path: path.join(OUT, "ui-5-narrow.png") });

console.log("Fehler:", errors.length ? errors : "keine");
await browser.close();
server.kill();
