#!/usr/bin/env bash
# Ejecuta de verdad una lista de comandos «tecleándolos» con un prompt, para grabarlos con
# `script --timing`. Lo que sale en el vídeo es la salida real de cada comando.
# Uso: teclear.sh <directorio> <comando> [<comando> ...]
cd "$1"; shift
export TERM=xterm-256color COLUMNS=118 LINES=32 FORCE_COLOR=1
P=$'\e[1;32myoandy@argos\e[0m:\e[1;34m~/'"$(basename "$PWD")"$'\e[0m$ '
for c in "$@"; do
  printf '%s' "$P"
  sleep 0.6
  for ((i = 0; i < ${#c}; i++)); do
    printf '%s' "${c:i:1}"
    sleep 0.0$((RANDOM % 5 + 3))
  done
  sleep 0.35
  printf '\n'
  eval "$c"
  sleep 1.2
done
printf '%s' "$P"
sleep 2
