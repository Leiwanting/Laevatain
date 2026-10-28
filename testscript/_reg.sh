#!/bin/bash
# Reg 全量回归：逐个执行 t_*.js，记录退出码
cd /data/workspace/dist
OUT="_reg.txt"
: > "$OUT"
n=0
for f in $(ls testscript/t_*.js | sort); do
  n=$((n+1))
  timeout 25 node "$f" >/dev/null 2>&1
  rc=$?
  echo "$rc $f" >> "$OUT"
done
echo "TOTAL $n" >> "$OUT"
echo "DONE" >> "$OUT"
