#!/bin/sh
# Baut eine Variante für statisches Hosting, das keine .zip/.whl ausliefert
# (z. B. Claude-Artefakte). Beide Archive werden auf .wasm-Namen kopiert und
# die Pfade in lib/worker.js entsprechend umgeschrieben.
#   ./tools/build-web.sh ../rf-lerntool-web
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$SRC/../rf-lerntool-web}"
rm -rf "$OUT"; mkdir -p "$OUT"
cp -r "$SRC/index.html" "$SRC/styles.css" "$SRC/cheatsheet.md" "$SRC/lib" "$SRC/lessons" "$SRC/vendor" "$OUT/"
rm -rf "$OUT/lib/__pycache__"
mv "$OUT/vendor/pyodide/python_stdlib.zip" "$OUT/vendor/pyodide/python_stdlib.wasm"
mv "$OUT/vendor/robotframework-7.3.2-py3-none-any.whl" "$OUT/vendor/robotframework-7.3.2.wasm"
mv "$OUT/vendor/robocop-bundle.zip" "$OUT/vendor/robocop-bundle.wasm"
sed -i.bak \
  -e 's#vendor/pyodide/python_stdlib.zip#vendor/pyodide/python_stdlib.wasm#' \
  -e 's#vendor/robotframework-7.3.2-py3-none-any.whl#vendor/robotframework-7.3.2.wasm#' \
  -e 's#vendor/robocop-bundle.zip#vendor/robocop-bundle.wasm#' \
  "$OUT/lib/worker.js"
rm -f "$OUT/lib/worker.js.bak"
echo "Web-Variante in $OUT"
