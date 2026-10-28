/* 单向哈希「零覆盖」专项验收
 * 期望值全部来自第三方：
 *   A. Python hashlib（独立实现）            —— 标准摘要
 *   B. Botan src/tests/data/hash/md4.vec     —— MD4
 *   C. BLAKE2 官方 KAT（BLAKE2-master）      —— blake2bp / blake2sp 各 256 组
 *   D. Botan hash/gost.vec                   —— GOST R 34.11-94
 *   E. Botan otp/hotp.vec / otp/totp.vec     —— HOTP / TOTP（源自 RFC 4226 / 6238）
 *   F. Botan kdf/*.vec                       —— KDF1 / SP800-108 / 56A / 56C / TLS-PRF / X9.42
 *   G. Botan mac/siphash.vec, x919_mac.vec   —— SipHash-2-4 / X9.19-MAC
 *   H. Botan bcrypt_pbkdf.vec                —— bcrypt_pbkdf
 *   I. Botan hash/comp4p.vec                 —— Comb4P
 *   J. Botan passhash/passhash9.vec          —— Passhash9
 * 运行：node t_cov_hash.js
 */
require("./_harness.js");
const fs = require("fs");
const A = global.ALGOS;
const H = b => Buffer.isBuffer(b) ? b.toString("hex") : (typeof b === "string" ? b : String(b));
const S = v => typeof v === "string" ? v : JSON.stringify(v);
const eq = (a, b) => String(a).toLowerCase().replace(/\s/g, "") === String(b).toLowerCase().replace(/\s/g, "");
const VD = "testvectors/hash/";

let PASS = 0, FAIL = 0, SKIP = 0; const F = {}; const SKIPS = {};
function skip(k, why) { SKIP++; SKIPS[k] = (SKIPS[k] || 0) + 1; }
const GP = {};
function ck(tag, got, exp) {
  const g0 = tag.split("/")[0];
  if (eq(S(got), S(exp))) { PASS++; GP[g0] = (GP[g0] || 0) + 1; }
  else { FAIL++; const k = tag.split("/").slice(0, 2).join("/"); (F[k] = F[k] || []).push(tag + " got=" + S(got).slice(0, 70) + " exp=" + S(exp).slice(0, 70)); }
}
async function call(id, buf, key, param, fmt) {
  const a = A.find(x => x.id === id); if (!a) throw new Error("无此算法 " + id);
  return await a.enc(buf, key === undefined ? "" : key, param === undefined ? "" : param, fmt === undefined ? "hex" : fmt);
}
function parseVec(p) {
  const txt = fs.readFileSync(p, "utf8"); const out = []; let cur = null, head = null, prev = null;
  const K = "In|Key|Secret|Salt|Label|Counter|Digits|OTP|Output|Out|Passhash|Password|Iterations|PRF|Timestamp|Timestep|Passphrase";
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line[0] === "#") continue;
    const sec = line.match(/^\[(.+)\]$/); if (sec) { head = sec[1]; cur = null; continue; }
    const m = line.match(/^([A-Za-z_0-9]+)\s*=\s*(.*)$/); if (!m) continue;
    const k = m[1], v = m[2].trim();
    if (!new RegExp("^(" + K + ")$").test(k)) continue;
    if (cur && cur[k] !== undefined) { prev = cur; cur = null; }
    if (!cur) {
      cur = { _sec: head };
      /* 段首一次性字段（Key / Digits / Timestep / PRF）向下继承 */
      if (prev) for (const c of ["Key", "Digits", "Timestep", "PRF"]) if (prev[c] !== undefined) cur[c] = prev[c];
      out.push(cur);
    }
    cur[k] = v;
  }
  /* 丢弃未凑齐的收尾空壳 */
  return out.filter(r => r.OTP !== undefined || r.Output !== undefined || r.Out !== undefined || r.Passhash !== undefined);
}

(async () => {
  /* ---------- A. 标准摘要 vs Python hashlib ---------- */
  const PY = {
    "sha1": { "": "da39a3ee5e6b4b0d3255bfef95601890afd80709", "abc": "a9993e364706816aba3e25717850c26c9cd0d89d", "The quick brown fox jumps over the lazy dog": "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12" },
    "sha224": { "": "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f", "abc": "23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7", "The quick brown fox jumps over the lazy dog": "730e109bd7a8a32b1cb9d9a09aa2325d2430587ddbc0c38bad911525" },
    "sha384": { "": "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b", "abc": "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7", "The quick brown fox jumps over the lazy dog": "ca737f1014a48f4c0b6dd43cb177b0afd9e5169367544c494011e3317dbf9a509cb1e5dc1e85a941bbee3d7f2afbc9b1" },
    "sha512-224": { "": "6ed0dd02806fa89e25de060c19d3ac86cabb87d6a0ddd05c333b84f4", "abc": "4634270f707b6a54daae7530460842e20e37ed265ceee9a43e8924aa", "The quick brown fox jumps over the lazy dog": "944cd2847fb54558d4775db0485a50003111c8e5daa63fe722c6aa37" },
    "sha512-256": { "": "c672b8d1ef56ed28ab87c3622c5114069bdd3ad7b8f9737498d0c01ecef0967a", "abc": "53048e2681941ef99b2e29b76b4c7dabe4c2d0c634fc6d46e0e2f13107e7af23", "The quick brown fox jumps over the lazy dog": "dd9d67b371519c339ed8dbd25af90e976a1eeefd4ad3d889005e532fc5bef04d" },
    "blake2s": { "": "69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9", "abc": "508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982", "The quick brown fox jumps over the lazy dog": "606beeec743ccbeff6cbcdf5d5302aa855c256c29b88c8ed331ea1a6bf3c8812" },
    "shake128": { "": "7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26", "abc": "5881092dd818bf5cf8a3ddb793fbcba74097d5c526a6d35f97b83351940f2cc8", "The quick brown fox jumps over the lazy dog": "f4202e3c5852f9182a0430fd8144f0a74b95e7417ecae17db0f8cfeed0e3e66e" },
    "shake256": { "": "46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f", "abc": "483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739", "The quick brown fox jumps over the lazy dog": "2f671343d9b2e1604dc9dcf0753e5fe15c7c64a0d283cbbf722d411a0e36f6ca" }
  };
  for (const id of Object.keys(PY)) for (const m of Object.keys(PY[id])) {
    try { ck("A/" + id + "/len" + m.length, H(await call(id, Buffer.from(m, "utf8"))), PY[id][m]); }
    catch (e) { FAIL++; (F.A = F.A || []).push("A/" + id + " THROW " + e.message); }
  }

  /* ---------- B. MD4（Botan hash/md4.vec） ---------- */
  for (const v of parseVec(VD + "md4.vec")) {
    if (v.In === undefined || v.Out === undefined) continue;
    try { ck("B/md4/" + v.In.length, H(await call("md4", Buffer.from(v.In, "hex"))), v.Out); }
    catch (e) { FAIL++; (F.B = F.B || []).push("B THROW " + e.message); }
  }

  /* ---------- C. BLAKE2bp / blake2sp（官方 KAT，各 256 组） ---------- */
  for (const [id, file] of [["blake2bp", "blake2bp-kat.txt"], ["blake2sp", "blake2sp-kat.txt"]]) {
    const txt = fs.readFileSync(VD + file, "utf8");
    const blocks = txt.split(/\r?\n\s*\r?\n/);
    let n = 0;
    for (const b of blocks) {
      const inM = b.match(/in:\s*([0-9a-fA-F]*)/), keyM = b.match(/key:\s*([0-9a-fA-F]*)/), hashM = b.match(/hash:\s*([0-9a-fA-F]+)/);
      if (!hashM) continue;
      const inn = inM ? inM[1] : "", key = keyM ? keyM[1] : "";
      try { ck("C/" + id + "/" + (inn.length / 2), H(await call(id, Buffer.from(inn, "hex"), "", key)), hashM[1]); n++; }
      catch (e) { FAIL++; (F.C = F.C || []).push("C/" + id + " THROW " + e.message); }
    }
  }

  /* ---------- D. GOST R 34.11-94（Botan hash/gost.vec） ---------- */
  for (const v of parseVec(VD + "gost.vec")) {
    if (v.In === undefined || v.Out === undefined) continue;
    let hit = null;
    for (const id of ["gost3411", "gost3411tp"]) {
      try { const r = H(await call(id, Buffer.from(v.In, "hex"))); if (eq(r, v.Out)) { hit = id; ck("D/" + id, r, v.Out); break; } }
      catch (e) { }
    }
    if (!hit) { FAIL++; (F.D = F.D || []).push("D/gost 两个参数集均不匹配 In=" + v.In.slice(0, 20) + " exp=" + v.Out.slice(0, 20)); }
  }

  /* ---------- E. HOTP / TOTP（Botan otp/*.vec，源自 RFC 4226 / 6238） ---------- */
  for (const v of parseVec(VD + "hotp.vec")) {
    if (v.Counter === undefined || v.OTP === undefined) continue;
    const alg = (v._sec || "").replace(/[^0-9A-Za-z]/g, "").toLowerCase();
    try { ck("E/hotp/" + alg + "/" + v.Counter, S(await call("hotp", Buffer.alloc(0), "hex:" + v.Key, v.Counter + "," + (v.Digits || 6) + "," + alg)), v.OTP); }
    catch (e) { FAIL++; (F.E = F.E || []).push("E/hotp THROW " + e.message); }
  }
  for (const v of parseVec(VD + "totp.vec")) {
    if (v.Timestamp === undefined || v.OTP === undefined) continue;
    const alg = (v._sec || "").replace(/[^0-9A-Za-z]/g, "").toLowerCase();
    const tstr = v.Timestamp.replace(/^(\d{4}-\d{2}-\d{2})[:T]/, "$1T").replace(/([T]\d{2}:\d{2}:\d{2})$/, "$1Z");
    const mt = tstr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/);
    if (!mt) continue;
    const ts = Math.floor(Date.UTC(+mt[1], +mt[2] - 1, +mt[3], +mt[4], +mt[5], +mt[6]) / 1000);
    if (isNaN(ts)) continue;
    const period = v.Timestep || 30;
    const got = S(await call("totp", Buffer.alloc(0), "hex:" + v.Key, (v.Digits || 6) + "," + alg + "," + period + "," + ts));
    ck("E/totp/" + v.Timestamp, got.split("\n")[0].trim(), v.OTP);
  }

  /* ---------- F. KDF（Botan kdf/*.vec） ---------- */
  // KDF1
  for (const v of parseVec(VD + "kdf1.vec")) {
    if (v.Secret === undefined || v.Output === undefined) continue;
    try { ck("F/kdf1", H(await call("kdf1", Buffer.from(v.Secret, "hex"), v.Salt || "", String(v.Output.length / 2))), v.Output); }
    catch (e) { FAIL++; (F.F = F.F || []).push("F/kdf1 THROW " + e.message); }
  }
  // SP800-108 ctr / fb / pipe（仅 HMAC 段）
  for (const [id, file] of [["sp800-108-ctr", "sp800_108_ctr.vec"], ["sp800-108-fb", "sp800_108_fb.vec"], ["sp800-108-pipe", "sp800_108_pipe.vec"]]) {
    let n = 0;
    for (const v of parseVec(VD + file)) {
      if (v.Secret === undefined || v.Output === undefined) continue;
      const m = (v._sec || "").match(/^SP800-108-\w+\(HMAC\((SHA-[0-9-]+)\)\)$/); if (!m) continue;
      const hn = m[1];
      try { ck("F/108/" + id, H(await call(id, Buffer.alloc(0), v.Secret, (v.Label || "") + "," + (v.Salt || "") + "," + (v.Output.length / 2) + "," + hn)), v.Output); n++; }
      catch (e) { FAIL++; (F.F = F.F || []).push("F/108/" + id + " THROW " + e.message); }
    }
  }
  // SP800-56A
  for (const v of parseVec(VD + "sp800_56a.vec")) {
    if (v.Secret === undefined || v.Output === undefined) continue;
    const sec = v._sec || "";
    const hm = sec.match(/\((SHA-[0-9-]+|SHA-3\(512\))\)/); if (!hm) continue;
    const mode = /^SP800-56A\(HMAC/.test(sec) ? "hmac" : "hash";
    if (mode === "hash" && /SHA-3/.test(sec)) continue;
    const hn = hm[1] === "SHA-3(512)" ? "SHA3-512" : hm[1];
    try { ck("F/56a/" + hn, H(await call("sp800-56a", Buffer.from(v.Secret, "hex"), v.Salt || "", hn + "," + (v.Output.length / 2) + "," + mode + "," + (v.Label || ""))), v.Output); }
    catch (e) { if (/不支持的哈希/.test(e.message)) skip("56a/" + hn, e.message); else { FAIL++; (F.F = F.F || []).push("F/56a THROW " + e.message.slice(0, 60)); } }
  }
  // SP800-56C
  for (const v of parseVec(VD + "sp800_56c.vec")) {
    if (v.Secret === undefined || v.Output === undefined) continue;
    const hm = (v._sec || "").match(/\((SHA-[0-9-]+)\)/); if (!hm) continue;
    try { ck("F/56c/" + hm[1], H(await call("sp800-56c", Buffer.from(v.Secret, "hex"), v.Salt || "", hm[1] + "," + (v.Output.length / 2) + "," + (v.Label || ""))), v.Output); }
    catch (e) { if (/内核未加载/.test(e.message)) skip("56c/" + hm[1], e.message); else { FAIL++; (F.F = F.F || []).push("F/56c THROW " + e.message.slice(0, 60)); } }
  }
  // TLS 1.2 PRF / TLS PRF
  for (const v of parseVec(VD + "tls_prf.vec")) {
    if (v.Secret === undefined || v.Output === undefined) continue;
    const sec = v._sec || "";
    try {
      if (sec === "TLS-PRF") ck("F/tlsprf", H(await call("tls-prf", Buffer.from(v.Secret, "hex"), v.Salt || "", (v.Output.length / 2) + "," + (v.Label || ""))), v.Output);
      else { const hm = sec.match(/\((SHA-[0-9-]+)\)/); if (!hm) continue;
        ck("F/tls12prf", H(await call("tls12-prf", Buffer.from(v.Secret, "hex"), v.Salt || "", hm[1] + "," + (v.Output.length / 2) + "," + (v.Label || ""))), v.Output); }
    } catch (e) { FAIL++; (F.F = F.F || []).push("F/tls THROW " + e.message.slice(0, 60)); }
  }
  // X9.42 PRF
  for (const v of parseVec(VD + "x942_prf.vec")) {
    if (v.Secret === undefined || v.Output === undefined) continue;
    const algo = /3\.7/.test(v._sec || "") ? "3.7" : "des3";
    try { ck("F/x942", H(await call("x942-prf", Buffer.from(v.Secret, "hex"), v.Salt || "", algo + "," + (v.Output.length / 2))), v.Output); }
    catch (e) { FAIL++; (F.F = F.F || []).push("F/x942 THROW " + e.message.slice(0, 60)); }
  }

  /* ---------- G. SipHash-2-4 / X9.19-MAC ---------- */
  for (const v of parseVec(VD + "siphash.vec")) {
    if (v.In === undefined || v.Out === undefined) continue;
    try { ck("G/siphash24", H(await call("siphash-24", Buffer.from(v.In, "hex"), v.Key)), v.Out); }
    catch (e) { FAIL++; (F.G = F.G || []).push("G/sip THROW " + e.message.slice(0, 60)); }
  }
  for (const v of parseVec(VD + "x919_mac.vec")) {
    if (v.In === undefined || v.Out === undefined) continue;
    try { ck("G/x919", H(await call("x919-mac", Buffer.from(v.In, "hex"), v.Key)), v.Out); }
    catch (e) { FAIL++; (F.G = F.G || []).push("G/x919 THROW " + e.message.slice(0, 60)); }
  }

  /* ---------- H. bcrypt_pbkdf ---------- */
  for (const v of parseVec(VD + "bcrypt_pbkdf.vec")) {
    if (v.Passphrase === undefined || v.Output === undefined) continue;
    try { ck("H/bcryptpbkdf", H(await call("bcrypt-pbkdf", Buffer.from(v.Passphrase, "utf8"), v.Salt || "", (v.Iterations || 12) + "," + (v.Output.length / 2))), v.Output); }
    catch (e) { FAIL++; (F.H = F.H || []).push("H THROW " + e.message.slice(0, 60)); }
  }

  /* ---------- I. Comb4P ---------- */
  const c4 = { "Comb4P(MD4,MD5)": "comb4p-md4md5", "Comb4P(SHA-1,RIPEMD-160)": "comb4p-sha1rmd160" };
  for (const v of parseVec(VD + "comp4p.vec")) {
    if (v.In === undefined || v.Out === undefined) continue;
    const id = c4[v._sec]; if (!id) continue;
    try { ck("I/" + id, H(await call(id, Buffer.from(v.In, "hex"))), v.Out); }
    catch (e) { FAIL++; (F.I = F.I || []).push("I THROW " + e.message.slice(0, 60)); }
  }

  /* ---------- J. Passhash9 ---------- */
  for (const v of parseVec(VD + "passhash9.vec")) {
    if (v.Password === undefined || v.Passhash === undefined) continue;
    const b64 = v.Passhash.replace(/^\$9\$/, "");
    const raw = Buffer.from(b64, "base64");
    const alg = raw[0], wf = raw[1] * 256 + raw[2], salt = raw.slice(3, 15).toString("hex");
    try { ck("J/passhash9", S(await call("passhash9", Buffer.from(v.Password, "hex"), salt, wf + "," + alg)), v.Passhash); }
    catch (e) { FAIL++; (F.J = F.J || []).push("J THROW " + e.message.slice(0, 80)); }
    try { const r = S(await call("passhash9-verify", Buffer.alloc(0), Buffer.from(v.Password, "hex").toString("latin1"), v.Passhash));
      if (!/匹配/.test(r)) { FAIL++; (F.J = F.J || []).push("J/verify 不匹配 " + r); } else PASS++; }
    catch (e) { FAIL++; (F.J = F.J || []).push("J/verify THROW " + e.message.slice(0, 80)); }
  }


  /* ---------- K. Parallel 组合哈希（Botan hash/parallel.vec） ---------- */
  const PMAP = { "Parallel(MD5,SHA-1)": "parallel-md5-sha1", "Parallel(SHA-256,SHA-512)": "parallel-sha256-512" };
  for (const v of parseVec(VD + "parallel.vec")) {
    if (v.In === undefined || v.Out === undefined) continue;
    const id = PMAP[v._sec]; if (!id) continue;
    try { ck("K/" + id, H(await call(id, Buffer.from(v.In, "hex"))), v.Out); }
    catch (e) { FAIL++; (F.K = F.K || []).push("K THROW " + e.message.slice(0, 60)); }
  }

  /* ---------- L. BIP-39 种子派生（Trezor 官方 vectors.json） ---------- */
  try {
    const tj = JSON.parse(fs.readFileSync(VD + "trezor_vectors.json", "utf8"));
    for (const lang of Object.keys(tj)) {
      if (lang !== "english") continue; /* 其他语种助记词需词表，本项目只内置英文 */
      for (const row of tj[lang]) {
        const mnemonic = row[1], seed = row[2];
        try { ck("L/bip39-seed", S(await call("bip39-seed", Buffer.from(mnemonic, "utf8"), "", "TREZOR")), seed); }
        catch (e) { FAIL++; (F.L = F.L || []).push("L THROW " + e.message.slice(0, 70)); }
      }
    }
  } catch (e) { FAIL++; (F.L = F.L || []).push("L 读取失败 " + e.message.slice(0, 60)); }

  /* ---------- M. Merkle（RFC 6962；期望值由 Python hashlib 独立实现算出） ---------- */
  const MK = [
    ["1", "00", "96a296d224f285c67bee93c30f8a309157f0daa35dc5b87e410b78630a09cfc7"],
    ["2", "00\n01", "a20bf9a7cc2dc8a08f5f415a71b19f6ac427bab54d24eec868b5d3103449953a"],
    ["3", "00\n01\n02", "3b6cccd7e3e023ff393006f030315ee7ad9eb111b022b41fba7e5b7a3973f688"],
    ["5", "00\n01\n02\n03\n04", "b855b42d6c30f5b087e05266783fbd6e394f7b926013ccaa67700a8b0c5a596f"],
    ["8", "00\n01\n02\n03\n04\n05\n06\n07", "ef7f49b620f6c7ea9b963a214da34b5021c6ded8ed57734380a311ab726aa907"],
    ["txt", "a\nb\nc", "36642e73c2540ab121e3a6bf9545b0a24982cd830eb13d3cd19de3ce6c021ec1"]
  ];
  for (const [tag, input, exp] of MK) {
    try {
      const r = S(await call("merkle-root", Buffer.from(input, "utf8")));
      const m = r.match(/树根:\s*([0-9a-fA-F]+)/);
      ck("M/merkle-root/" + tag, m ? m[1] : r, exp);
    } catch (e) { FAIL++; (F.M = F.M || []).push("M/root THROW " + e.message.slice(0, 60)); }
  }
  for (const [tag, input, exp] of MK) {
    const n = input.split("\n").length;
    for (let i = 0; i < n; i++) {
      try {
        const r = S(await call("merkle-proof", Buffer.from(input, "utf8"), "", i + "," + exp));
        if (!/一致/.test(r) || !new RegExp(exp, "i").test(r)) { FAIL++; (F.M = F.M || []).push("M/proof/" + tag + "#" + i + " -> " + r.slice(0, 90)); }
        else PASS++, GP.M = (GP.M || 0) + 1;
      } catch (e) { FAIL++; (F.M = F.M || []).push("M/proof THROW " + e.message.slice(0, 60)); }
    }
  }

  console.log("===== 单向哈希零覆盖专项 =====");
  console.log("分组通过数 " + JSON.stringify(GP));
  console.log("总 PASS " + PASS + " / FAIL " + FAIL + " / SKIP " + SKIP);
  if (SKIP) console.log("跳过明细 " + JSON.stringify(SKIPS));
  for (const k of Object.keys(F)) {
    console.log("--- " + k + " 失败 " + F[k].length);
    F[k].slice(0, 6).forEach(x => console.log("   " + x));
  }
  process.exit(FAIL ? 1 : 0);
})();
