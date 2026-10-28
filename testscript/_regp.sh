#!/bin/bash
cd /data/workspace/dist
OUT="_reg.txt"
: > "$OUT"
ls testscript/t_*.js | sort > _tlist.txt
run_one(){ timeout 30 node "$1" >/dev/null 2>&1; echo "$? $1"; }
export -f run_one
cat _tlist.txt | xargs -P 8 -I{} bash -c 'run_one {}' >> "$OUT" 2>/dev/null
echo "TOTAL $(wc -l < _tlist.txt)" >> "$OUT"
echo "DONE" >> "$OUT"
