# 第三方来源与许可声明（THIRD-PARTY NOTICES）

本项目的**原创部分**以 MIT License 授权（见 `LICENSE`）。
本项目在实现过程中参考或移植了下列第三方项目的**常量表、算法结构与官方测试向量**，
这些组成部分**保留各自原始许可证**，不受本项目 MIT 声明覆盖。

依据各许可证要求（BSD 系要求保留版权声明、CC0 无要求），此处如实列出。

---

## 参考实现 / 常量来源

| 组件 | 本项目用途 | 原始许可证 | 兼容性 |
|---|---|---|---|
| **Botan 2.19.5** | GMAC、SP 800-108、PGP S2K、HMAC-DRBG、Tiger/SEED/ARIA/Kuznyechik/NOEKEON/MISTY1/KASUMI/CLEFIA 等常量与流程、`.vec` 测试向量 | BSD 2-Clause（Copyright 1999-2022 The Botan Authors） | ✅ 兼容，需保留声明 |
| **Google Adiantum**（`google/adiantum`） | `python/` 下实现与 `test_vectors/ours/` 官方向量 | **MIT**（Copyright 2018 Google LLC） | ✅ 兼容，需保留声明 |
| **Ascon 官方 C 参考**（`ascon-c`） | Ascon-128a / Ascon-Hash256 常量与 KAT | **CC0 1.0 Universal**（公有领域） | ✅ 无义务 |
| **BLAKE2 官方参考**（`BLAKE2`） | BLAKE2bp / BLAKE2sp 的 IV、sigma、流程与 KAT | **CC0** | ✅ 无义务 |
| **liboqs**（Open Quantum Safe） | sntrup761 官方 C 参考、FrodoKEM 12 方案官方实现与参数 | **MIT**（内含各算法各自许可） | ✅ 兼容 |
| **PQClean** | Classic McEliece 348864 参考实现与自产向量 | **CC0 / MIT**（各实现不同） | ✅ 兼容 |
| **arkworks-rs**（`algebra` / `curves`） | BLS12-377 曲线常量与 hash-to-curve 官方向量 | **MIT OR Apache-2.0**（双许可） | ✅ 兼容 |
| **RHash 1.4.4** | Tiger 的 4×256 项 64 位 S-box | **BSD 0-Clause** | ✅ 无义务 |
| **gmalg**（Python） | SM9 标识加密交叉验证参照物 | **MIT** | ✅ 兼容 |
| **xurz97/TES** | XCB / EME2 唯一可编译参考实现 | **MIT** | ✅ 兼容 |
| **ocb3 参考** | OCB（RFC 7253）实现参照 | **BSD 3-Clause** | ✅ 兼容 |
| **NIST CAVP / RFC / IEEE / BIP / 3GPP 官方测试向量** | 各算法验证用事实性数据 | 事实性数据，不构成衍生作品 | ✅ 无义务 |

---

## ✅ 已澄清：CAST5 / CAST-128 不存在 LGPL 风险（2026-10-18）

**文件**：`cast5_gen.js`、`crypto_block_legacy.js`

早期注释曾记载 CAST5「S 盒取自 libgcrypt（LGPL-2.1+）」，并据此认为存在许可冲突。
**该记载有误，现已更正。**

### 澄清过程

1. **S 盒（S1–S8）** —— 是 **RFC 2144 明文规定的固定常量**，属规范性数值（事实性数据），
   直接从 RFC 取得即可，不依赖任何实现，不受版权约束。
   本项目的 8 张表另经 **Botan 2.19.5（BSD-2-Clause）** `src/lib/block/cast128/` 逐项交叉核对一致。

2. **密钥编排与轮函数结构** —— 按 **RFC 2144 §2** 实现：
   - §2.4 规定密钥编排**连续两次** `cast_ks`，且第二次使用第一次**已被修改**的 `X`；
   - 解密为**标准 Feistel 逆序**。本实现用 ping-pong 写法（`t=l; l=r; r=t^f(...)`），
     `i` 从 15 递减时 `i%3` 依次取到 F1/F3/F2/F1…，恰好就是 RFC 要求的轮函数次序，
     与 Botan 展开式写法**完全等价**。

### 验证证据

编写了一份**独立的 RFC 2144 参考实现**（Python），先确认其对 RFC 2144 官方向量
（`0123456712345678234567893456789A` / `0123456789ABCDEF` → `238B4FE5847E44B2`）正确，
再与本项目实现做**双向 300 组随机向量逐字节对拍**：

- 加密 **300/300** 一致
- 解密 **300/300** 一致

结论：本项目 CAST5 实现**始终符合 RFC 2144**，不含任何 libgcrypt 衍生内容，
不存在 LGPL 污染，**整体 MIT 授权完整覆盖**。

---

## 说明

- 本文件随交付包分发，位于包根目录。
- 算法参数（AES/ARIA S 盒、曲线参数、NIST 常量等）均为各标准组织公布的**规范性数值**，
  属事实性数据，不受版权约束。
- 本项目未直接复制任何第三方源码文件，实现均为依据上述公开规范与参考资料的独立 JavaScript 编写；
  列出来源是为尊重原作者劳动与满足许可证的署名要求。

---

## 字体资源（Fonts）

界面字体为**按本项目实际用到的字符子集化**后的 WOFF2，以 base64 内嵌于 `style.css`
（避免在 `file://` 下打开时的跨域限制），原始子集文件同时保留在 `fonts/` 目录便于提取。

| 组件 | 用途 | 覆盖字符 | 许可证 | 来源 |
|---|---|---|---|---|
| **Inter** | 界面拉丁/西里尔/希腊字形（400/500/700，子集化） | 拉丁、西里尔、希腊、常用标点与符号 | **SIL OFL 1.1**（原文见 `fonts/OFL-inter.txt`） | The Inter Project Authors / Google Fonts |
| **LXGW WenKai**（霞鹜文楷） | 界面正文字体（400/500/700） | 简体中文、日文假名（**实测不含谚文音节，也不含西里尔**；二者分别由 Noto Sans KR 与 Inter 提供） | **SIL OFL 1.1**（原文见 `fonts/OFL-lxgw-wenkai.txt`） | LXGW（基于 Klee One 补全简体中文） |
| **Noto Sans SC** | 「楕」（U+6955）单字兜底 | 霞鹜文楷唯一缺的界面汉字，以 `unicode-range` 精确限定，不抢占其他字 | **SIL OFL 1.1**（原文见 `fonts/OFL-noto-sans-sc.txt`） | Google Fonts |
| **Noto Sans** | 符号补充（400/500/700，以 `unicode-range` 精确分配） | U+0456、U+1D62、U+207B、U+2081–2082（Noto Sans SC 未覆盖） | **SIL OFL 1.1**（原文见 `fonts/OFL-noto-sans.txt`） | Google Fonts |
| **Noto Sans KR** | 韩文补充（400/500/700） | 谚文音节与兼容字母（Noto Sans SC 不含谚文，故单独补充） | **SIL OFL 1.1**（原文见 `fonts/OFL-noto-sans-kr.txt`） | Google Fonts |
| **JetBrains Mono** | 密文输出区等宽字体（400/700） | 拉丁（Hex / Base64 严格对齐） | **SIL OFL 1.1**（原文见 `fonts/OFL-jetbrains-mono.txt`） | JetBrains / Google Fonts |

**字体栈**：`'Inter', 'NotoSym', 'LXGWWenKai', 'NotoKR', 'NotoSCfb', -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`；
等宽为 `'JBM', ui-monospace, Consolas, monospace`。未收录字符（如 ▾ ✗ 等少量符号）自动回退系统字体。

> **正文字体两次更换，原因记录于此以免改回去：**
>
> 1. **曾使用 MiSans** —— 其授权对字体文件本身有"不得修改、不得再分发"的限制，而 base64
>    内嵌进 CSS 即构成再分发，无法随开源项目分发，故替换。
> 2. **改用 Noto Sans SC** —— OFL 1.1 合规，但用户反馈观感不佳。
> 3. **现用霞鹜文楷（LXGW WenKai）** —— SIL OFL 1.1，明确允许再分发与修改。
>
> 需特别提醒：**"免费商用"不等于"可再分发、可修改"**。阿里普惠体、HarmonyOS Sans、
> OPPO Sans、vivo Sans、HONOR Sans 等虽可免费商用，但其官方法律声明禁止**拆分**与再分发，
> 而子集化后内嵌恰好命中该条款，**不可用于本项目的分发方式**。
> 允许"再分发 + 修改"的中文字体几乎只剩 OFL 授权，因此可选范围本就很窄。
>
> 包内已无任何 MiSans 文件，并有常驻断言 `t_fonts.js` 防止回退。

**重新生成**：字体子集由脚本产出（字符集取自界面全部译文与算法说明），非手工编辑。

## HONOR Sans（界面正文字体）

- 来源：荣耀官方仓库 cssobral2013/HONOR-Sans-Fonts（官方字体包镜像），包内 LICENSE.txt 为官方原文
- 版权：Copyright 2022 Honor Device Co., Ltd.
- 协议：**HONOR Sans Copyright License Agreement**（**非 OFL，非开源协议**）
  - 免费允许个人与企业使用，含商业用途，并明确 grant 了 use / copy / merge / **embed** 的权利
  - **不得对字体做任何修改** —— 本项目因此未做子集化、未裁剪字集、未转换格式，原样内嵌官方 TTF
  - **不得以 stand-alone（单独）形式再分发或销售字体本身**；本限制不适用于「使用 HONOR Sans 创作的作品」，
    本项目为网页应用，字体作为其组成部分随附，不单独提供字体文件下载
  - 必须保留版权声明与协议全文（随包 `LICENSE-HONOR-Sans.txt`）
  - 必须在软件中作显著声明（prominent notice）—— 已在 index.html 页脚「字体署名」段落实
- 内嵌文件：`fonts.css` 中的 HONORSansVFCN.ttf（27,503,428 字节）与 HONORSansVFNormal.ttf
- 未修改性由 `testscript/t_fonts.js` D 段逐字节比对官方 TTF 验证
