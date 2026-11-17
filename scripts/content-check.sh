#!/usr/bin/env bash
set -euo pipefail

if grep -RInEi --exclude-dir=.git --exclude='*.png' \
  "MVP|trabalho em dupla|em dupla|dupla|parceria" public README.md; then
  echo "FAIL: texto removido encontrado" >&2
  exit 1
fi

echo "PASS: nenhuma referência a MVP ou trabalho em dupla"
