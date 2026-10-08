#!/usr/bin/env bash
# Pacote local para entrega: docs/store + instruções (+ builds, se existirem em android/app/build/outputs).
set -euo pipefail
SAIDA="${1:-ngs-driver-pacote-lojas.zip}"
TMP="$(mktemp -d)"
cp -r docs/store "$TMP/store"
cp docs/app/PIPELINE.md docs/app/TESTE_EM_APARELHO.md docs/app/ADR-001-capacitor.md "$TMP/"
mkdir -p "$TMP/builds"
cp android/app/build/outputs/bundle/release/*.aab android/app/build/outputs/apk/debug/*.apk "$TMP/builds/" 2>/dev/null || true
(cd "$TMP" && zip -qr "$OLDPWD/$SAIDA" .)
echo "gerado: $SAIDA"
