# 加密工具箱 · 版本与算法参数手册

> 本文件由 `dist/_genver.js` 从运行期 `ALGOS` 实测导出，**不是手工维护**。
> 重新生成：`cd dist && node _genver.js && node _genver_md.js`

## 一、版本信息

| 项 | 值 |
|---|---|
| **当前版本** | **v2.16.2**（b152） |
| 版本规则 | `版本规则.md`（SemVer，无代号） |
| 正式名称 | `Laevatain_sky's Cryptography Toolbox` |
| 生成时间 | 2026-10-28 14:06:04 CST |
| 算法条目总数 | **450** |
| index.html 引用脚本数 | 129 |
| 交付包 md5 | `1482a4619d86bb5348491eb2943a5e78` |
| CHANGELOG 批次数 | 238 |

校验方式：解压后在 `index.html` 同级执行 `node testscript/t_ivbox.js` 等任一脚本，
条目总数应与上表一致。

### 版本递增规则（摘要，完整版见 `版本规则.md`）

格式 `vMAJOR.MINOR.PATCH+b<批次>`，每批只递增一次，取最高优先级类别：

| 类别 | 触发 | 例 |
|---|---|---|
| **MAJOR** | 删除/重命名已发布条目、改输入输出语义、改默认输出格式、架构变更致旧包不可用 | AEGIS 24 条合并为 12 条 |
| **MINOR** | 新增算法条目、新增模式/标签长度/参数选项 | 本批新增 SHACAL-1 |
| **PATCH** | 修 bug、性能与内存优化、补测试与向量、文档与文案 | SIMECK 轮常量污染修复 |

版本号**不含任何代号**；`+b<批次>` 仅溯源、不参与比较。真源 `VERSION`，
页面经 `version.js` 读取，**index.html 内禁止硬编码版本号**。

## 二、分组统计

| 分组 | 条目数 |
|---|---:|
| 编码 | 26 |
| 单向哈希 | 94 |
| 对称加密 | 137 |
| 非对称加密 | 39 |
| 数字签名 | 9 |
| 密钥工具 | 6 |
| 古典密码 | 6 |
| 校验和 | 10 |
| 后量子密码 | 71 |
| 椭圆曲线与高级代数 | 23 |
| 分布式与门限密码 | 4 |
| 认证加密 | 19 |
| 密钥派生 | 3 |
| 后量子 | 3 |
| **合计** | **450** |

## 三、各算法使用的参数

> `块` = 分组长度；`密钥` = 密钥长度（字节）；`IV/nonce` 与 `标签` 取自条目说明。
> 分组密码（**对称加密**组）的 IV 由模式层自动生成并前置，条目本身不单独声明。

### 编码（26）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `base64` | Base64 | — | — | — | 标准 Base64 编码，输入文本按 UTF-8 处理。 |
| `base32` | Base32 | — | — | — | RFC 4648 Base32 编码。 |
| `base58` | Base58 | — | — | — | 比特币风格 Base58。 |
| `base85` | Base85 (ASCII85) | — | — | — | ASCII85 编码。 |
| `url` | URL 编码 | — | — | — | encodeURIComponent / decodeURIComponent。 |
| `html` | HTML 实体 | — | — | — | 转义 & < > " 单引号。 |
| `unicode` | Unicode 转义序列 | — | — | — | \uXXXX 形式。 |
| `hex` | 16 进制编码 | — | — | — | 每字节两位 Hex。 |
| `rot13` | ROT13 | — | — | — | 字母旋转 13。 |
| `caesar` | ASCII 移位 / 凯撒 | — | — | — | 仅对字母移位。 |
| `morse` | 摩尔斯电码 | — | — | — | 字母间用空格，词间用 / 分隔。 |
| `binary` | 二进制 | — | — | — | 每字节 8 位二进制。 |
| `octal` | 八进制 | — | — | — | 每字节 3 位八进制。 |
| `base45` | Base45 | — | — | — | RFC 草案 Base45，二维码疫苗证书用。2 字节→3 字符，1 字节→2 字符。 |
| `base62` | Base62 | — | — | — | 0-9a-zA-Z 共 62 字符，常用于短链接。 |
| `base91` | basE91 | — | — | — | basE91（Joachim Henke），比 Base64 更省空间，输出含符号。 |
| `rot47` | ROT47 | — | — | — | ASCII 33~126 范围内旋转 47 位，含数字与符号。 |
| `quoted-printable` | Quoted-printable | — | — | — | RFC 2045 邮件编码。非可打印字节写成 =XX，行末空格与 TAB 也会转义。 |
| `uuencode` | UUEncode | — | — | — | 传统 Unix 二进制编码，含 begin/end 包裹行。 |
| `punycode` | Punycode | — | — | — | RFC 3492，国际化域名编码（输入 Unicode 文字，输出 xn-- 后的部分）。 |
| `base64url` | Base64url | — | — | — | RFC 4648 §5，URL/文件名安全变体（- 与 _，无填充 =），JWT 用。 |
| `cbor` | CBOR（RFC 8949） | — | — | — | CBOR 是 RFC 8949 定义的结构化二进制编码（JSON 的二进制版）。加密方向：把输入的诊断表示（如 [1, {a: 2}, h'0102']）编码为 CBOR，输出十六进制；解密方向：解析十六进制 CB… |
| `bech32` | Bech32 地址编码（BIP-173） | — | — | — | Bech32 地址编码（BIP-173，比特币原生隔离见证地址用）。加密：输入 Hex，参数栏填人类可读前缀（如 bc）→ 输出 bech32；解密：输入 bech32 → 输出前缀与数据 Hex。向量来自 BIP… |
| `bech32m` | Bech32m 地址编码（BIP-350） | — | — | — | Bech32m 地址编码（BIP-350），校验和常量改为 0x2bc830a3，用于 Taproot 等见证版本 1+。用法同 Bech32。⚠ 与 Bech32 不兼容：同一数据用两种编码得到的串不同。 |
| `bip39-mnemonic` | BIP-39 助记词 | — | — | — | BIP-39 助记词（比特币/以太坊钱包标准）。加密：输入熵 Hex（16/20/24/28/32 字节）→ 12~24 个助记词；解密：输入助记词 → 还原熵并校验校验和，篡改会报错。词表为 bitcoin/bi… |
| `base58check` | Base58Check 编码（比特币地址） | — | — | — | 在 Base58 基础上追加 4 字节校验和（SHA-256d 的前 4 字节），用于比特币地址与 WIF 私钥。 【验证】Botan base58c.vec 官方向量 4/4（含空输入 → 3QJmnh）。 【说… |

### 单向哈希（94）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `md5` | MD5 | — | — | — | 128 位摘要。 |
| `sha1` | SHA-1 | — | — | — | 160 位摘要。 |
| `sha224` | SHA-224 | — | — | — | SHA-2 家族，224 位摘要（纯 JS 实现）。 |
| `sha256` | SHA-256 | — | — | — | SHA-2 家族，最常用。 |
| `sha384` | SHA-384 | — | — | — | SHA-2 家族。 |
| `sha512` | SHA-512 | — | — | — | SHA-2 家族。 |
| `sha3-224` | SHA-3-224 | — | — | — | FIPS 202 的 SHA-3 224 位变体，rate=144。 |
| `sha3-256` | SHA-3-256 | — | — | — | Keccak 标准，纯 JS 实现。 |
| `sha3-384` | SHA-3-384 | — | — | — | FIPS 202 的 SHA-3 384 位变体，rate=104。 |
| `sha3-512` | SHA-3-512 | — | — | — | Keccak 标准，纯 JS 实现。 |
| `blake2s` | BLAKE2s-256 | — | — | — | 纯 JS 实现。 |
| `sm3` | SM3 | — | — | — | 中国商用哈希标准。 |
| `blake3` | BLAKE3-256 | — | — | — | BLAKE3：比 BLAKE2 更快，原生支持密钥模式与密钥派生。已与官方参考实现逐条比对通过（22 组，含 1024/2048/4096 等多块树哈希边界）。 |
| `blake2b` | BLAKE2b-512 | — | — | — | BLAKE2b（RFC 7693），比 SHA-2 更快且安全性更强，默认输出 64 字节。 |
| `ripemd160` | RIPEMD-160 | — | — | — | 160 位摘要，比特币地址生成中使用（与 SHA-256 串联）。 |
| `hmac` | HMAC 消息认证码 | — | — | — | 密钥化哈希，用于验证消息完整性与真实性。输入为待认证消息。 |
| `pbkdf2` | PBKDF2 密钥派生 | — | — | — | 口令派生密钥（PBKDF2-HMAC-SHA256）。输入栏填口令，输出 32 字节派生密钥。 |
| `hkdf` | HKDF 密钥派生 | — | — | — | HKDF-SHA256（RFC 5869）。输入栏填原始密钥材料 IKM，输出派生的密钥。 |
| `scrypt` | scrypt 口令派生 | — | — | — | 抗 ASIC 的内存困难型口令派生函数（RFC 7914）。N 越大越慢越安全；为免卡死，浏览器上限 N=32768。 |
| `streebog256` | Streebog-256 | — | — | — | 俄罗斯国家标准哈希 GOST R 34.11-2012，256 位摘要。常量表由 gostcrypto 权威实现导出。 |
| `streebog512` | Streebog-512 | — | — | — | 俄罗斯国家标准哈希 GOST R 34.11-2012，512 位摘要。 |
| `shake128` | SHAKE128（可扩展输出） | — | — | — | SHA-3 家族的可扩展输出函数（XOF），可输出任意长度。 |
| `shake256` | SHAKE256（可扩展输出） | — | — | — | SHA-3 家族的可扩展输出函数（XOF），强度高于 SHAKE128。 |
| `cshake128` | cSHAKE128（可定制） | — | — | — | NIST SP 800-185 的可定制 XOF。输入栏填消息，密钥栏填定制串 S，参数栏填输出字节数。 |
| `cshake256` | cSHAKE256（可定制） | — | — | — | NIST SP 800-185 的可定制 XOF，强度高于 cSHAKE128。 |
| `cmac` | CMAC-AES 消息认证码 | — | — | — | 基于分组密码的 MAC（NIST SP 800-38B），适合只有 AES 硬件加速的场景。输入栏填消息。 |
| `kmac128` | KMAC128 | — | — | — | NIST SP 800-185 的 Keccak MAC，带密钥与定制串，比 HMAC 更适合作为 KDF。输入栏填消息。 |
| `kmac256` | KMAC256 | — | — | — | NIST SP 800-185 的 Keccak MAC，强度高于 KMAC128。输入栏填消息。 |
| `argon2id` | Argon2id | — | — | — | 推荐默认：前一半抗侧信道、后一半抗 GPU。RFC 9106 内存硬 KDF，抗 ASIC/GPU 暴力破解，强于 PBKDF2 与 scrypt。 |
| `argon2i` | Argon2i | — | — | — | 数据无关访问，抗侧信道攻击。RFC 9106 内存硬 KDF，抗 ASIC/GPU 暴力破解，强于 PBKDF2 与 scrypt。 |
| `argon2d` | Argon2d | — | — | — | 数据相关访问，抗 GPU 破解最强。RFC 9106 内存硬 KDF，抗 ASIC/GPU 暴力破解，强于 PBKDF2 与 scrypt。 |
| `poly1305` | Poly1305 消息认证码 | — | — | — | RFC 8439 的一次性 MAC，速度极快。输入栏填消息，密钥栏填 32 字节密钥（64 位 Hex）。注意：同一密钥绝对不能重复使用。 |
| `md4` | MD4（已不安全） | — | — | — | RFC 1320，128 位摘要。已严重不安全（可在数秒内构造碰撞），仅供兼容旧系统或学习使用，不要用于任何安全场景。 |
| `sha512-224` | SHA-512/224 | — | — | — | FIPS 180-4 定义的 SHA-512 截短变体，224 位摘要。在 64 位平台上比 SHA-224 更快，且抗长度扩展攻击。 |
| `sha512-256` | SHA-512/256 | — | — | — | FIPS 180-4 定义的 SHA-512 截短变体，256 位摘要。64 位平台上比 SHA-256 更快，抗长度扩展攻击。 |
| `zuc-eia3` | ZUC-128-EIA3（LTE 完整性算法） | — | — | ✅ | ZUC-128-EIA3（GM/T 0001.3-2012，等同 3GPP 128-EIA3）：带密钥的消息认证码，输出 32 位 MAC-I。按消息比特逐位累加滑动窗口密钥字 k_i，可与 EEA3 配套做完整性… |
| `whirlpool` | Whirlpool-512 | — | — | — | Whirlpool-512 摘要算法（ISO/IEC 10118-3），设计者 Rijmen 与 Barreto。 【验证】ISO/NESSIE 官方向量 10/10（含一百万次字母 a）。 |
| `hotp` | HOTP 一次性口令（RFC 4226） | — | — | — | 基于计数器的事件型一次性口令（RFC 4226）。每认证一次计数器 +1，服务端需容忍少量超前窗口。密钥优先按 Base32 解析；原样 ASCII 请用 raw: 前缀，十六进制用 hex: 前缀。 |
| `totp` | TOTP 时间型口令（RFC 6238） | — | — | — | 基于时间的一次性口令（RFC 6238），Google/微软验证器即此。默认 6 位、30 秒步长、HMAC-SHA1。参数栏留空即取当前时间；填 Unix 时间可复现确定值。 |
| `siphash-24` | SipHash-2-4（带密钥 PRF） | — | — | — | SipHash-2-4 带密钥伪随机函数，用于哈希表防碰撞（Python/Rust/Redis 同款）。16 字节密钥 + 消息 → 64 位摘要。它不是加密哈希，不能替代 SHA-256。 |
| `siphash-13` | SipHash-1-3（快速变体） | — | — | — | SipHash-1-3：压缩 1 轮、终结 3 轮，比 2-4 快约一倍，安全性略低（仍远高于普通非加密哈希）。适合对延迟极敏感的场景。 |
| `kasumi_f9` | KASUMI f9（3GPP 完整性算法） | — | — | — | 3GPP TS 35.201 的 f9 完整性算法：基于 KASUMI 的 CBC-MAC，输出 32 位 MAC-I，用于 UMTS 信令完整性。填充为 COUNT‖FRESH‖MESSAGE‖DIRECTION… |
| `turboshake128` | TurboSHAKE128（12 轮 XOF） | — | — | — | RFC 9861 的 TurboSHAKE128：Keccak 轮数减半（12 轮）的可扩展输出函数，比 SHAKE128 约快一倍，安全强度 128 位。参数填输出长度，可选填域分隔字节 D（默认 1F）。 |
| `turboshake256` | TurboSHAKE256（12 轮 XOF） | — | — | — | RFC 9861 的 TurboSHAKE256：12 轮 Keccak，安全强度 256 位，速率 136 字节。比 SHAKE256 约快一倍。参数填输出长度，可选填域分隔字节 D（默认 1F）。 |
| `kt128` | KT128 / KangarooTwelve | — | — | — | RFC 9861 的 KT128（即 KangarooTwelve）：在 TurboSHAKE128 上做树哈希，可并行、长输入远快于串行哈希。输入超过 8192 字节走树模式（中间节点 0B、终节点 06）。定制… |
| `kt256` | KT256 | — | — | — | RFC 9861 的 KT256：KangarooTwelve 的 256 位强度版本，基于 TurboSHAKE256（速率 136，CV 长 64）。长输入走树哈希。定制串用于域分隔。 |
| `bcrypt` | bcrypt 口令哈希 | — | — | — | bcrypt 口令哈希（EksBlowfish）。加密：口令 + 参数栏「cost,salt22」生成散列；解密：把待验散列贴进输入、密钥栏填口令，输出 ✓/✗。cost 每 +1 耗时翻倍，建议 10~12（默认… |
| `merkle-root` | Merkle 树根（RFC 6962） | — | — | — | Merkle 树根（RFC 6962 结构，Certificate Transparency 所用）。输入区每行一个叶子（全为偶数位 Hex 时按字节解析，否则按文本）。叶子哈希 = SHA-256(0x00‖数据… |
| `merkle-proof` | Merkle 包含证明（RFC 6962） | — | — | — | Merkle 包含证明（RFC 6962）。输入区每行一个叶子；参数栏填「叶子序号,声称的树根Hex」（序号从 0 起）。输出该叶子的证明路径、重算树根，以及是否与声称值一致。 |
| `bip39-seed` | BIP-39 种子派生 | — | — | — | BIP-39 助记词 → BIP-32 根种子：PBKDF2-HMAC-SHA512(助记词, "mnemonic"+口令, 2048 轮, 64 字节)。输入助记词，参数栏填口令（官方向量用 "TREZOR"），… |
| `nhpoly1305` | NHPoly1305 泛哈希 | — | 1088B | — | NHPoly1305：Adiantum 使用的快速泛哈希（NH + 双 Poly1305），非抗碰撞哈希，仅用于加密构造内部。输出 16 字节（模 2^128 截断）。 |
| `blake2bp` | BLAKE2bp-512（并行） | — | — | — | BLAKE2 的 4 路并行变体，512 位摘要。消息按 128 字节块轮转分给 4 个叶子，各出 64 字节后由根节点汇总。官方 KAT 256 组（密钥 00..3f）全部通过。 |
| `blake2sp` | BLAKE2sp-256（并行） | — | — | — | BLAKE2 的 8 路并行变体，256 位摘要。消息按 64 字节块轮转分给 8 个叶子，各出 32 字节后由根节点汇总。官方 KAT 256 组全部通过。 |
| `ascon-xof128` | Ascon-XOF128（可扩展输出） | — | — | — | NIST SP 800-232 的可扩展输出函数，与 Ascon-Hash256 同结构（分块 8 字节、每块后 12 轮置换），但输出长度可任意指定。**参数栏填输出字节数**（十进制，1~4096，不填默认 3… |
| `ascon-cxof128` | Ascon-CXOF128（可定制 XOF） | — | — | — | 带定制串（customization string）的 Ascon-XOF128，同一消息配不同定制串可得到互不相关的输出流。**参数栏填「定制串Hex,输出字节数」**，例如 0a1b2c,64；只填数字则定制串… |
| `ascon-hash256` | Ascon-Hash256 | — | — | — | NIST SP 800-232 轻量级哈希标准，32 字节摘要。与 Ascon-128a 同源自 320 位置换。已通过官方 LWC KAT 1025 组。 |
| `tiger192` | Tiger-192（标准） | — | — | — | Tiger 是 Anderson 与 Biham 1995 年设计的 192 位哈希，为 64 位平台优化（设计时比 SHA-1 快）。输出 24 字节、3 轮。 【验证】Botan tiger.vec 官方向量 … |
| `tiger160` | Tiger-160（截断） | — | — | — | Tiger 的 160 位截断版本（取前 20 字节），3 轮。 【验证】Botan tiger.vec 官方向量 2/2（Tiger(20,3)）。 |
| `tiger128` | Tiger-128（截断） | — | — | — | Tiger 的 128 位截断版本（取前 16 字节），3 轮。 【验证】Botan tiger.vec 官方向量 2/2（Tiger(16,3)）。 |
| `skein512-224` | Skein-512-224 | — | — | — | Skein-512 的 224 位输出版本。Skein 是 Schneier 等设计的 SHA-3 竞赛算法，基于 Threefish-512 可调分组密码、用 UBI 模式串联，配置串为 ASCII "SHA3"… |
| `skein512-256` | Skein-512-256 | — | — | — | Skein-512 的 256 位输出版本。Skein 是 Schneier 等设计的 SHA-3 竞赛算法，基于 Threefish-512 可调分组密码、用 UBI 模式串联，配置串为 ASCII "SHA3"… |
| `skein512-384` | Skein-512-384 | — | — | — | Skein-512 的 384 位输出版本。Skein 是 Schneier 等设计的 SHA-3 竞赛算法，基于 Threefish-512 可调分组密码、用 UBI 模式串联，配置串为 ASCII "SHA3"… |
| `skein512-512` | Skein-512-512 | — | — | — | Skein-512 的完整 512 位输出版本。Skein 是 Schneier 等设计的 SHA-3 竞赛算法，基于 Threefish-512 可调分组密码、用 UBI 模式串联，配置串为 ASCII "SHA… |
| `skein512-512-test` | Skein-512(512,Test) | — | — | — | Skein-512-512 带个性化串 "Test" 的版本。Skein 是 Schneier 等设计的 SHA-3 竞赛算法，基于 Threefish-512 可调分组密码、用 UBI 模式串联，配置串为 ASC… |
| `pbkdf1` | PBKDF1（PKCS#5 v1.5，SHA-1） | — | — | — | PKCS#5 v1.5 的 PBKDF1：T1 = Hash(口令‖盐)，T(i) = Hash(T(i-1))，取末次结果前 20 字节。 【验证】Botan pbkdf/pbkdf1.vec 官方向量 6/6。… |
| `cbcmac-des` | CBC-MAC（DES） | — | — | — | 用 DES 做 CBC 加密并取最后一个密文块作为 MAC。状态初值全零，收尾不足一块时也加密一次（按 Botan 官方语义）。 【验证】Botan mac/cbcmac.vec 中 [CBC-MAC(DES)] … |
| `cbcmac-aes128` | CBC-MAC（AES-128） | — | — | — | 用 AES-128 做 CBC 加密并取最后一个密文块作为 MAC。 【验证】Botan mac/cbcmac.vec 中 [CBC-MAC(AES-128)] 段官方向量全过。 【注意】CBC-MAC 只对【定长… |
| `x919-mac` | ANSI X9.19 MAC（零售 MAC） | — | — | — | ANSI X9.19「零售 MAC」：先用 K1 走 DES CBC-MAC，最后 mac = DES1( DES2⁻¹( state ) )。密钥 16 字节时 K2 取后 8 字节，8 字节时 K2 = K1。… |
| `kdf2` | KDF2（ISO 18033-2，SHA-1） | — | — | — | ISO/IEC 18033-2 的 KDF2：K = 串联 Hash(secret ‖ BE32(counter) ‖ label ‖ salt)，counter 从 1 开始。 【验证】Botan kdf/kdf… |
| `kdf1` | KDF1（ISO 18033-2，SHA-1） | — | — | — | ISO/IEC 18033-2 的 KDF1：K = Hash(secret ‖ label ‖ salt) 的前若干字节，【没有计数器】，因此最多只能产出一个摘要长度（SHA-1 为 20 字节）。 【验证】Bo… |
| `gmac` | GMAC（AES-GMAC 消息认证码） | — | — | — | GMAC 即「明文为空的 GCM」：tag = GHASH_H(消息‖长度块) ⊕ AES_K(J0)，H = AES_K(0^128)。 【验证】Botan mac/gmac.vec（源自 Bouncy Cast… |
| `sp800-108-ctr` | SP 800-108 KDF（计数器模式） | — | — | — | NIST SP 800-108 的 计数器模式 KDF，PRF 为 HMAC。 【验证】Botan kdf/sp800_108_ctr.vec（Bouncy Castle 生成）官方向量全过。 【参数】摘要名可选 … |
| `sp800-108-fb` | SP 800-108 KDF（反馈模式） | — | — | — | NIST SP 800-108 的 反馈模式 KDF，PRF 为 HMAC。 【验证】Botan kdf/sp800_108_fb.vec（Bouncy Castle 生成）官方向量全过。 【参数】摘要名可选 SH… |
| `sp800-108-pipe` | SP 800-108 KDF（流水线模式） | — | — | — | NIST SP 800-108 的 流水线模式 KDF，PRF 为 HMAC。 【验证】Botan kdf/sp800_108_pipe.vec（Bouncy Castle 生成）官方向量全过。 【参数】摘要名可选… |
| `pgp-s2k` | OpenPGP S2K 口令派生（RFC 4880） | — | — | — | OpenPGP 的字符串到密钥（S2K）：Hash(零填充‖(Salt‖口令) 循环至 max(迭代数,输入长))。 【验证】Botan pbkdf/pgp_s2k.vec（Golang x/crypto/open… |
| `hmac-drbg` | HMAC-DRBG（NIST SP 800-90A） | — | — | — | NIST SP 800-90A 的 HMAC-DRBG，给定熵即确定性输出。默认丢弃首次输出、返回第二次（同 Botan/NIST CAVS 流程）；填附加输入即按 CAVS 两次调用取第二次。 【验证】Botan… |
| `sp800-56a` | SP 800-56A 单步 KDF | — | — | — | NIST SP 800-56A §5.8.1 单步 KDF：每轮 Aux(计数器4字节大端‖Z‖OtherInfo)，逐轮拼接取前 N 字节。hash 模式 Aux 即哈希（忽略 salt），hmac 模式 Aux… |
| `sp800-56c` | SP 800-56C 两步 KDF | — | — | — | SP 800-56C 两步 KDF：先用 KDK=HMAC(salt,Z) 提取随机性，再展开。【关键】展开步不是 SP 800-56A，而是 SP 800-108 Feedback（Botan kdf.cpp 写… |
| `tls12-prf` | TLS 1.2 PRF（RFC 5246 §5） | — | — | — | TLS 1.2 PRF：P_hash(secret, label‖seed) 单哈希迭代，A(0)=seed′，A(i)=HMAC(A(i-1))，第 i 块=HMAC(A(i)‖seed′)。默认 SHA-256… |
| `tls-prf` | TLS PRF（TLS 1.0/1.1，MD5⊕SHA-1） | — | — | — | TLS 1.0/1.1 的 PRF（RFC 5246 §5 之前版本）：把预主密钥切成两半，S1 用 HMAC-MD5、S2 用 HMAC-SHA-1，两个 P_hash 输出【逐字节异或】。 【已废弃】MD5 已… |
| `x942-prf` | ANSI X9.42 PRF | — | — | — | ANSI X9.42 密钥派生 PRF：SHA-1(secret‖DER)，DER 内含密钥包装算法 OID、4 字节计数器、可选 salt、请求位数（8×输出字节数）。Botan 两组向量全通过。老式 KDF，常… |
| `bcrypt-pbkdf` | bcrypt-pbkdf（OpenSSH 口令派生） | — | — | — | OpenSSH 新格式私钥用的口令派生：以 SHA-512(pass) 为口令、SHA-512(salt‖BE32(块号)) 为盐，反复调用 bcrypt 风格 Blowfish 编排（workfactor=6、先… |
| `comb4p-md4md5` | Comb4P(MD4,MD5) 哈希组合器 | — | — | — | Mihir Bellare 的哈希组合器：两个哈希各自先 update(0) 再吸收消息，输出 h1^h2 后经两轮带轮号的再哈希，最终输出 h1‖h2（32 字节）。只要其中一个哈希是抗碰撞的，组合结果就抗碰撞。… |
| `comb4p-sha1rmd160` | Comb4P(SHA-1,RIPEMD-160) 哈希组合器 | — | — | — | 同上组合器，两个哈希换成 SHA-1 与 RIPEMD-160，输出 40 字节。 【验证】Botan hash/comp4p.vec 官方向量 2/2。 |
| `chacha-rng` | ChaCha_RNG（Botan 专有 DRBG） | — | — | — | Botan 自有 ChaCha_RNG：update 时 CK'=HMAC(HK,input)、HK'=ChaCha20(CK') 前 32 字节，输出即 ChaCha20 密钥流。 【调用顺序】注入熵、重播种、连… |
| `mtproto-authkeyid` | Telegram auth_key_id（auth_key→密钥标识） | — | — | — | auth_key_id = SHA1(auth_key)[12:20]（低 64 位）。官方规定 2.0 这里【仍然用 SHA-1】，因为密钥标识要与协议版本无关。附带输出 aux_hash=SHA1(auth_k… |
| `parallel-md5-sha1` | Parallel(MD5,SHA-160) 组合哈希 | — | — | — | MD5 与 SHA-1 并行计算（SHA-1 取自本文件内置实现，已通过标准自检）。输出 = 两个哈希结果直接拼接（不是分块交错）。仅用于兼容需要该组合格式的系统，安全性不超过其中较强的那个哈希。 |
| `parallel-sha256-512` | Parallel(SHA-256,SHA-512) 组合哈希 | — | — | — | SHA-256 与 SHA-512 并行计算，输出 96 字节。输出 = 两个哈希结果直接拼接（不是分块交错）。仅用于兼容需要该组合格式的系统，安全性不超过其中较强的那个哈希。 |
| `passhash9` | Passhash9 口令哈希（Botan $9$） | — | — | — | Botan 自有口令哈希，输出 $9$ 前缀 + base64(alg_id‖work_factor‖salt‖PBKDF2 24B)。迭代 = 10000×work_factor，默认 10 万次。work_fa… |
| `passhash9-verify` | Passhash9 校验（比对口令） | — | — | — | 把口令与 $9$ 串做恒定时间比对：解析出 alg_id、work_factor、salt 后重算 PBKDF2 并逐字节比较。用于验证 Passhash9 的输出，不匹配时抛错。官方向量 1/1。 |
| `gost3411` | GOST R 34.11-94（CryptoPro） | — | — | — | 俄罗斯旧版国家标准哈希（RFC 5831 / RFC 4357），256 位摘要，使用 CryptoPro 参数集 OID 1.2.643.2.2.31.1。实现蓝本 RHash 官方源码，psi 表达式自动提取；… |
| `gost3411tp` | GOST R 34.11-94（TestParam） | — | — | — | 同上，改用 RFC 4357 的 TestParam 参数集 OID 1.2.643.2.2.31.0。底层 GOST 28147-89 两套参数集均通过 Botan 官方分组向量 28/28。与 CryptoPr… |
| `ctr-drbg` | CTR-DRBG（NIST SP 800-90A） | — | — | — | NIST SP 800-90A 的 CTR-DRBG：以 AES-CTR 为内核的确定性随机数发生器。给定同样的熵/nonce/附加输入即得到同样的输出，因此只用于复现官方向量与教学。 【验证·实测】OpenSSL… |
| `hash-drbg` | Hash-DRBG（NIST SP 800-90A） | — | — | — | NIST SP 800-90A 的 Hash-DRBG：V/C 各 55 字节（440 bit，与摘要长度无关），生成时 V += H(0x03‖V) + C + 计数。给定同样的熵/nonce/附加输入即得到同样… |

### 对称加密（137）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `aes128` | AES-128 | 16B | 16B | — | AES-128 分组密码，支持 ECB/CBC/CFB/OFB/CTR，IV 自动生成并前置。 |
| `aes192` | AES-192 | 16B | 24B | — | AES-192 分组密码，支持 ECB/CBC/CFB/OFB/CTR。 |
| `aes256` | AES-256 | 16B | 32B | — | AES-256 分组密码，支持 ECB/CBC/CFB/OFB/CTR。 |
| `des` | DES | 8B | 8B | — | DES 分组密码，支持 ECB/CBC/CFB/OFB/CTR。 |
| `3des` | 3DES (Triple DES) | 8B | 24B | — | 3DES-EDE 分组密码，支持 ECB/CBC/CFB/OFB/CTR。 |
| `sm4` | SM4 | 16B | 16B | — | 中国商用分组密码，支持 ECB/CBC/CFB/OFB/CTR。 |
| `rc5` | RC5 | 8B | 16B | — | RC5-32/12/16，支持 ECB/CBC/CFB/OFB/CTR。 |
| `rc6` | RC6 | 16B | 16B | — | RC6-32/20/16，支持 ECB/CBC/CFB/OFB/CTR。 |
| `rc4` | RC4 | — | — | — | 流密码，密钥取自 SHA-256 全部 32 字节。 |
| `chacha20` | ChaCha20 | — | — | ✅ | 流密码，12 字节 nonce 前置。填了 Nonce 就用你给的，留空则随机生成——要与别的实现对齐时必须填。 |
| `blowfish` | Blowfish | 8B | 16B | — | Blowfish 分组密码，64 位块，16 轮 Feistel。支持 ECB/CBC/CFB/OFB/CTR，IV 自动生成并前置。π 常量（P 盒 18 项 + S 盒 1024 项）硬编码为标准的 8336 … |
| `idea` | IDEA | 8B | 16B | — | IDEA 分组密码，64 位块，8 轮。支持 ECB/CBC/CFB/OFB/CTR，IV 自动生成并前置。无固定 S 盒，密钥调度动态生成。 |
| `twofish128` | Twofish-128 | 16B | 16B | — | Twofish 分组密码（AES 候选算法），128 位块、16 轮 Feistel，128 位密钥。支持 ECB/CBC/CFB/OFB/CTR，IV 自动生成并前置。 |
| `twofish192` | Twofish-192 | 16B | 24B | — | Twofish 分组密码，192 位密钥变体。 |
| `twofish256` | Twofish-256 | 16B | 32B | — | Twofish 分组密码，256 位密钥变体。 |
| `seed` | SEED | 16B | 16B | — | SEED：韩国国家标准分组密码（RFC 4269 / TTAS.KO-12.0004），128 位块、128 位密钥、16 轮 Feistel。已与 RFC 附录 B 的 4 组官方向量及 OpenSSL 的 60… |
| `aria128` | ARIA-128 | 16B | 16B | — | ARIA：韩国国家标准分组密码（RFC 5794 / KS X 1213），128 位块、12 轮。S-box 与轮常数均由数学定义生成并与 RFC 原文对账。 |
| `aria192` | ARIA-192 | 16B | 24B | — | ARIA 分组密码，192 位密钥，14 轮。 |
| `aria256` | ARIA-256 | 16B | 32B | — | ARIA 分组密码，256 位密钥，16 轮。 |
| `camellia128` | Camellia-128 | 16B | 16B | — | Camellia 分组密码（CRYPTREC / NESSIE 选定，ISO/IEC 18033-3），128 位块、18 轮，128 位密钥。 |
| `camellia192` | Camellia-192 | 16B | 24B | — | Camellia 分组密码，192 位密钥，18 轮。 |
| `camellia256` | Camellia-256 | 16B | 32B | — | Camellia 分组密码，256 位密钥，24 轮。 |
| `tea` | TEA | 8B | 16B | — | Tiny Encryption Algorithm，64 位块、128 位密钥、32 轮 Feistel。教学用途为主，已知存在相关密钥攻击，不宜用于新系统。 |
| `xtea` | XTEA | 8B | 16B | — | eXtended TEA，修正了 TEA 的密钥调度弱点。64 位块、128 位密钥。 |
| `magma` | GOST Magma（RFC 8891） | 8B | 32B | — | 俄罗斯国家标准 GOST R 34.12-2015 的 64 位分组密码（原 GOST 28147-89），256 位密钥、32 轮 Feistel，S 盒固定为 param-Z。 |
| `xxtea` | XXTEA | — | — | — | Corrected Block TEA，变长块（按 32 位字处理），128 位密钥。适合短数据，不适合长消息。 |
| `aes-gcm` | AES-GCM（认证加密） | — | — | — | AEAD 认证加密：AES-256 的 GCM 模式，同时提供机密性与完整性。输出 = nonce(12) ／／ 密文 ／／ 标签(16)。解密时标签校验失败会直接报错。 |
| `chacha20-poly1305` | ChaCha20-Poly1305（认证加密） | — | — | — | RFC 8439 AEAD：ChaCha20 流密码 + Poly1305 认证。输出 = nonce(12) ／／ 密文 ／／ 标签(16)。在无 AES 硬件加速的设备上通常快于 AES-GCM。 |
| `serpent` | Serpent | 16B | 32B | — | AES 决赛算法之一，128 位块、32 轮 SPN 网络，安全性裕度高于 AES。S-box 为 bitslice 布尔函数形式（翻译自标准参考实现），已与参考实现逐位比对。 |
| `kuznyechik` | Kuznyechik（GOST R 34.12-2015） | 16B | 32B | — | 俄罗斯国家标准 128 位分组密码（与 64 位的 Magma 配套），256 位密钥、10 轮 SP 网络。常量表由 gostcrypto 权威实现导出。 |
| `aes-ccm` | AES-CCM（认证加密） | — | — | — | NIST SP 800-38C AEAD：CBC-MAC + CTR。常用于 WiFi WPA2、蓝牙 LE。输出 = nonce(13) ／／ 密文 ／／ 标签(16)。 |
| `aes-kw` | AES-KW（密钥包装 RFC 3394） | — | — | — | 专门用于「用一把密钥加密另一把密钥」。明文长度需 ≥16 且为 8 的倍数。输出比明文多 8 字节，自带完整性校验，篡改后解包会报错。 |
| `aes-kw-unwrap` | AES-KW 解包（unwrap 独立条目，RFC 3394） | — | — | — | AES-KW 的反向操作独立成条目：【加密】= 解包（输入被包装的密文，输出原始密钥），【解密】= 包装（输入原始密钥，输出包装密文）。与 aes-kw 条目方向相反，方便直接粘贴 CMS/PKCS#8 里的包装数… |
| `ff1` | FF1 格式保留加密 | — | — | — | FF1（NIST SP 800-38G）：格式保留加密，密文与明文【同长度、同字符集】。16 位卡号加密后仍是 16 位数字，适合无法改动字段类型的遗留系统。已通过 NIST 官方样本验证（AES-128/192，… |
| `aes-kwp` | AES-KWP（带填充密钥包装 RFC 5649） | — | — | — | AES-KW 的带填充变体，可接受任意 ≥1 字节的明文（AES-KW 要求 ≥16 且为 8 的倍数）。内部用 4 字节 MLI 记录真实长度，解包时校验 AIV 与填充。输出比填充后明文多 8 字节。 |
| `aes-siv` | AES-SIV（RFC 5297 确定性 AEAD） | — | — | — | 确定性认证加密：不需要 nonce，抗 nonce 误用（nonce 复用时不泄露明文异或）。输出 = V(16B)‖密文，密文与明文等长。密钥为 AES 密钥的两倍长。与 GCM-SIV（RFC 8452）不同，… |
| `salsa20` | Salsa20 | — | — | ✅ | Salsa20 流密码（eSTREAM 入选）。与 pycryptodome 逐字节一致。密钥 32 字节，nonce 8 字节。Nonce 可填在上方 IV 框，也可填在参数栏。 |
| `salsa20-12` | Salsa20/12（降轮变体） | — | — | ✅ | Salsa20 的 12 轮变体（DJB 定义，比 20 轮快约 40%）。libsodium 官方 core3.exp 与 stream5/stream6.exp 向量验收通过。密钥 32 字节、nonce 8 … |
| `salsa20-8` | Salsa20/8（降轮变体） | — | — | ✅ | Salsa20 的 8 轮变体（DJB 定义）。libsodium 官方 core3.exp 向量验收通过。**仅作教学与性能测试用途**：8 轮对差分攻击的抵抗明显不足，不要在任何安全场景使用。密钥 32 字节、… |
| `ff3` | FF3 格式保留加密 | — | — | — | FF3（NIST SP 800-38G）：16 位卡号加密后仍是 16 位数字。⚠ 原始 FF3 已被 NIST 于 2025 年移除（tweak 调度攻击），遗留数据解密可用，新系统请用 FF1。 |
| `ff3-1` | FF3-1 格式保留加密 | — | — | — | FF3-1（NIST SP 800-38G Rev.1）：FF3 的修订版，把 tweak 从 64 位缩到 56 位以修复小域攻击。加密后保持原长度与原字符集（如卡号仍是卡号）。已通过 ACVP 官方 18 条向… |
| `aes-gcm-siv` | AES-GCM-SIV | — | 16B | — | AES-GCM-SIV（RFC 8452）：抗 nonce 误用的 AEAD。nonce 复用时只泄露「两段明文是否相同」，不像 GCM 那样直接泄露明文异或。输出 = 密文‖tag(16B)。 |
| `hctr2` | HCTR2 长度保持加密 | — | 16B | — | HCTR2：长度保持的【宽块】加密，改 1 字节整个消息全变（XTS 是窄块，只影响 16 字节）。用于磁盘/文件加密。密文长度 = 明文长度，明文至少 16 字节。 |
| `cast5` | CAST5 / CAST-128 | 8B | 16B | — | CAST5（RFC 2144，也称 CAST-128）：16 轮 Feistel，三种轮函数 f1/f2/f3 循环使用，固定 128 位密钥。⚠ 已不推荐新系统使用。 |
| `rc2` | RC2 | 8B | 16B | — | RC2（RFC 2268）：64 位块密码，本实现固定 128 位密钥 / 1024 位有效密钥长度（pycryptodome 默认值）。⚠ 已过时且不安全，仅用于解密遗留数据。 |
| `gost28147` | GOST 28147-89 / Magma | 8B | 32B | — | GOST 28147-89（GOST R 34.12-2015 中称 Magma）：64 位块、256 位密钥、32 轮 Feistel。S 盒为 TC26 版本（非 RFC 4357 的 CryptoPro 版）… |
| `cast6` | CAST-256 / CAST6 | 16B | 32B | — | CAST-256（RFC 2612），CAST-128 的 128 位块继任者，48 轮（12 个 quad-round）。支持 ECB/CBC/CFB/OFB/CTR。已被 AES 淘汰，此处主要用于兼容历史数据。 |
| `zuc` | ZUC-128（国密流密码） | — | — | ✅ | ZUC-128（GM/T 0001-2012）：3GPP EEA3 / 128-EIA3 使用的密钥流生成器，中国商用流密码标准。密钥 16 字节、IV 16 字节。已与 gmalg 及一个独立 C++ 实现交叉验… |
| `zuc-eea3` | ZUC-128-EEA3（LTE 机密性算法） | — | — | ✅ | ZUC-128-EEA3（GM/T 0001.2-2012，等同 3GPP 128-EEA3）：用 CK 与 COUNT/BEARER/DIRECTION 构造 IV 驱动 ZUC 密钥流，明文按位异或。流密码，加… |
| `eme2` | EME2-AES-128 宽块加密 | — | 48B | — | EME2：IEEE 1619.2 宽块加密，改 1 比特整个消息全变。磁盘扇区加密用，AD 通常填 LBA。密钥 48 字节，长度保持（密文=明文长度）。 |
| `xcb` | XCB-AES-128 宽块加密 | — | 16B | — | XCB：IEEE 1619.2 宽块加密（Feistel＋泛哈希＋CTR），密钥 16 字节，长度保持，明文需 16 的倍数且≥32 字节，参数填关联数据 AD。⚠ 有公开密码学批评（FSE 2013《XCB is… |
| `cbc-essiv` | CBC-ESSIV（磁盘扇区） | — | 16B | — | CBC-ESSIV：dm-crypt/LUKS 磁盘加密的 IV 方案，IV = AES(SHA256(密钥), LBA小端)，防同一明文在不同扇区产生相同密文的水印攻击。⚠ 无官方向量，仅按语义实现。 |
| `aes-xts-128` | AES-XTS-128（磁盘扇区加密） | — | — | — | IEEE 1619 磁盘加密模式，BitLocker / FileVault / LUKS 使用。同一明文在不同扇区产生不同密文——这是它防"水印攻击"的关键。已与 OpenSSL（Python cryptogra… |
| `aes-xts-256` | AES-XTS-256（磁盘扇区加密） | — | — | — | AES-256 版本 XTS，密钥 64 字节。已与 OpenSSL（Python cryptography）交叉验证。 |
| `simon64-96` | Simon-64/96（NSA 轻量分组密码） | 8B | 12B | — | NSA 2013 年轻量分组密码 Simon，64 位块 / 96 位密钥 / 42 轮（轮数随参数集变，不是常数）。轮函数只用与/异或/循环移位。官方向量：Crypto++ TestVectors/simon.t… |
| `simon64-128` | Simon-64/128（NSA 轻量分组密码） | 8B | 16B | — | NSA 2013 年轻量分组密码 Simon，64 位块 / 128 位密钥 / 44 轮（轮数随参数集变，不是常数）。轮函数只用与/异或/循环移位。官方向量：Crypto++ TestVectors/simon.… |
| `simon128` | Simon-128/128（NSA 轻量分组密码） | 16B | 16B | — | NSA 2013 年轻量分组密码 Simon，128 位块 / 128 位密钥 / 68 轮（轮数随参数集变，不是常数）。轮函数只用与/异或/循环移位。官方向量：Crypto++ TestVectors/simon… |
| `simon128-192` | Simon-128/192（NSA 轻量分组密码） | 16B | 24B | — | NSA 2013 年轻量分组密码 Simon，128 位块 / 192 位密钥 / 69 轮（轮数随参数集变，不是常数）。轮函数只用与/异或/循环移位。官方向量：Crypto++ TestVectors/simon… |
| `simon128-256` | Simon-128/256（NSA 轻量分组密码） | 16B | 32B | — | NSA 2013 年轻量分组密码 Simon，128 位块 / 256 位密钥 / 72 轮（轮数随参数集变，不是常数）。轮函数只用与/异或/循环移位。官方向量：Crypto++ TestVectors/simon… |
| `speck64-96` | SPECK-64/96（NSA 轻量分组密码） | 8B | 12B | — | NSA 2013 年轻量分组密码 SPECK，64 位块 / 96 位密钥 / 26 轮（轮数随参数集变；姊妹算法 Simon 在同样块长下轮数更多）。轮函数只用加法/异或/循环移位，软件实现通常比 Simon 快… |
| `speck64-128` | SPECK-64/128（NSA 轻量分组密码） | 8B | 16B | — | NSA 2013 年轻量分组密码 SPECK，64 位块 / 128 位密钥 / 27 轮（轮数随参数集变；姊妹算法 Simon 在同样块长下轮数更多）。轮函数只用加法/异或/循环移位，软件实现通常比 Simon … |
| `speck128` | SPECK-128/128（NSA 轻量分组密码） | 16B | 16B | — | NSA 2013 年轻量分组密码 SPECK，128 位块 / 128 位密钥 / 32 轮（轮数随参数集变；姊妹算法 Simon 在同样块长下轮数更多）。轮函数只用加法/异或/循环移位，软件实现通常比 Simon… |
| `speck128-192` | SPECK-128/192（NSA 轻量分组密码） | 16B | 24B | — | NSA 2013 年轻量分组密码 SPECK，128 位块 / 192 位密钥 / 33 轮（轮数随参数集变；姊妹算法 Simon 在同样块长下轮数更多）。轮函数只用加法/异或/循环移位，软件实现通常比 Simon… |
| `speck128-256` | SPECK-128/256（NSA 轻量分组密码） | 16B | 32B | — | NSA 2013 年轻量分组密码 SPECK，128 位块 / 256 位密钥 / 34 轮（轮数随参数集变；姊妹算法 Simon 在同样块长下轮数更多）。轮函数只用加法/异或/循环移位，软件实现通常比 Simon… |
| `kasumi_f8` | KASUMI f8（3GPP 机密性算法） | — | — | — | 3GPP TS 35.201 的 f8 机密性算法：以 KASUMI 为核心的类 OFB 流密码，用于 UMTS 空口加密。初始化用 CK⊕0x55… 修正密钥，生成密钥流改用原始 CK。已用 TS 35.203 … |
| `mars128` | MARS-128 | 16B | 16B | — | MARS：IBM 提交的 AES 决赛候选算法，128 位块、16 轮核心混合，128 位密钥变体。结构为 8 轮前向混合 + 16 轮核心（含数据相关旋转与 32 位乘法）+ 8 轮后向混合。已用 Crypto+… |
| `mars192` | MARS-192 | 16B | 24B | — | MARS 分组密码，192 位密钥变体（24 字节）。 |
| `mars256` | MARS-256 | 16B | 32B | — | MARS 分组密码，256 位密钥变体（32 字节）。 |
| `gift64` | GIFT-64（轻量分组密码） | 8B | 16B | — | CHES 2017 提出的轻量分组密码，块 64 位、密钥 128 位、28 轮。与 GIFT-128 同族，是 PRESENT 的改进版。已用官方测试向量（含每轮中间状态）验证。 |
| `gift128` | GIFT-128（轻量分组密码） | 16B | 16B | — | CHES 2017 轻量分组密码，块 128 位、密钥 128 位、40 轮。S 盒 4 位、比特置换为「源→目的」方向，轮常数只作用于固定 6 个比特位加最高位。官方三组向量全过。 |
| `shacal2` | SHACAL-2（SHA-256 压缩函数分组密码） | 32B | 64B | — | 基于 SHA-256 压缩函数的分组密码，块 256 位、密钥最长 512 位（不足补零）。加密即压缩函数终值（不加初值），解密为其逆推。NESSIE 收录，ISO/IEC 18033-3。 |
| `shacal1` | SHACAL-1（SHA-1 压缩函数分组密码） | 20B | 64B | — | 基于 SHA-1 压缩函数的分组密码，块 160 位、密钥最长 512 位（不足补零，建议不少于 128 位）。明文当链接变量、密钥当消息块，80 轮后输出终值且**不做** feed-forward 加法 —— … |
| `noekeon` | NOEKEON（轻量分组密码） | 16B | 16B | — | Daemen 等设计的 128 位分组密码，16 轮。gamma 与 theta 均为对合，故加解密共用函数；区别在加密用 EK、解密用 DK，轮常数 17 个反向使用。Botan 向量 1030 组全过。 |
| `misty1` | MISTY1（NESSIE 认证分组密码） | 8B | 16B | — | 三菱电机设计，64 位块 / 128 位密钥，8 轮 Feistel 变体，含 FL/FO/FI 三层与 7 位、9 位两个 S 盒。NESSIE 认证算法，也是 KASUMI 的前身。 |
| `kasumi` | KASUMI（3GPP 分组密码） | 8B | 16B | — | 3GPP TS 35.202 定义的 64 位块分组密码，由 MISTY1 改造而来，用于 UMTS/LTE 的 f8 加密与 f9 完整性。已通过 3GPP 官方测试集。 |
| `skipjack` | SKIPJACK（NSA，1998 解密） | 8B | 10B | — | NSA 1987 年为 Clipper 芯片设计的 64 位块 / 80 位密钥算法，32 轮非平衡 Feistel，Rule A/B 交替。1998 年解密公开。已用 NIST 规范第 18 页的 32 轮全部中… |
| `present80` | PRESENT-80（超轻量分组密码） | 8B | 10B | — | CHES 2007 提出的超轻量 SPN 分组密码，块 64 位、密钥 80 位（10 字节）、31 轮，每轮 addRoundKey → 4 位 S 盒 → 比特置换 pLayer，最后再白化一次。ISO/IEC… |
| `present128` | PRESENT-128（超轻量分组密码） | 8B | 16B | — | PRESENT 的 128 位密钥版本（16 字节），31 轮。密钥更新与 80 位版有一处关键差异：最高**两个** nibble 各过一次 S 盒，且轮计数器异或位置不同（k66..k62，不是 k19..k1… |
| `skinny128-256` | SKINNY-128-256（轻量可调分组密码） | 16B | 32B | — | SKINNY 是 CHES/CRYPTO 2016 提出的轻量可调分组密码（Beierle 等），块 128 位、tweakey 256 位（32 字节，内部视为 TK1／／TK2）、48 轮，是 Romulus … |
| `skinny64-128` | SKINNY-64-128（轻量可调分组密码） | 8B | 16B | — | SKINNY 的 64 位块版本，tweakey 128 位（16 字节，内部 TK1／／TK2）、36 轮，4 位 S 盒。与 128 位版差异：4 位 S 盒、4 位 LFSR。⚠ 两个版本**都**有 sta… |
| `qarma64-r7` | QARMA-64（7 轮，ARM 指针认证同族） | 8B | 24B | — | QARMA-64 是 Avanzi 提出的轻量可调分组密码（IACR ePrint 2016/444 / ToSC 2017），ARMv8.3-A 指针认证（PAC）即基于该族。块 64 位、密钥 128 位（w0… |
| `qarma64-r6` | QARMA-64（6 轮） | 8B | 24B | — | QARMA-64 的 6 轮版本，其余参数与 7 轮版相同。已过论文 check_box 官方向量（r=6），并与编译后的 C 参考实现做随机差分比对。密钥栏填 24 字节 Hex：w0 ‖ k0 ‖ tweak。 |
| `qarma64-r5` | QARMA-64（5 轮） | 8B | 24B | — | QARMA-64 的 5 轮版本（ARM PAC 实际使用轮数即在此族内），其余参数与 7 轮版相同。已过论文 check_box 官方向量（r=5），并与编译后的 C 参考实现做随机差分比对。密钥栏填 24 字节… |
| `lea128` | LEA-128（韩国 KS X 3246 轻量分组） | 16B | 16B | — | 韩国 KISA 2013 年发布的轻量分组密码，128 位块 / 128 位密钥 / 24 轮。纯 ARX 结构（加法+异或+循环移位，无 S 盒），在通用处理器上比 AES 快。官方向量：Crypto++ Tes… |
| `lea192` | LEA-192（韩国 KS X 3246 轻量分组） | 16B | 24B | — | LEA 的 192 位密钥版本，128 位块 / 28 轮，密钥调度用 6 条 delta 链。官方向量：Crypto++ TestVectors/lea.txt 10 条全过。 |
| `lea256` | LEA-256（韩国 KS X 3246 轻量分组） | 16B | 32B | — | LEA 的 256 位密钥版本，128 位块 / 32 轮。注意：256 位的密钥调度与 128/192 【结构不同】——不是每轮更新 8 条链，而是 8 条链 × 24 步、落点 rkey[c+8t]，因此不能套… |
| `hight` | HIGHT（韩国 ISO/IEC 29192-2 超轻量） | 8B | 16B | — | 韩国 KISA 超轻量分组密码，64 位块 / 128 位密钥 / 32 轮，8 位字节上的 ARX。面向极低硬件成本场景（RFID、传感器）。官方向量：Crypto++ TestVectors/hight.txt… |
| `simeck32` | SIMECK-32/64（Simon 简化变体） | 4B | 8B | — | SIMECK-32/64：32 位块 / 64 位密钥 / 32 轮，16 位字运算。轮函数只用与、异或、循环移位，是 Simon 的极简变体。官方向量：Crypto++ TestVectors/simeck.tx… |
| `simeck64` | SIMECK-64/128（Simon 简化变体） | 8B | 16B | — | SIMECK-64/128：64 位块 / 128 位密钥 / 44 轮，32 位字运算。轮函数只用与、异或、循环移位。官方向量：Crypto++ TestVectors/simeck.txt 10 条全过。字节序… |
| `cham64` | CHAM-64/128（韩国轻量分组密码） | 8B | 16B | — | CHAM-64/128：64 位块 / 128 位密钥 / 80 轮，16 位字 ARX。官方向量：Crypto++ TestVectors/cham.txt 10 条全过。字节序【大端】。 |
| `cham128` | CHAM-128/128（韩国轻量分组密码） | 16B | 16B | — | CHAM-128/128：128 位块 / 128 位密钥 / 80 轮，32 位字 ARX。官方向量：Crypto++ TestVectors/cham.txt 全过。字节序【大端】。 |
| `cham128-256` | CHAM-128/256（韩国轻量分组密码） | 16B | 32B | — | CHAM-128/256：128 位块 / 256 位密钥 / 96 轮（密钥更长时轮数从 80 增到 96）。官方向量：Crypto++ TestVectors/cham.txt 全过。字节序【大端】。 |
| `clefia128` | CLEFIA-128（索尼轻量分组，ISO 29192-2） | 16B | 16B | — | CLEFIA 是索尼 2007 年发布的 128 位块轻量分组密码，入选 ISO/IEC 29192-2 与日本 CRYPTREC。18 轮，4 分支 Type-2 广义 Feistel，双 S 盒 + DSM（两… |
| `clefia192` | CLEFIA-192（索尼轻量分组） | 16B | 24B | — | CLEFIA 的 192 位密钥版本，22 轮。密钥调度与 128 位【结构不同】：先把 24 字节补成 32 字节（后 8 字节 = 前 8 字节取反），再用 8 分支 GFN_{8,10} 生成 L，轮密钥在 … |
| `clefia256` | CLEFIA-256（索尼轻量分组） | 16B | 32B | — | CLEFIA 的 256 位密钥版本，26 轮，密钥调度同 192 位结构（GFN_{8,10} + LL/LR 交替）。官方向量：RFC 6114 / 规范 v1.0 附录 A 全过。 |
| `kalyna128` | Kalyna-128/128（乌克兰国标 DSTU 7624） | 16B | 16B | — | Kalyna：乌克兰国家标准分组密码（DSTU 7624:2014），128 位块 / 128 位密钥。结构与 AES 同族（SubBytes-ShiftRows-MixColumns），但用 4 个不同 S 盒、… |
| `kalyna128-256` | Kalyna-128/256（乌克兰国标 DSTU 7624） | 16B | 32B | — | Kalyna 128 位块 / 256 位密钥（14 轮）。nk(4) != nb(2)，密钥扩展一次循环要填两个偶数轮密钥，是最容易漏写一半的参数集。。轮数：128 位密钥 10 轮、256 位 14 轮、512… |
| `kalyna256` | Kalyna-256/256（乌克兰国标 DSTU 7624） | 32B | 32B | — | Kalyna 256 位块 / 256 位密钥（14 轮）。块是 32 字节，是 AES 的两倍。。轮数：128 位密钥 10 轮、256 位 14 轮、512 位 18 轮。参照物是 Kalyna 官方参考 C … |
| `kalyna256-512` | Kalyna-256/512（乌克兰国标 DSTU 7624） | 32B | 64B | — | Kalyna 256 位块 / 512 位密钥（18 轮）。nk(8) != nb(4)，同属"一次循环填两个偶数轮密钥"的情形。。轮数：128 位密钥 10 轮、256 位 14 轮、512 位 18 轮。参照物… |
| `kalyna512` | Kalyna-512/512（乌克兰国标 DSTU 7624） | 64B | 64B | — | Kalyna 512 位块 / 512 位密钥（18 轮）。块 64 字节、密钥 64 字节，是本工具块最大的分组密码。。轮数：128 位密钥 10 轮、256 位 14 轮、512 位 18 轮。参照物是 Kal… |
| `khazad` | KHAZAD（NESSIE 候选，v2.0 tweaked S 盒） | 8B | 16B | — | KHAZAD（Barreto & Rijmen，2000，NESSIE 候选）：64 位块 / 128 位密钥 / 8 轮 SPN，结构上相当于"缩小的 AES"。⚠ 这是 v2.0 的 tweaked S 盒版本… |
| `loki89` | LOKI89 | 8B | 8B | — | LOKI89（Brown/Pieprzyk/Seberry，1990）：64 位块 / 64 位密钥 / 16 轮 Feistel，S 盒由 GF(2^8) 上的指数运算生成（16 个不可约多项式 × 指数 31）… |
| `loki91` | LOKI91 | 8B | 8B | — | LOKI91（Brown 等，1991）：LOKI89 的改进版 —— 去掉首尾白化、换 S 盒（t = (c + ((r*17)^0xff)) & 0xff）、轮密钥改为交替 ROL12/ROL13。⚠ 64 位… |
| `safer-k64` | SAFER K-64 | 8B | 8B | — | SAFER K-64（Massey, Cylink, 1993）：64 位块 / 64 位密钥 / 6 轮，非 Feistel 结构。每轮 = 子密钥混合（XOR 与 mod 256 加交替）→ S 盒层（45^x… |
| `safer-k128` | SAFER K-128 | 8B | 16B | — | SAFER K-128（Massey, Cylink, 1993）：64 位块 / 128 位密钥 / 12 轮，非 Feistel 结构。每轮 = 子密钥混合（XOR 与 mod 256 加交替）→ S 盒层（4… |
| `safer-sk64` | SAFER SK-64 | 8B | 8B | — | SAFER SK-64（Massey, Cylink, 1993；Knudsen 强化密钥调度 1995）：64 位块 / 64 位密钥 / 8 轮，非 Feistel 结构。每轮 = 子密钥混合（XOR 与 mo… |
| `safer-sk128` | SAFER SK-128 | 8B | 16B | — | SAFER SK-128（Massey, Cylink, 1993；Knudsen 强化密钥调度 1995）：64 位块 / 128 位密钥 / 10 轮，非 Feistel 结构。每轮 = 子密钥混合（XOR 与… |
| `anubis128` | ANUBIS-128（NESSIE 候选，12 轮） | 16B | 16B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 128 位，轮数 R = 8 + N = 12。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `anubis160` | ANUBIS-160（NESSIE 候选，13 轮） | 16B | 20B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 160 位，轮数 R = 8 + N = 13。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `anubis192` | ANUBIS-192（NESSIE 候选，14 轮） | 16B | 24B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 192 位，轮数 R = 8 + N = 14。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `anubis224` | ANUBIS-224（NESSIE 候选，15 轮） | 16B | 28B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 224 位，轮数 R = 8 + N = 15。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `anubis256` | ANUBIS-256（NESSIE 候选，16 轮） | 16B | 32B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 256 位，轮数 R = 8 + N = 16。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `anubis288` | ANUBIS-288（NESSIE 候选，17 轮） | 16B | 36B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 288 位，轮数 R = 8 + N = 17。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `anubis320` | ANUBIS-320（NESSIE 候选，18 轮） | 16B | 40B | — | ANUBIS（Barreto & Rijmen，2000，NESSIE 候选）：128 位块，密钥 320 位，轮数 R = 8 + N = 18。结构与 AES 同族（SPN + T 表）。本实现取官方原版表（L… |
| `adiantum` | Adiantum 长度保持加密（XChaCha12-AES256） | — | 32B | — | Adiantum：Google 提出的长度保持加密（HBSH = Hash-Block-Stream-Hash），用于无 AES 指令集设备的磁盘/文件加密（Android、Linux fscrypt）。密钥 32… |
| `adiantum20` | Adiantum（XChaCha20-AES256） | — | 32B | — | Adiantum 的 20 轮流密码变体（XChaCha20-AES256），结构同 adiantum，安全性余量更大、略慢。已与 Google 官方 180 组向量比对。 |
| `adiantum8` | Adiantum（XChaCha8-AES256） | — | 32B | — | Adiantum 的 8 轮流密码变体（XChaCha8-AES256），结构同 adiantum，最快但安全余量最小，非标准配置（官方默认 12 轮），仅供研究与性能对比。已与 Google 官方 12 组向量比对。 |
| `xchacha12` | XChaCha12 流密码 | — | 32B | ✅ | XChaCha12：24 字节 nonce 的扩展 nonce ChaCha（HChaCha12 派生子密钥 + ChaCha12 生成流），加密输出为 nonce‖密文。已与 Google 官方 XChaCha1… |
| `xchacha8` | XChaCha8 流密码 | — | 32B | ✅ | XChaCha8：24 字节 nonce 的扩展 nonce ChaCha 8 轮变体，结构同 XChaCha12 但只用 8 轮。非标准配置（官方默认 12 轮），仅供研究与性能对比。已与 Google 官方 X… |
| `xchacha20` | XChaCha20 流密码 | — | 32B | ✅ | XChaCha20（draft-irtf-cfrg-xchacha）：先用 HChaCha20(key, nonce[0:16]) 派生 32 字节子密钥，再以 12 字节 nonce（4 字节零 ‖ nonce[… |
| `threefish512` | Threefish-512（Skein 核心可调分组密码） | 64B | 64B | — | Skein 哈希的核心部件，块 512 位、密钥 512 位、另带 128 位 tweak（此处置 0）。72 轮，每 4 轮注入一次轮密钥，Skein 风格 MIX 只含加法/旋转/异或。 【验证】Botan t… |
| `lion` | LION（SHA-1+RC4，64 字节块） | — | — | — | Anderson-Biham 的 LION 构造：哈希+流密码拼出可变块长分组密码。此处为 Botan 官方配置 Lion(SHA-160,RC4,64)：左 20 字节经哈希流异或，右 44 字节经两次 RC4。… |
| `mtproto-enc` | MTProto 2.0 消息加密（Telegram） | — | — | — | Telegram MTProto 2.0 报文加密：payload 补 padding 后算 msg_key=SHA256(auth_key[88+x:120+x]‖payload‖padding)[8:24]，a… |
| `mtproto-dec` | MTProto 2.0 消息解密（Telegram） | — | — | — | MTProto 2.0 报文解密：输入 auth_key_id‖msg_key‖密文（Hex 或 Base64 均可），由 auth_key 派生 aes_key/aes_iv，IGE 解密后重算 msg_key … |
| `mtproto-parse` | MTProto 报文结构解析（Telegram，不解密） | — | — | — | 把抓到的 MTProto 报文（Hex 或 Base64 均可）按字节分段标注：auth_key_id(8字节)‖msg_key(16字节)‖密文(N×16字节)。若开头多了 4 或 8 字节（TCP 传输层的长度… |
| `mtproto1-enc` | MTProto 1.0 消息加密（Telegram，已废弃） | — | — | — | MTProto 1.0 报文加密（官方已废弃，仅用于兼容验证）：msg_key=SHA1(payload)[4:20]不含 padding，padding 仅 0..15 字节，aes_key/aes_iv 由四个… |
| `mtproto1-dec` | MTProto 1.0 消息解密（Telegram，已废弃） | — | — | — | MTProto 1.0 报文解密：由 auth_key 派生 aes_key/aes_iv，IGE 解密后重算msg_key=SHA1(payload)[4:20] 校验（padding 不参与校验）。方向 c/s… |
| `cascade-serpent-aes256` | Cascade(Serpent,AES-256) 级联加密 | — | — | — | Serpent 与 AES-256 级联。加密先用第一个密码、再用第二个；解密顺序相反。属于教学/兼容用途，性能约为两个密码之和。 |
| `xsalsa20` | XSalsa20 流密码（NaCl 用） | — | — | — | XSalsa20 = HSalsa20(key, nonce[0:16]) 派生子密钥 + Salsa20(subkey, nonce[16:24])，24 字节 nonce 可安全随机生成。NaCl / libs… |
| `nacl-secretbox-enc` | NaCl secretbox 封装（XSalsa20-Poly1305） | — | — | — | libsodium crypto_secretbox：首个 keystream 块的前 32 字节作 Poly1305 一次性密钥，明文从第 32 字节起异或，输出 tag(16)‖密文。24 字节 nonce 可… |
| `nacl-secretbox-dec` | NaCl secretbox 解封（XSalsa20-Poly1305） | — | — | — | 解封并校验 Poly1305 tag：密钥/nonce 不匹配或密文被篡改会直接报错，不会返回错误明文。输入格式 nonce(24)‖tag(16)‖密文。参照 PyNaCl 1.6.2。 |
| `fernet-enc` | Fernet 加密（Python cryptography 格式） | — | — | — | Fernet 是 Python cryptography 的事实标准容器：0x80‖时间戳(8,大端)‖IV(16)‖AES-128-CBC‖HMAC-SHA256，整段 base64url。32 字节密钥前 16… |
| `fernet-dec` | Fernet 解密（Python cryptography 格式） | — | — | — | 校验 HMAC-SHA256 后用 AES-128-CBC 解密。HMAC 用常量时间比较，不匹配直接报错——Fernet 是「先认证后解密」，不会返回错误明文。输入框填完整 token（gAAAAA…）。参照 c… |
| `paseto-v4-local-enc` | PASETO v4.local 加密 | — | — | — | PASETO v4.local：n(32) 经 BLAKE2b 派生 ek/n2 与 ak；密文 = XChaCha20(ek,n2) 纯加密，标签 t = BLAKE2b(ak, PAE(header,n,c,f… |
| `paseto-v4-local-dec` | PASETO v4.local 解密 | — | — | — | 重算 BLAKE2b 认证标签并常量时间比对，不匹配直接报错（不解密）。输入框填完整 token（v4.local.xxx）。参照 pyseto 1.10.0。 |
| `paseto-v2-local-enc` | PASETO v2.local 加密 | — | — | — | PASETO v2.local：n(24)，XChaCha20-Poly1305(key, n)，AAD = PAE(header, n, footer)，tag 内联在 token 末尾（16 字节）。与 v4 … |
| `paseto-v2-local-dec` | PASETO v2.local 解密 | — | — | — | 校验 XChaCha20-Poly1305 内联 tag（含 PAE 前缀作为 AAD），失败直接报错。输入框填完整 token（v2.local.xxx）。参照 pyseto 1.10.0。 |

### 非对称加密（39）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `rsa` | RSA (RSA-OAEP) | — | — | — | RSA-OAEP + SHA-256。加密填公钥（SPKI PEM），解密填私钥（PKCS#8 PEM）。 |
| `rsa-pss` | RSA-PSS 签名 | — | — | — | RSA-PSS + SHA-256 + MGF1，盐长 32 字节。PSS 是概率性签名（每次签名结果不同），比 RSA PKCS#1 v1.5 更安全，是新系统的推荐选择。加密＝私钥签名；解密＝公钥验签（参数栏填… |
| `ecdsa-p256` | ECDSA (P-256) | — | — | — | 加密 = 私钥签名；解密 = 公钥验签，需在参数栏填签名。 |
| `ecdsa-p384` | ECDSA (P-384) | — | — | — | 同上，使用 P-384 曲线。 |
| `ed25519` | EdDSA (Ed25519) | — | — | — | 加密 = 私钥签名；解密 = 公钥验签。需要浏览器支持 Ed25519。 |
| `ecdh-p256` | ECDH (P-256 密钥协商) | — | — | — | 加密与解密同一操作：协商出 32 字节共享密钥。 |
| `dh-modp2` | Diffie-Hellman (MODP Group 2) | — | — | — | 经典有限域 DH，1024 位 MODP Group 2。加密与解密都执行同一操作：用己方私钥与对方公钥计算共享密钥，输出为 Hex。需要先生成私钥/公钥：见下方说明。 |
| `ecc-ecies` | ECC 通用加密（ECIES） | — | — | — | 椭圆曲线集成加密方案：临时密钥 ECDH → SHA-256 派生 → AES-256-CBC + HMAC-SHA256。加密用对方公钥，解密用自己的私钥（密文自带临时公钥与 IV）。曲线可用前缀指定：p256:… |
| `ecc-ecdh` | ECC 密钥协商（ECDH） | — | — | — | 椭圆曲线 Diffie-Hellman：加密与解密都执行同一操作，用己方私钥与对方公钥算出共享密钥（输出 Hex）。曲线可用前缀指定：p256: / p384: / p521: / secp256k1: / sm2… |
| `elgamal` | ElGamal 加密 | — | — | — | 经典 ElGamal 公钥加密：1024 位 MODP Group 2 参数，明文按 64 字节分块，每块使用独立随机数（密文约为明文的 4 倍长）。加密用对方公钥，解密用自己的私钥。 |
| `sm2-enc` | SM2 加密（国密） | — | — | — | 国密 SM2 公钥加密（GM/T 0003-2012），sm2p256v1 曲线 + SM3 杂凑，密文格式为 C1／／C3／／C2（C1 为未压缩点，兼容旧版 C1／／C2／／C3）。加密用对方公钥，解密用自己的私钥。 |
| `frost` | FROST 阈值签名 (Ed25519) | — | — | — | FROST（RFC 9591）两轮阈值签名：n 个参与者中任意 t 个合作才能签名，少于 t 个无法签名，全程不重建完整私钥，最终输出标准 Ed25519 签名。默认 t=2、n=3。份额用 nonce_gener… |
| `gg20` | GG20 阈值 ECDSA (secp256k1) | — | — | — | GG20（Gennaro & Goldfeder, ACM CCS 2020）阈值 ECDSA：t 个参与者合作产生标准 ECDSA 签名，全程不重建私钥。核心为 Paillier 同态加密 + MtA 乘法转加法… |
| `hpke` | ECDH+HKDF+AEAD 混合加密 | — | — | — | HPKE 风格：X25519 ECDH → HKDF-SHA256 → AES-256-GCM。加密需填对方公钥，输出「临时公钥‖nonce‖密文+tag」；解密填自己的私钥，密文里自带临时公钥，无需额外参数。 |
| `spake2p-register` | SPAKE2+ 注册（口令 → w0/w1/L） | — | — | — | 把口令转为 SPAKE2+ 注册记录：输出 w0/L（给服务器）与 w1（给客户端）。服务器不存明文口令。 |
| `spake2p-prover` | SPAKE2+ Prover（客户端） | — | — | — | SPAKE2+ 客户端。填 w0/w1/x 与对方 share，得到 K_shared。⚠ RFC 9383 未规定 PBKDF 选择，注册条目的 PBKDF2 仅供演示。 |
| `spake2p-verifier` | SPAKE2+ Verifier（服务器） | — | — | — | SPAKE2+ 服务端。填 w0/L/y 与对方 share，得到 K_shared。需与客户端结果一致才算协商成功。 |
| `ed25519-ctx` | Ed25519ctx（带上下文） | — | — | — | RFC 8032 的 Ed25519 变体。ctx = 带应用上下文字符串，防止跨场景签名重用。与纯 Ed25519 的区别只在 dom2 前缀与 PH(M)。签名 64 字节。 |
| `ed25519-ph` | Ed25519ph（预哈希） | — | — | — | RFC 8032 的 Ed25519 变体。ph = 先对消息做 SHA-512 再签名，适合超大消息或流式签名（libsodium 官方实现交叉验证 24/24）。与纯 Ed25519 的区别只在 dom2 前缀… |
| `ristretto255-dh` | Ristretto255 密钥协商 | — | — | — | Ristretto255 上的 Diffie-Hellman：己方标量 a × 对方点 Q = 共享点。相比 X25519 无需"清除余因子"步骤，因为 Ristretto255 本身就是素数阶群。加密与解密同一操作。 |
| `sm2-keyxchg` | SM2 密钥协商（国密） | — | — | — | 国密 SM2 密钥协商（GM/T 0003-2012 §6.1），两方各出一个临时随机数与临时点，协商出共享密钥。已与 gmalg（国密官方参考实现）交叉验证：5 组不同密钥长度与标识下双方密钥逐字节一致，并额外通… |
| `decaf448-dh` | Decaf448 密钥协商 | — | — | — | Decaf448 上的 Diffie-Hellman：己方标量 a × 对方点 Q。群本身是素数阶，无需额外"清除余因子"步骤。加密与解密同一操作。 |
| `sm9-sign` | SM9 标识密码签名 | — | — | — | SM9 标识密码（GM/T 0044-2016）：用户的公钥就是他的身份标识（邮箱、ID），无需证书。KGC 用主私钥为 UID 生成签名私钥。已与 gmalg 交叉验证：私钥生成、签名 h/S、验签 45/45 一致。 |
| `sm9-keygen-enc` | SM9 加密密钥生成 | — | — | — | SM9 标识加密（GM/T 0004-2016）的密钥生成。主公钥 mpk_e = [msk_e]P1 在 G1，用户加密私钥 de = [msk_e·(H1(ID‖3)+msk_e)^-1]P2 在 G2——与签… |
| `sm9-kem` | SM9 密钥封装（IBE-KEM） | — | — | — | SM9 标识加密的密钥封装：只需对方标识即可封装出一个共享密钥，无需证书。C = [r]Q（Q = [H1(ID‖3)]P1 + mpk_e），K = SM3KDF(C.x‖C.y‖e(mpk_e,P2)^r‖ID… |
| `sm9-enc` | SM9 标识公钥加密 | — | — | — | SM9 标识加密（GM/T 0004-2016）：公钥就是对方标识，无需证书。密文 = C1(65) ‖ C3(32, SM3 MAC) ‖ C2(与明文等长)。加密方只需主公钥，解密方持 KGC 签发的私钥。已与… |
| `ibe-setup` | IBE 主密钥生成（Boneh-Franklin） | — | — | — | Boneh-Franklin 基于身份加密的主密钥建立。输出主私钥 s（必须离线保管）与公开参数 Ppub = s·P₂（可公开）。之后任何身份的私钥都由 s 派生。 |
| `ibe-extract` | IBE 用户私钥提取 | — | — | — | 用主私钥为某个身份派生私钥 d_ID = s·H₁(ID) ∈ G1。身份可以是邮箱、手机号等任意字符串——这正是 IBE 无需证书的原因。输出 64 字节 G1 点。 |
| `ibe-encrypt` | IBE 加密（向某身份） | — | — | — | Boneh-Franklin IBE 加密。无需对方证书，只要知道身份字符串即可加密。密文 = U(r·P₂，128 字节) ‖ 密文主体。⚠ BF-IBE 只能加密短消息（此处用 XOR 流），实际应封装一个对称密钥。 |
| `ibe-decrypt` | IBE 解密（用自己的私钥） | — | — | — | 用 IBE 用户私钥解密。取密文头 128 字节作为 U，计算 e(d_ID, U) 还原掩码。若身份不匹配，解出来是乱码而非报错——这是 IBE 的常见特性。 |
| `rsa-kem-encaps` | RSA-KEM 封装（ISO 18033-2） | — | — | — | RSA-KEM 封装：C0 = R^E mod N，共享密钥 K = KDF(R)。 【关键】KDF 输入是明文 R 而非密文 C0。 【验证】Botan pubkey/rsa_kem.vec 官方向量 10/10… |
| `rsa-kem-decaps` | RSA-KEM 解封装（ISO 18033-2） | — | — | — | RSA-KEM 解封装：由 C0 还原 R = C0^D mod N，再算 K = KDF(R)。 【验证】Botan pubkey/rsa_kem.vec 官方向量 10/10。 【输出】前 N 字节为 R，其后… |
| `srp6a` | SRP-6a 远程口令协议（RFC 5054） | — | — | — | SRP-6a：服务端只存验证子 v=g^x，口令不上网不落库。输出 v/A/B/S 四行。默认 1024 位群（RFC 5054 附录 A），3072 位及以上 g=5，群参数取自官方向量未手抄。Botan 向量 … |
| `nacl-box-enc` | NaCl box 封装（X25519 双方） | — | — | — | libsodium crypto_box：k = HSalsa20(X25519(自己的私钥, 对方公钥), 全零 16 字节)，再走 secretbox。24 字节 nonce 可随机。输出 nonce‖box。… |
| `nacl-box-dec` | NaCl box 解封（X25519 双方） | — | — | — | 输入 nonce(24)‖tag(16)‖密文，用 X25519 共享密钥解封并校验 Poly1305 tag。参照 PyNaCl 1.6.2。 |
| `nacl-sealedbox-enc` | NaCl sealed box 封装（匿名发送） | — | — | — | libsodium crypto_box_seal：生成临时 X25519 密钥对，共享密钥经 HSalsa20 派生，nonce = BLAKE2b-256(临时公钥‖接收方公钥)[0:24]。输出 = 临时公钥… |
| `nacl-sealedbox-dec` | NaCl sealed box 解封（匿名接收） | — | — | — | 输入 = 临时公钥(32)‖tag(16)‖密文。用接收方私钥与密文里的临时公钥重建共享密钥，nonce 同样由 BLAKE2b 派生。第二栏一般不用填；若密文不含临时公钥（已被剥离），才在此填入对方公钥。参照 P… |
| `age-enc` | age 加密（v1 / X25519 收件人） | — | — | — | age v1 文件加密（X25519 收件人）：临时 X25519 → HKDF-SHA256 得 wrap key → ChaCha20-Poly1305 封装 16 字节 file key → header M… |
| `age-dec` | age 解密（v1 / X25519 身份） | — | — | — | age v1 文件解密。先校验 header MAC（不匹配直接报错，不会返回错误明文），再按 64KiB 分块解 STREAM。输入框填 .age 文件内容：可以是原始文本、base64，或 -----BEGIN… |

### 数字签名（9）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `ecc-ecdsa` | ECDSA（椭圆曲线签名） | — | — | — | 加密按钮 = 用私钥签名；解密按钮 = 用公钥验签（参数栏填签名，输入框填原消息）。曲线可用前缀指定：p256: / p384: / p521: / secp256k1: / sm2:（写在密钥或参数栏开头，默认 … |
| `dsa` | DSA（离散对数签名） | — | — | — | FIPS 186 数字签名算法，采用 RFC 5114 Group 22 域参数（1024 位 p / 160 位 q），哈希为 SHA-256。加密按钮 = 私钥签名；解密按钮 = 公钥验签（参数栏填签名，输入框… |
| `sm2-sign` | SM2 签名（国密） | — | — | — | 国密 SM2 数字签名（GM/T 0003-2012）：SM3 杂凑，默认用户标识 ID = 1234567812345678。加密按钮 = 私钥签名；解密按钮 = 公钥验签（参数栏填签名，输入框填原消息）。 |
| `cose-sign1` | COSE_Sign1（RFC 8152） | — | — | — | COSE_Sign1（RFC 8152）：对 Sig_structure = ["Signature1", protected, external_aad, payload] 签名，ES256 的签名值是 raw … |
| `jose-jws` | JWS 签名/验签（RFC 7515） | — | — | — | JWS（RFC 7515）：对 ASCII(B64U(protected) "." B64U(payload)) 签名，输出 compact 前三段 h.p.s。支持 RFC 7797 的 b64:false。HS… |
| `paseto-v4-public-sign` | PASETO v4.public 签发（Ed25519） | — | — | — | PASETO v4.public：对 PAE("v4.public.", payload, footer, implicit_assertion) 做 Ed25519 签名，token = 明文‖签名(64) 的 … |
| `paseto-v4-public-verify` | PASETO v4.public 验签（Ed25519） | — | — | — | 验证 v4.public token 的 Ed25519 签名并返回原文。验签失败直接报错。输入框填完整 token（v4.public.xxx）。参照 pyseto 1.10.0。 |
| `paseto-v2-public-sign` | PASETO v2.public 签发（Ed25519） | — | — | — | PASETO v2.public：对 PAE("v2.public.", payload, footer) 做 Ed25519 签名。与 v4 的差别是没有 implicit assertion 字段。参照 pys… |
| `paseto-v2-public-verify` | PASETO v2.public 验签（Ed25519） | — | — | — | 验证 v2.public token 的 Ed25519 签名并返回原文。参照 pyseto 1.10.0。 |

### 密钥工具（6）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `keygen` | 密钥生成（19 种：ECC/SM2/Ed25519/X25519/Ed448/X448/RSA/…） | — | — | — | 点【加密】生成一对新密钥。参数栏可填：ecc(:p384/:p521/:secp256k1) / sm2 / dsa / elgamal / dh / ed25519 / x25519 / ed448 / x448… |
| `key-export` | 密钥对导出（JWK / PEM） | — | — | — | 生成一对全新密钥，并同时输出 JWK（JSON）与 PEM 两种格式。私钥 PEM 属高度敏感信息，请勿外传。 |
| `x25519` | X25519（密钥交换） | — | — | — | RFC 7748 X25519 密钥交换。不填参数则生成新密钥对；填对方公钥（64 位 Hex）则输出 32 字节共享密钥。Ed25519 签名请在「非对称加密」组选择。 |
| `jose-jwk` | JWK 解析与指纹（RFC 7517/7638） | — | — | — | JWK（RFC 7517）：按 RFC 7638 计算 JWK SHA-256 Thumbprint —— 只取【必需成员】按字典序序列化后取摘要，oct 用 k、RSA 用 e/kty/n、EC 用 crv/kt… |
| `hkdf-expand-label` | TLS 1.3 HKDF-Expand-Label（RFC 8446） | — | — | — | HKDF-Expand-Label：info = BE16(输出长度)‖len(label)‖label‖len(context)‖context。prefix=tls13（默认）加 "tls13 " 前缀，已用 … |
| `age-keygen` | age 密钥对生成（v1 身份 + 收件人） | — | — | — | 生成 age v1 的 X25519 身份：随机 32 字节并按 X25519 规范钳位（sk[0]&=248, sk[31]&=127, sk[31]／=64），公钥 = 基点(9) 的标量乘。私钥编码为 bec… |

### 古典密码（6）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `vigenere` | 维吉尼亚密码 | — | — | — | 多表替换密码：用密钥词逐字母移位。只处理字母，其余字符原样保留。 |
| `atbash` | Atbash 密码 | — | — | — | 单表替换：字母表反转（A↔Z，a↔z）。希伯来字母表起源。 |
| `affine` | 仿射密码 | — | — | — | E(x) = a·x + b (mod 26)，要求 a 与 26 互素。 |
| `railfence` | 栅栏密码 | — | — | — | Rail Fence 置换密码：按之字形写入多行再按行读出。只改变顺序，不改变字符。 |
| `playfair` | Playfair 密码 | — | — | — | 双字母替换密码，使用 5×5 方阵（I/J 合并）。输出为大写字母串。 |
| `bacon` | 培根密码 | — | — | — | Bacon 隐写密码：每个字母编码为 5 个 a/b。 |

### 校验和（10）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `crc32` | CRC32 | — | — | — | CRC32（IEEE 802.3）：循环冗余校验，用于检测传输/存储中的意外改动。不是密码学算法，不能防篡改——需要防篡改请改用 HMAC 或 AEAD。 |
| `crc32c` | CRC32C (Castagnoli) | — | — | — | CRC32C：Castagnoli 多项式，用于 iSCSI、SCTP、ext4 等。同样不是密码学算法。 |
| `adler32` | Adler32 | — | — | — | Adler32：zlib 使用的滚动校验和，比 CRC32 快但对短数据较弱。同样不是密码学算法。 |
| `crc8` | CRC8（ATM / ITU） | — | — | — | CRC8：8 位循环冗余校验，多项式 0x07，用于 SMBus、ATM 头校验等。数据量大时冲突率高，不能防篡改。 |
| `crc16ccitt` | CRC16-CCITT（XMODEM） | — | — | — | CRC16-CCITT：多项式 0x1021，初值 0x0000，用于 XMODEM、蓝牙、红外。出厂检查值 "123456789" → 31C3。 |
| `crc16modbus` | CRC16-MODBUS | — | — | — | CRC16-MODBUS：多项式 0x8005，初值 FFFF，输入输出均反射，用于工业总线。检查值 "123456789" → 4B37。 |
| `crc64ecma` | CRC64-ECMA-182 | — | — | — | CRC64-ECMA-182：64 位 CRC，多项式 0x42F0E1EBA9EA3693，用于分布式存储去重。检查值 "123456789" → 6C40DF5F0B497347。 |
| `crc64xz` | CRC64-XZ（Go ECMA） | — | — | — | CRC64-XZ：与 ECMA 同多项式但初值/输出全 1 并反射，xz 压缩格式与 Go 标准库采用。 |
| `fnv1a32` | FNV-1a 32 | — | — | — | FNV-1a 32：非密码学哈希，常用于哈希表与去重，比 CRC 快但冲突率更高。检查值 "foobar" → BF9CF968。 |
| `crc24` | CRC-24（OpenPGP，RFC 4880） | — | — | — | 24 位 CRC，OpenPGP（RFC 4880 §6.1）用它校验 ASCII Armor 的 Radix-64 数据，3 字节再编成 4 个 Base64 字符（前缀 "="）。多项式 0x1864CFB，初… |

### 后量子密码（71）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `mlkem512` | ML-KEM-512（后量子 KEM） | — | — | — | ML-KEM-512：FIPS 203 标准化的后量子密钥封装机制（原 CRYSTALS-Kyber）。NIST 安全等级 1，大致对应 AES-128。公钥 800 字节、私钥 1632 字节、密文 768 字节… |
| `mlkem768` | ML-KEM-768（后量子 KEM） | — | — | — | ML-KEM-768：FIPS 203，NIST 安全等级 3，大致对应 AES-192。这是推荐默认选项（也是 TLS 中最广泛部署的参数集）。公钥 1184 字节、私钥 2400 字节、密文 1088 字节。 |
| `mlkem1024` | ML-KEM-1024（后量子 KEM） | — | — | — | ML-KEM-1024：FIPS 203，NIST 安全等级 5，大致对应 AES-256。公钥 1568 字节、私钥 3168 字节、密文 1568 字节。 |
| `mldsa44` | ML-DSA-44（后量子签名） | — | — | — | ML-DSA-44：FIPS 204 标准化的后量子数字签名（原 CRYSTALS-Dilithium）。NIST 安全等级 2。公钥 1312 字节、私钥 2560 字节、签名 2420 字节。 |
| `mldsa65` | ML-DSA-65（后量子签名） | — | — | — | ML-DSA-65：FIPS 204，NIST 安全等级 3。推荐默认选项。公钥 1952 字节、私钥 4032 字节、签名 3309 字节。 |
| `mldsa87` | ML-DSA-87（后量子签名） | — | — | — | ML-DSA-87：FIPS 204，NIST 安全等级 5。公钥 2592 字节、私钥 4896 字节、签名 4627 字节。 |
| `sphincs` | SPHINCS+ 签名（SHAKE-128f） | — | — | — | SPHINCS+ 无状态哈希签名（SHAKE-256-128f，robust 变体，round-3）。安全性只依赖哈希函数，不依赖任何数学难题，因此抗量子。代价是签名很大：17088 字节（约 17 KB），密钥也… |
| `hqc128` | HQC-128（后量子 KEM） | — | — | — | HQC-128：基于准循环码的 KEM，NIST 于 2025-03 选为 ML-KEM 的备份算法（非格路线）。公钥 2241 字节、密文 4433 字节、共享密钥 32 字节。已通过官方 KAT（PQCkemK… |
| `hqc192` | HQC-192（后量子 KEM） | — | — | — | HQC-192：安全等级 3。公钥 4522 字节、密文 9038 字节。已通过官方 KAT 验证。⚠ 规格仍在定稿中。 |
| `hqc256` | HQC-256（后量子 KEM） | — | — | — | HQC-256：安全等级 5。公钥 7245 字节、密文 14453 字节。已通过官方 KAT 验证。⚠ 规格仍在定稿中。 |
| `bike1` | BIKE-L1（后量子 KEM · 码基） | — | — | — | BIKE-L1：NIST Round 4 附加候选，基于 QC-MDPC 准循环中密度校验码，格路线之外的备份。R=12323，D=71，T=134。公钥 1541 B、私钥 5223 B、密文 1573 B、共享… |
| `bike3` | BIKE-L3（后量子 KEM · 码基） | — | — | — | BIKE-L3：NIST Round 4 附加候选，基于 QC-MDPC 准循环中密度校验码，格路线之外的备份。R=24659，D=103，T=199。公钥 3083 B、私钥 10105 B、密文 3115 B、… |
| `bike5` | BIKE-L5（后量子 KEM · 码基） | — | — | — | BIKE-L5：NIST Round 4 附加候选，基于 QC-MDPC 准循环中密度校验码，格路线之外的备份。R=40973，D=137，T=264。公钥 5122 B、私钥 16494 B、密文 5154 B、… |
| `mceliece348864` | Classic McEliece 348864（码基 KEM） | — | — | — | Classic McEliece 348864：码基后量子 KEM（二元 Goppa 码），抗量子攻击。公钥 261120 字节（约 255KB，建议【载入文件】导入）、私钥 6492 字节、密文 96 字节、密钥… |
| `mceliece348864-keygen` | Classic McEliece 348864 密钥生成（官方 KAT 验证） | — | — | — | 生成 Classic McEliece 348864 密钥对：公钥 261120 字节（约 255KB）、私钥 6492 字节。流程：随机 Goppa 多项式 → 随机排列 → 系统形式公钥 → Benes 控制位… |
| `mceliece460896` | Classic McEliece 460896（码基 KEM） | — | — | — | Classic McEliece 460896：码基后量子 KEM（二元 Goppa 码，GFBITS=13）。公钥 524160 字节（约 512KB，建议【载入文件】导入）、私钥 13608 字节、密文 156… |
| `mceliece460896-keygen` | Classic McEliece 460896 密钥生成（官方 KAT 验证） | — | — | — | 生成 Classic McEliece 460896 密钥对：公钥 524160 字节、私钥 13608 字节。流程：随机 Goppa 多项式 → 随机排列 → 系统形式公钥 → Benes 控制位压缩。已过官方 … |
| `mceliece6688128` | Classic McEliece 6688128（码基 KEM） | — | — | — | Classic McEliece 6688128：码基后量子 KEM（二元 Goppa 码，GFBITS=13）。公钥 1044992 字节（约 1021KB，建议【载入文件】导入）、私钥 13932 字节、密文 … |
| `mceliece6688128-keygen` | Classic McEliece 6688128 密钥生成（官方 KAT 验证） | — | — | — | 生成 Classic McEliece 6688128 密钥对：公钥 1044992 字节、私钥 13932 字节。流程：随机 Goppa 多项式 → 随机排列 → 系统形式公钥 → Benes 控制位压缩。已过官… |
| `mceliece6960119` | Classic McEliece 6960119（码基 KEM） | — | — | — | Classic McEliece 6960119：码基后量子 KEM（二元 Goppa 码，GFBITS=13）。公钥 1047319 字节（约 1023KB，建议【载入文件】导入）、私钥 13948 字节、密文 … |
| `mceliece6960119-keygen` | Classic McEliece 6960119 密钥生成（官方 KAT 验证） | — | — | — | 生成 Classic McEliece 6960119 密钥对：公钥 1047319 字节、私钥 13948 字节。流程：随机 Goppa 多项式 → 随机排列 → 系统形式公钥 → Benes 控制位压缩。已过官… |
| `mceliece8192128` | Classic McEliece 8192128（码基 KEM） | — | — | — | Classic McEliece 8192128：码基后量子 KEM（二元 Goppa 码，GFBITS=13）。公钥 1357824 字节（约 1326KB，建议【载入文件】导入）、私钥 14120 字节、密文 … |
| `mceliece8192128-keygen` | Classic McEliece 8192128 密钥生成（官方 KAT 验证） | — | — | — | 生成 Classic McEliece 8192128 密钥对：公钥 1357824 字节、私钥 14120 字节。流程：随机 Goppa 多项式 → 随机排列 → 系统形式公钥 → Benes 控制位压缩。已过官… |
| `frodo976shake-keygen` | FrodoKEM-976-SHAKE 密钥生成 | — | — | — | 生成 FrodoKEM-976-SHAKE 密钥对，输出 pk（31264 字符）与 sk（62592 字符）。参数栏填 sk 则只输出私钥。 |
| `frodo976shake-encaps` | FrodoKEM-976-SHAKE 封装（公钥加密） | — | — | — | 用公钥封装：输出密文 ct（31488 字符）与共享密钥 ss（48 字符）。密钥栏填公钥。 |
| `frodo976shake-decaps` | FrodoKEM-976-SHAKE 解封装（私钥解密） | — | — | — | 用私钥解封装：密钥栏填私钥，输入填密文，输出 24 字节共享密钥。密文被篡改时会静默返回伪随机密钥（FO 变换的隐含拒绝），属正常行为。 |
| `frodo1344shake-keygen` | FrodoKEM-1344-SHAKE 密钥生成 | — | — | — | 生成 FrodoKEM-1344-SHAKE 密钥对，输出 pk（43040 字符）与 sk（86176 字符）。参数栏填 sk 则只输出私钥。 |
| `frodo1344shake-encaps` | FrodoKEM-1344-SHAKE 封装（公钥加密） | — | — | — | 用公钥封装：输出密文 ct（43264 字符）与共享密钥 ss（64 字符）。密钥栏填公钥。 |
| `frodo1344shake-decaps` | FrodoKEM-1344-SHAKE 解封装（私钥解密） | — | — | — | 用私钥解封装：密钥栏填私钥，输入填密文，输出 32 字节共享密钥。密文被篡改时会静默返回伪随机密钥（FO 变换的隐含拒绝），属正常行为。 |
| `frodo640shake-keygen` | FrodoKEM-640-SHAKE 密钥生成 | — | — | — | 生成 FrodoKEM-640-SHAKE 密钥对，输出 pk（19232 字符）与 sk（39776 字符）。参数栏填 sk 则只输出私钥。 |
| `frodo640shake-encaps` | FrodoKEM-640-SHAKE 封装（公钥加密） | — | — | — | 用公钥封装：输出密文 ct（19440 字符）与共享密钥 ss（32 字符）。密钥栏填公钥。 |
| `frodo640shake-decaps` | FrodoKEM-640-SHAKE 解封装（私钥解密） | — | — | — | 用私钥解封装：密钥栏填私钥，输入填密文，输出 16 字节共享密钥。密文被篡改时会静默返回伪随机密钥（FO 变换的隐含拒绝），属正常行为。 |
| `sntrup761-keygen` | sntrup761 密钥生成 | — | — | — | 生成 sntrup761 密钥对，输出 pk（2316 字符）与 sk（3526 字符）。参数栏填 sk 则只输出私钥。 |
| `sntrup761-encaps` | sntrup761 封装（公钥加密） | — | — | — | 用公钥封装：密钥栏填公钥，输出密文 ct（2078 字符）与共享密钥 ss（64 字符）。 |
| `sntrup761-decaps` | sntrup761 解封装（私钥解密） | — | — | — | 用私钥解封装：密钥栏填 sk，输入填密文，输出 32 字节共享密钥。密文被篡改时返回伪随机密钥（隐含拒绝），属正常行为。 |
| `lightsaber-keygen` | LightSaber 密钥生成 | — | — | — | LightSaber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=2 · μ=10 · T=2^3；公钥 672 字节 · 私钥 1568 字节 · 密文 7… |
| `lightsaber-encaps` | LightSaber 封装（公钥加密） | — | — | — | LightSaber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=2 · μ=10 · T=2^3；公钥 672 字节 · 私钥 1568 字节 · 密文 7… |
| `lightsaber-decaps` | LightSaber 解封装（私钥解密） | — | — | — | LightSaber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=2 · μ=10 · T=2^3；公钥 672 字节 · 私钥 1568 字节 · 密文 7… |
| `saber-keygen` | Saber 密钥生成 | — | — | — | Saber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=3 · μ=8 · T=2^4；公钥 992 字节 · 私钥 2304 字节 · 密文 1088 字节… |
| `saber-encaps` | Saber 封装（公钥加密） | — | — | — | Saber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=3 · μ=8 · T=2^4；公钥 992 字节 · 私钥 2304 字节 · 密文 1088 字节… |
| `saber-decaps` | Saber 解封装（私钥解密） | — | — | — | Saber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=3 · μ=8 · T=2^4；公钥 992 字节 · 私钥 2304 字节 · 密文 1088 字节… |
| `firesaber-keygen` | FireSaber 密钥生成 | — | — | — | FireSaber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=4 · μ=6 · T=2^6；公钥 1312 字节 · 私钥 3040 字节 · 密文 14… |
| `firesaber-encaps` | FireSaber 封装（公钥加密） | — | — | — | FireSaber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=4 · μ=6 · T=2^6；公钥 1312 字节 · 私钥 3040 字节 · 密文 14… |
| `firesaber-decaps` | FireSaber 解封装（私钥解密） | — | — | — | FireSaber：基于模格 MLWR 的 IND-CCA2 KEM（NIST Round 3 决赛候选）。 参数 L=4 · μ=6 · T=2^6；公钥 1312 字节 · 私钥 3040 字节 · 密文 14… |
| `ntruhps2048509-keygen` | NTRU-HPS 2048-509 密钥生成 | — | — | — | NTRU-HPS 2048-509：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=509 · q=2^11 · HPS 采样（iid + f… |
| `ntruhps2048509-encaps` | NTRU-HPS 2048-509 封装（公钥加密） | — | — | — | NTRU-HPS 2048-509：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=509 · q=2^11 · HPS 采样（iid + f… |
| `ntruhps2048509-decaps` | NTRU-HPS 2048-509 解封装（私钥解密） | — | — | — | NTRU-HPS 2048-509：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=509 · q=2^11 · HPS 采样（iid + f… |
| `ntruhps2048677-keygen` | NTRU-HPS 2048-677 密钥生成 | — | — | — | NTRU-HPS 2048-677：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=677 · q=2^11 · HPS 采样（iid + f… |
| `ntruhps2048677-encaps` | NTRU-HPS 2048-677 封装（公钥加密） | — | — | — | NTRU-HPS 2048-677：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=677 · q=2^11 · HPS 采样（iid + f… |
| `ntruhps2048677-decaps` | NTRU-HPS 2048-677 解封装（私钥解密） | — | — | — | NTRU-HPS 2048-677：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=677 · q=2^11 · HPS 采样（iid + f… |
| `ntruhps4096821-keygen` | NTRU-HPS 4096-821 密钥生成 | — | — | — | NTRU-HPS 4096-821：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=821 · q=2^12 · HPS 采样（iid + f… |
| `ntruhps4096821-encaps` | NTRU-HPS 4096-821 封装（公钥加密） | — | — | — | NTRU-HPS 4096-821：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=821 · q=2^12 · HPS 采样（iid + f… |
| `ntruhps4096821-decaps` | NTRU-HPS 4096-821 解封装（私钥解密） | — | — | — | NTRU-HPS 4096-821：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=821 · q=2^12 · HPS 采样（iid + f… |
| `ntruhrss701-keygen` | NTRU-HRSS 701 密钥生成 | — | — | — | NTRU-HRSS 701：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=701 · q=2^13 · HRSS 采样（sample_iid… |
| `ntruhrss701-encaps` | NTRU-HRSS 701 封装（公钥加密） | — | — | — | NTRU-HRSS 701：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=701 · q=2^13 · HRSS 采样（sample_iid… |
| `ntruhrss701-decaps` | NTRU-HRSS 701 解封装（私钥解密） | — | — | — | NTRU-HRSS 701：NTRU 系 IND-CCA2 KEM（NIST Round 3 决赛候选，未被 FIPS 203 收录）。 参数 N=701 · q=2^13 · HRSS 采样（sample_iid… |
| `ntrulpr653-keygen` | NTRU-LPRime 653 密钥生成 | — | — | — | NTRU-LPRime 653：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=653 · q=4621 · w=252 · I=256；公钥 89… |
| `ntrulpr653-encaps` | NTRU-LPRime 653 封装（公钥加密） | — | — | — | NTRU-LPRime 653：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=653 · q=4621 · w=252 · I=256；公钥 89… |
| `ntrulpr653-decaps` | NTRU-LPRime 653 解封装（私钥解密） | — | — | — | NTRU-LPRime 653：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=653 · q=4621 · w=252 · I=256；公钥 89… |
| `ntrulpr857-keygen` | NTRU-LPRime 857 密钥生成 | — | — | — | NTRU-LPRime 857：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=857 · q=5167 · w=281 · I=256；公钥 11… |
| `ntrulpr857-encaps` | NTRU-LPRime 857 封装（公钥加密） | — | — | — | NTRU-LPRime 857：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=857 · q=5167 · w=281 · I=256；公钥 11… |
| `ntrulpr857-decaps` | NTRU-LPRime 857 解封装（私钥解密） | — | — | — | NTRU-LPRime 857：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=857 · q=5167 · w=281 · I=256；公钥 11… |
| `ntrulpr1277-keygen` | NTRU-LPRime 1277 密钥生成 | — | — | — | NTRU-LPRime 1277：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=1277 · q=7879 · w=429 · I=256；公钥 … |
| `ntrulpr1277-encaps` | NTRU-LPRime 1277 封装（公钥加密） | — | — | — | NTRU-LPRime 1277：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=1277 · q=7879 · w=429 · I=256；公钥 … |
| `ntrulpr1277-decaps` | NTRU-LPRime 1277 解封装（私钥解密） | — | — | — | NTRU-LPRime 1277：NTRU Prime 的 LPRime 族（与 sntrup761 不同族，不是同一算法的另一参数）。 参数 p=1277 · q=7879 · w=429 · I=256；公钥 … |
| `xmss-verify` | XMSS 验签（RFC 8391 后量子哈希签名） | — | — | — | 验证 XMSS 签名：由 WOTS+ 签名还原叶子公钥 → L-tree → 沿认证路径上溯 → 比对根。属状态化哈希签名（NIST SP 800-208 批准），安全性仅依赖哈希函数。官方向量 36/36（12 … |
| `xmss-sign` | XMSS 签名（RFC 8391，仅 h=10） | — | — | — | XMSS 签名：消息经 H_msg 绑定随机量与根 → WOTS+ 签名 + 认证路径。⚠ 状态化：同一 leaf index 复用会导致私钥泄露，签名后须把私钥内索引 +1。官方向量 12/12。仅支持 h=10… |
| `xmss-keygen` | XMSS 密钥生成（RFC 8391，仅 h=10） | — | — | — | 生成 XMSS 密钥对：私钥含 OID‖根‖公钥种子‖索引‖PRF‖WOTS 种子，公钥为 OID‖根‖公钥种子。需建 1024 叶子的 Merkle 树（每叶一个 WOTS+ 公钥），耗时数秒。仅支持 h=10。 |
| `lms-keygen` | LMS 密钥生成（RFC 8554，公钥） | — | — | — | 由 SEED 与 I 生成 LMS 公钥（RFC 8554 Appendix A 伪随机私钥派生）。公钥 = u32(LMS类型)‖u32(LMOTS类型)‖I‖树根。官方 TC2 顶层密钥（H10/W4）逐字节一… |
| `lms-sign` | LMS 签名（RFC 8554） | — | — | — | 用指定叶子 q 对消息签名：LM-OTS 签名 + 认证路径。⚠ 状态化签名：同一 q 复用会直接泄露私钥，签完必须把 q 前进。C 为可选随机量，留空则用全零（仅调试用，实际必须随机）。 |
| `lms-verify` | LMS 验签（RFC 8554） | — | — | — | 验证 LMS 签名：由 y 走完剩余 Winternitz 链得到 LM-OTS 公钥，再沿认证路径上溯到根，与公钥中的树根比对。消息或签名任一字节被改动都会判为无效。 |

### 椭圆曲线与高级代数（23）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `bls_sig` | BLS 签名（BLS12-381） | — | — | — | BLS 签名（BLS12-381，G1 套件 BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_）：签名短（96 字节）、天然支持签名聚合。私钥 32 字节，公钥 192 字节（… |
| `bls_pair` | BLS12-381 配对 e(P,Q) | — | — | — | BLS12-381 的最优 Ate 配对 e(P, Q)，结果落在 FQ12（12 个系数，共 576 字节）。配对是 BLS 签名、身份加密、零知识证明的基础构件。与 py_ecc 逐系数比对通过。 |
| `x448` | X448 密钥交换 | — | 56B | — | X448（RFC 7748），448 位 Montgomery 曲线，与 X25519 同族。私钥/公钥/共享密钥均为 56 字节。用法：私钥栏留空点【加密】生成密钥对，把公钥发给对方；再把私钥填密钥栏、对方公钥填… |
| `ed448` | Ed448 签名 | — | 57B | — | Ed448（RFC 8032）：448 位 Edwards 曲线，SHAKE256 哈希。私钥/公钥 57 字节，签名 114 字节。用法：密钥栏留空点【加密】生成密钥对；签名时输入区放消息、密钥栏放私钥；验签时输… |
| `schnorr` | Schnorr 签名 (BIP-340) | — | — | — | BIP-340 Schnorr 签名（secp256k1）：64 字节签名，比 ECDSA 更简洁、可证明安全、天然不可延展。点【加密】= 用私钥签名输入内容；点【解密】= 密钥栏填公钥、参数栏填签名来验签。 |
| `bip32` | BIP-32 HD 钱包派生 | — | — | — | BIP-32 分层确定性钱包：从种子派生 secp256k1 密钥树。支持硬化（' 或 h）与普通派生。输出 xprv / xpub 及私钥、公钥、链码。第一栏可直接粘 BIP-39 助记词（自动走 PBKDF2-… |
| `bn254-pairing` | BN254 / alt_bn128 配对 | — | — | — | BN254（又称 alt_bn128）最优 ate 配对，以太坊 precompile 0x8 使用的曲线，zkSNARK 常用。输出 384 字节（12 个 FQ 分量）。配对无对应的「解密」。 |
| `bls12-377-pairing` | BLS12-377 配对 | — | — | — | BLS12-377 最优 ate 配对（Zcash 使用的曲线，也用于 Celo / Aleo）。FQ2 为 u^2=-5、FQ12 为 w^12=-5，与 BLS12-381 的塔构造不同。输出 576 字节。配… |
| `bls12-377-hash-to-field` | BLS12-377 哈希到域（RFC 9380 XMD） | — | — | — | RFC 9380 expand_message_xmd(SHA-256) + hash_to_field，把消息映射成 BLS12-377 的域元素。参数填 m:count（如 1:2 得两个 FQ，2:2 得两个… |
| `bls12-377-hash-to-curve-g1` | BLS12-377 哈希到曲线 G1（SSWU） | — | — | — | RFC 9380 SSWU_RO_：消息 → 两个域元素 → 同源曲线上 SSWU → 2 度同源映射回 G1 → 相加 → 乘有效余因子 h_eff=(x−1)。输出 G1 点（在 r 阶子群内）。官方向量 5 … |
| `bls12-377-hash-to-curve-g2` | BLS12-377 哈希到曲线 G2（SSWU） | — | — | — | 同上，映射到 G2（FQ2 上）。SSWU 的 Z 取 ZETA=12+u，同源映射为 24/23/34/34 项的有理映射。输出 G2 点（192 字节）。官方向量 5 组逐项一致。 |
| `ristretto255` | Ristretto255 群运算 | — | — | — | Ristretto255（RFC 9496）：Ed25519 曲线的【素数阶商群】，消除 8 阶余因子，编码唯一。已用 RFC 9496 附录 A.2 的 B[1..15] 全部 15 组向量验证，并验证商群等价性… |
| `decaf448` | Decaf448 群运算 | — | — | — | Decaf448（RFC 9496 §5）：Ed448-Goldilocks 的素数阶商群，56 字节编码、编码唯一，消除 4 阶余因子。已用 RFC 9496 附录 B.1 的 B[1..15] 全部 15 组验… |
| `kzg-commit` | KZG 多项式承诺（BN254） | — | — | — | BN254 上的 KZG 多项式承诺。 【输入】系数（低次在前）；【密钥】s；【参数】求值点 x。 ⚠ 真实可信设置须多方仪式产生并销毁 s，此处仅供学习。 |
| `kzg-pairing` | BN254 配对 | — | — | — | BN254（alt_bn128）最优 ate 配对 e(P, Q)，输出 FQ12 元素 384 字节。已与 py_ecc 逐系数比对 8/8 并验证双线性 e(aG1,bG2)=e(G1,G2)^(ab)。以太坊… |
| `sm9-pairing` | SM9 配对（R-ate） | — | — | — | SM9（GM/T 0044-2016）使用的 BN 曲线 R-ate 配对。塔构造为 F_p2(u^2=-2) → F_p4(v^2=u) → F_p12(w^3=v)，与 BLS12-381 / BN254 的塔… |
| `bulletproof-verify` | Bulletproofs 范围证明验证（Ristretto255） | — | — | — | 校验 dalek bulletproofs 生成的范围证明。 【输入】证明 Hex；【密钥】值承诺 V（多个用逗号分隔，个数即 m）；【参数】位宽 n。 ⚠ 只有验证方，无证明方。 |
| `verkle-commit` | Verkle Pedersen 向量承诺（Bandersnatch） | — | — | — | Pedersen 向量承诺 C = Σ vᵢ·Gᵢ（Bandersnatch 曲线），最多 256 个标量，具加性同态。生成元由公开种子透明派生，无需可信设置。 【输入】空格分隔的标量。 【解密】64 位十六进制 … |
| `verkle-root` | Verkle 树根承诺（EIP-6800） | — | — | — | 按 EIP-6800 算 Verkle 状态根，每行 key:value（各 32 字节十六进制）。输出 state_root = 根承诺点压缩序列化，与 geth / rust-verkle 一致。向量：rust… |
| `verkle-hash64` | Verkle Pedersen 哈希 hash64 / 树键派生 | — | — | — | Verkle 树键派生。 【用法】64 字节 Hex → 算 hash64；或「32字节地址:索引」→ 算 base_hash 并列出 5 个头字段树键。 |
| `verkle-ipa-prove` | Verkle 内积论证 IPA 证明（多项式求值） | — | — | — | 为「承诺 C 的多项式在 z 处取值 out」生成 IPA 证明。 【输入】系数（空格分隔，个数为 2 的幂且 ≤256）；【参数】求值点 z。 ⚠ 与 Bulletproofs 的 IPA 约定不同，不可混用。 |
| `verkle-ipa-verify` | Verkle 内积论证 IPA 验证 | — | — | — | 校验一份 IPA 证明。输入栏填证明十六进制（上面那条目的输出）。 参数栏填求值点 z；也可写 "z:out" 显式指定声称的求值结果（与证明内不一致则失败）。 输出明确给出 ✓ 通过 或 ✗ 失败。 |
| `ecdsa-recover` | ECDSA 公钥恢复（从签名还原公钥） | — | — | — | 由 ECDSA 签名 (r,s) 与恢复位 v 反推签名者公钥：Q = r⁻¹·(s·R − e·G)。比特币/以太坊交易验签即用此机制。输入框填【消息摘要】（Hex，不是原文）：e 取其字节按曲线阶长截断的整数。… |

### 分布式与门限密码（4）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `vss` | Feldman VSS 可验证秘密共享 | — | — | — | Feldman VSS：把秘密拆成 n 份，任意 t+1 份可重构，少于 t+1 份得不到任何信息；每份份额可用公开承诺独立验证真伪。份额编号从 1 开始（从 0 会直接泄露秘密）。 |
| `dkg` | Pedersen DKG 分布式密钥生成 | — | — | — | Pedersen DKG：n 个参与者各自作为 dealer 分发份额，最终形成一个【无人知道完整私钥】的共享密钥。需至少 t+1 方协作才能签名/解密。输出各方份额与组合后的群公钥。 |
| `sss-split` | Shamir 门限拆分（SSS） | — | — | — | Shamir 秘密共享（GF(256)，AES 域多项式 0x11B）。加密：输入秘密，参数栏填「t,n」拆成 n 份（编号从 1 起，任意 t 份可还原）；解密：粘贴任意 t 份（每行「编号:Hex」），参数栏填… |
| `sss-recover` | Shamir 门限还原（SSS） | — | — | — | Shamir 秘密共享还原（GF(256)）。输入区粘贴份额，每行一条「编号:Hex」，参数栏填门限 t。⚠ 份数不足时不会报错，只会给出错误结果。 |

### 认证加密（19）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `cose-mac0` | COSE_MAC0（RFC 8152） | — | — | — | COSE_MAC0（RFC 8152）：对 MAC_structure = ["MAC0", protected, external_aad, payload] 做 HMAC，只认证不加密。输出带 CBOR 标签 … |
| `cose-encrypt0` | COSE_Encrypt0（RFC 8152） | — | — | — | COSE_Encrypt0（RFC 8152）：AAD 是 CBOR 编码的 Enc_structure = ["Encrypt0", protected, external_aad]，IV 放在 unprotec… |
| `jose-jwe` | JWE 加密/解密（RFC 7516） | — | — | — | JWE（RFC 7516）：compact 五段 = protected.encrypted_key.iv.ciphertext.tag，AAD 为 protected 的 base64url 原文。支持 dir/… |
| `ascon128a` | Ascon-128a（AEAD） | — | — | — | NIST SP 800-232 轻量级 AEAD 标准（高速变体，分块 16 字节）。密钥 16 字节填密钥栏，nonce 16 字节填参数栏；输入栏可用「AD的Hex,明文」带附加数据。已通过官方 LWC KAT… |
| `aegis128l` | AEGIS-128L（AEAD） | — | — | — | RFC 10032 高速 AEAD，基于 AES 轮函数、无需求逆。密钥 16 字节填密钥栏，nonce 16 字节填参数栏；输入栏可用「AD的Hex,明文」带附加数据，输出为密文‖标签。标签长度由「AEAD 标签… |
| `aegis256aead` | AEGIS-256（AEAD） | — | — | — | RFC 10032 高速 AEAD，256 位安全级别，状态 6 块 × 128 位。密钥 32 字节填密钥栏，nonce 32 字节填参数栏。nonce 可安全随机选取。标签长度由「AEAD 标签长度」下拉选择（… |
| `aegis128x2` | AEGIS-128X2（并行 AEAD） | — | — | — | AEGIS-128X2（RFC/draft-irtf-cfrg-aegis-aead，IANA AEAD 编号 34）。16 字节密钥填密钥栏，16 字节 nonce 填参数栏；输入「AD的Hex,明文」，输出密文… |
| `aegis128x4` | AEGIS-128X4（并行 AEAD） | — | — | — | AEGIS-128X4（RFC/draft-irtf-cfrg-aegis-aead，IANA AEAD 编号 35）。16 字节密钥填密钥栏，16 字节 nonce 填参数栏；输入「AD的Hex,明文」，输出密文… |
| `aegis256x2` | AEGIS-256X2（并行 AEAD） | — | — | — | AEGIS-256X2（RFC/draft-irtf-cfrg-aegis-aead，IANA AEAD 编号 36）。32 字节密钥填密钥栏，32 字节 nonce 填参数栏；输入「AD的Hex,明文」，输出密文… |
| `aegis256x4` | AEGIS-256X4（并行 AEAD） | — | — | — | AEGIS-256X4（RFC/draft-irtf-cfrg-aegis-aead，IANA AEAD 编号 37）。32 字节密钥填密钥栏，32 字节 nonce 填参数栏；输入「AD的Hex,明文」，输出密文… |
| `aegismac128l` | AEGISMAC-128L | — | — | — | AEGISMAC-128L：AEGIS-128L 之上的纯认证 MAC（单向）。密钥 16 字节、nonce 16 字节；输入待认证数据，输出标签，标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节）。… |
| `aegismac256` | AEGISMAC-256 | — | — | — | AEGISMAC-256：AEGIS-256 之上的纯认证 MAC（单向）。密钥 32 字节、nonce 32 字节；输入待认证数据，输出标签，标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节）。校验… |
| `aegismac128x2` | AEGISMAC-128X2 | — | — | — | AEGISMAC-128X2：AEGIS-128X2 之上的纯认证 MAC（单向）。密钥 16 字节、nonce 16 字节；输入待认证数据，输出标签，标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节… |
| `aegismac128x4` | AEGISMAC-128X4 | — | — | — | AEGISMAC-128X4：AEGIS-128X4 之上的纯认证 MAC（单向）。密钥 16 字节、nonce 16 字节；输入待认证数据，输出标签，标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节… |
| `aegismac256x2` | AEGISMAC-256X2 | — | — | — | AEGISMAC-256X2：AEGIS-256X2 之上的纯认证 MAC（单向）。密钥 32 字节、nonce 32 字节；输入待认证数据，输出标签，标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节… |
| `aegismac256x4` | AEGISMAC-256X4 | — | — | — | AEGISMAC-256X4：AEGIS-256X4 之上的纯认证 MAC（单向）。密钥 32 字节、nonce 32 字节；输入待认证数据，输出标签，标签长度由「AEAD 标签长度」下拉选择（16 或 32 字节… |
| `eax-aes128` | AES-128-EAX（认证加密，可变 tag） | — | — | — | EAX 模式（Bellare-Rogaway-Wagner）：CTR 加密 + 两个 CMAC，输出 = nonce ‖ 密文 ‖ tag。tag 长度可变（8/12/16 字节），默认 16——注意 OMAC^t… |
| `eax-aes192` | AES-192-EAX（认证加密，可变 tag） | — | — | — | EAX 模式（Bellare-Rogaway-Wagner）：CTR 加密 + 两个 CMAC，输出 = nonce ‖ 密文 ‖ tag。tag 长度可变（8/12/16 字节），默认 16——注意 OMAC^t… |
| `eax-aes256` | AES-256-EAX（认证加密，可变 tag） | — | — | — | EAX 模式（Bellare-Rogaway-Wagner）：CTR 加密 + 两个 CMAC，输出 = nonce ‖ 密文 ‖ tag。tag 长度可变（8/12/16 字节），默认 16——注意 OMAC^t… |

### 密钥派生（3）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `hchacha20` | HChaCha20 子密钥派生 | — | 32B | ✅ | HChaCha20：ChaCha 的「不加初始状态」变体，输入 32 字节密钥 + 16 字节 nonce，输出 32 字节子密钥。它是 XChaCha20 的第一步（子密钥 = HChaCha20(key, no… |
| `mtproto-kdf` | MTProto 2.0 密钥派生（auth_key+msg_key→aes_key/aes_iv） | — | — | — | MTProto 2.0 的 KDF：a=SHA256(msg_key‖auth_key[x:x+36])，b=SHA256(auth_key[x+40:x+76]‖msg_key)；aes_key=a[0:8]‖b… |
| `mtproto1-kdf` | MTProto 1.0 密钥派生（auth_key+msg_key→aes_key/aes_iv） | — | — | — | MTProto 1.0 的 KDF（已废弃，仅兼容验证）：四个 SHA-1 由 msg_key 与auth_key 四段交叉拼出；aes_key=a[0:8]‖b[8:20]‖c[4:16]，aes_iv=a[8:… |

### 后量子（3）

| id | 名称 | 块 | 密钥 | 填 IV | 说明要点 |
|---|---|---:|---:|:--:|---|
| `falcon-verify` | Falcon 验签（FN-DSA / FIPS 205） | — | — | — | 验证 Falcon 签名。公钥按 NTT 域解码，签名还原 s2，消息经 SHAKE256 映射格点后检查范数是否小于 beta²。参数集由签名头字节自动识别（0x39=512、0x3A=1024）。已过 NIST… |
| `falcon-sign` | Falcon 签名（FN-DSA / FIPS 205） | — | — | — | 用 Falcon 私钥签名，输出 0x3n 头 + 40 字节 nonce + comp 编码的 s2。参数集由私钥头自动识别（0x59=512、0x5A=1024）。流程复刻 PQClean：SHAKE256(n… |
| `falcon-keygen` | Falcon 密钥生成（FN-DSA / FIPS 205） | — | — | — | 生成 Falcon 密钥对。种子经 SHAKE256 高斯采样得 f、g，解 f·G−g·F=q 得 F、G，算 h=g/f 编码。【官方对拍】同种子下 pk 与 PQClean 逐字节一致（512 测 8 组、1… |

## 四、常见算法参数速查

| 算法族 | 密钥 | nonce/IV | 标签 | 出处 |
|---|---|---|---|---|
| AES-128/192/256 分组 | 16/24/32 B | —（模式层给） | — | FIPS 197 |
| AES-GCM | 16/24/32 B | 12 B | 16 B | SP 800-38D |
| AES-CCM | 16/24/32 B | 7~13 B | 4~16 B 偶数 | RFC 3610 / SP 800-38C |
| AES-EAX | 16/24/32 B | 任意 | 16 B | ANSI C12.22 |
| AES-OCB3 | 16/24/32 B | 12 B | ≤16 B | RFC 7253 |
| AES-GCM-SIV | 16/32 B | 12 B | 16 B | RFC 8452 |
| AEGIS-128L / 256 | 16 / 32 B | 16 / 32 B | 16 或 32 B | RFC 10032 |
| AEGIS-128X2/X4 | 16 B | 16 B | 16 或 32 B | draft-irtf-cfrg-aegis-aead |
| AEGIS-256X2/X4 | 32 B | 32 B | 16 或 32 B | 同上 |
| ChaCha20-Poly1305 | 32 B | 12 B | 16 B | RFC 8439 |
| XChaCha20-Poly1305 | 32 B | 24 B | 16 B | draft-irtf-cfrg-xchacha |
| XChaCha20（流） | 32 B | 24 B | — | libsodium 官方向量 |
| HChaCha20（派生） | 32 B | 16 B | 输出 32 B | libsodium tv_hchacha20 |
| Ascon-128 / 128a | 16 B | 16 B | 16 B | NIST SP 800-232 |
| Camellia / SM4 / ARIA | 16/24/32 B | — | — | RFC 5528 / GM/T / RFC 5794 |

## 五、底层原语与依赖说明

| 算法 | 依赖的底层部件 |
|---|---|
| AEGIS 全系 | AES 轮函数（只需 `enc`，不需要逆轮）+ AES-NI 无关 |
| AEGISMAC | 同上；校验入口独立，不走 AEAD 标签路径 |
| GCM / GHASH | GF(2^128) 乘，位序 MSB=x⁰ |
| GCM-SIV / POLYVAL | GF(2^128) 乘，位序 **byte0 的 LSB=x⁰**（与 GHASH 相反） |
| Camellia | 4 个 S 盒 + FL/FL⁻¹，128 位 Feistel |
| SM4 | S 盒 + 32 轮非平衡 Feistel，国密 GM/T 0002 |
| Kalyna（DSTU 7624） | 4 个 S 盒 + MDS 矩阵，even/odd 两套密钥扩展 |
| Anubis | 原版 S 盒（**不是** Linux 内核 tweaked 版）+ T0~T5 六表 + rc 19 项 |
| KHAZAD | S 盒（与 Anubis 同源）+ MDS；GF(2^8) 多项式 **0x1D**（不是 0x11B） |
| CLEFIA | 双 S 盒 S0/S1 + DSM 双扩散矩阵 + 24/48 轮常量 |
| LEA | 三链 ARX，delta 按轮旋转；256 位为 8 链 × 24 步（结构不同） |
| HIGHT | ARX + 字节置换；解密索引是加密索引的循环左移一位 |
| SIMECK | Simon 变体，轮常量 **44 位**（64 位参数集） |
| CHAM / SIMON / SPECK | ARX；z 常量与轮数取自 Crypto++ 源码 |
| LOKI89 / LOKI91 | 大端语义；官方 C 需 `-DLITTLE_ENDIAN` 编译 |
| KDF/DRBG | Hash-DRBG 5042 条、CTR-DRBG 4321 条官方向量全过 |

## 六、已知限制

| 项 | 说明 |
|---|---|
| LEA-256 | 密钥扩展与 128/192 结构不同，本实现按官方 `lea.cpp` 192 条赋值转写 |
| CTR-DRBG | provided_data 超 seedlen 用折叠 XOR，**偏离标准 leftmost**，由 4321 条官方向量钉死，勿改 |
| ChaCha 内核 | 采用 8 字节 counter 布局（Adiantum 依赖），过 2^32 会与 RFC 8439 分叉 |
| Anubis | 只用官方原版 S 盒，与 Linux 内核 `crypto/anubis.c` 不互通 |
| testscript | 部分脚本硬编码 `/data/workspace/...`，换机器会报缺文件，不代表算法有问题 |
