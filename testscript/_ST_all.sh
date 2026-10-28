#!/bin/bash
# 全量 ST：按组串行，避免单次跑 366 条超时
cd "$(dirname "$0")"
total_p=0; total_b=0; total_o=0; total_s=0; total_n=0
for g in 编码 单向哈希 对称加密 古典密码 校验和 密钥派生 认证加密 后量子密码 后量子 非对称加密 椭圆曲线与高级代数 数字签名 分布式与门限密码 密钥工具; do
  out=$(timeout 200 node t_ST.js "g:$g" 2>/dev/null)
  p=$(echo "$out" | grep -oP '往返通过\s*:\s*\K\d+')
  b=$(echo "$out" | grep -oP '往返不一致\s*:\s*\K\d+')
  o=$(echo "$out" | grep -oP '单向\(无dec\)\s*:\s*\K\d+')
  sk=$(echo "$out" | grep -oP '无法判定\s*:\s*\K\d+')
  n=$(echo "$out" | grep -oP '本轮实测 \K\d+')
  printf "%-16s 条目%-4s 通过%-4s 不一致%-3s 单向%-4s 无法判定%s\n" "$g" "$n" "$p" "$b" "$o" "$sk"
  echo "$out" | grep -A50 '往返不一致 ---' | grep -E '^  [a-z0-9]' | sed 's/^/     BAD: /'
  total_p=$((total_p+p)); total_b=$((total_b+b)); total_o=$((total_o+o)); total_s=$((total_s+sk)); total_n=$((total_n+n))
done
echo "=============================================="
echo "合计 条目 $total_n   通过 $total_p   不一致 $total_b   单向 $total_o   无法判定 $total_s"
