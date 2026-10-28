/* i18n_algo.js —— 算法说明（ALGOS[i].info）的多语言翻译（第一片：编码 / 校验和）
 *
 * 为什么单独一个文件：
 *   i18n.js 管的是「界面外壳」（按钮、标签、报错）。算法说明有 441 条、动辄上百字，
 *   塞进 i18n.js 会让那个文件无法维护。这里按条目 id 建表，分片加载（本文件 + i18n_algo_hash.js + …）。
 *
 * 核心原则（改动前请读）：
 * 1. 【增量覆盖】未收录的条目原样返回中文原文，绝不渲染成 undefined 或空串。
 *    所以可以一批一批地补，没补到的条目行为与加这个文件之前完全一致。
 * 2. 【专有名词不翻】AES / SHA-256 / RFC 4648 / BIP-173 / Base64 … 一律保持原样。
 *    翻了用户就跟官方文档和别的工具对不上号。算法名、模式缩写、标准编号同理。
 * 3. 【数组顺序】与 i18n.js 的 LANGS 严格一致：
 *      zh-CN / zh-TW / en / ja / ko / fr / de / ru
 *    缺译那一格留空串 ''，会自动回退 zh-CN。
 * 4. 【校验】testscript/t_i18n_algo.js 会逐条比对「本表的 zh-CN」与「运行期 ALGOS[i].info」。
 *    算法说明一旦改动而译文没跟上，测试会直接报「原文漂移」——不会静默显示旧译文。
 */
(function () {
  'use strict';

  /* 每条 8 种语言，顺序见上面第 3 条。 */
  var INFO = {

    /* ========== 编码 ========== */
    'base64': ['标准 Base64 编码，输入文本按 UTF-8 处理。',
      '標準 Base64 編碼，輸入文字以 UTF-8 處理。',
      'Standard Base64 encoding; input text is treated as UTF-8.',
      '標準の Base64 エンコード。入力テキストは UTF-8 として扱います。',
      '표준 Base64 인코딩. 입력 텍스트는 UTF-8로 처리합니다.',
      'Encodage Base64 standard ; le texte saisi est traité en UTF-8.',
      'Standard-Base64-Kodierung; der Eingabetext wird als UTF-8 behandelt.',
      'Стандартное кодирование Base64; входной текст обрабатывается как UTF-8.'],

    'base32': ['RFC 4648 Base32 编码。',
      'RFC 4648 Base32 編碼。',
      'Base32 encoding as defined in RFC 4648.',
      'RFC 4648 の Base32 エンコード。',
      'RFC 4648 Base32 인코딩.',
      'Encodage Base32 selon la RFC 4648.',
      'Base32-Kodierung gemäß RFC 4648.',
      'Кодирование Base32 по RFC 4648.'],

    'base58': ['比特币风格 Base58。',
      '比特幣風格的 Base58。',
      'Bitcoin-style Base58.',
      'Bitcoin 形式の Base58。',
      '비트코인 스타일의 Base58.',
      'Base58 de style Bitcoin.',
      'Base58 im Bitcoin-Stil.',
      'Base58 в стиле Bitcoin.'],

    'base85': ['ASCII85 编码。',
      'ASCII85 編碼。',
      'ASCII85 encoding.',
      'ASCII85 エンコード。',
      'ASCII85 인코딩.',
      'Encodage ASCII85.',
      'ASCII85-Kodierung.',
      'Кодирование ASCII85.'],

    'url': ['encodeURIComponent / decodeURIComponent。',
      'encodeURIComponent / decodeURIComponent。',
      'encodeURIComponent / decodeURIComponent.',
      'encodeURIComponent / decodeURIComponent。',
      'encodeURIComponent / decodeURIComponent.',
      'encodeURIComponent / decodeURIComponent.',
      'encodeURIComponent / decodeURIComponent.',
      'encodeURIComponent / decodeURIComponent.'],

    'html': ['转义 & < > " 单引号。',
      '跳脫 & < > " 單引號。',
      'Escapes & < > " and the single quote.',
      '& < > " と単一引用符をエスケープします。',
      '& < > " 및 작은따옴표를 이스케이프합니다.',
      'Échappe & < > " et l’apostrophe.',
      'Maskiert & < > " und den einfachen Anführungsstrich.',
      'Экранирует & < > " и одинарную кавычку.'],

    'unicode': ['\\uXXXX 形式。',
      '\\uXXXX 形式。',
      'The \\uXXXX form.',
      '\\uXXXX 形式。',
      '\\uXXXX 형식.',
      'Forme \\uXXXX.',
      'Form \\uXXXX.',
      'Форма \\uXXXX.'],

    'hex': ['每字节两位 Hex。',
      '每位元組兩位 Hex。',
      'Two hex digits per byte.',
      '1 バイトを 2 桁の Hex で表します。',
      '바이트당 두 자리 Hex.',
      'Deux chiffres hexadécimaux par octet.',
      'Zwei Hex-Ziffern pro Byte.',
      'Два шестнадцатеричных символа на байт.'],

    'rot13': ['字母旋转 13。',
      '字母旋轉 13。',
      'Rotates letters by 13.',
      'アルファベットを 13 文字回転させます。',
      '알파벳을 13자리 회전.',
      'Rotation des lettres de 13.',
      'Buchstaben um 13 verschieben.',
      'Сдвиг букв на 13.'],

    'caesar': ['仅对字母移位。',
      '僅對字母位移。',
      'Shifts letters only.',
      'アルファベットのみをシフトします。',
      '알파벳만 이동시킵니다.',
      'Décale uniquement les lettres.',
      'Verschiebt nur Buchstaben.',
      'Сдвигает только буквы.'],

    'morse': ['字母间用空格，词间用 / 分隔。',
      '字母間以空格分隔，單詞間以 / 分隔。',
      'Spaces between letters, / between words.',
      '文字間は空白、単語間は / で区切ります。',
      '글자 사이는 공백, 단어 사이는 / 로 구분.',
      'Espaces entre les lettres, / entre les mots.',
      'Leerzeichen zwischen Buchstaben, / zwischen Wörtern.',
      'Пробелы между буквами, / между словами.'],

    'binary': ['每字节 8 位二进制。',
      '每位元組 8 位元二進位。',
      'Eight binary digits per byte.',
      '1 バイトを 8 桁の二進数で表します。',
      '바이트당 8자리 이진수.',
      'Huit chiffres binaires par octet.',
      'Acht Binärziffern pro Byte.',
      'Восемь двоичных символов на байт.'],

    'octal': ['每字节 3 位八进制。',
      '每位元組 3 位元八進位。',
      'Three octal digits per byte.',
      '1 バイトを 3 桁の八進数で表します。',
      '바이트당 3자리 8진수.',
      'Trois chiffres octaux par octet.',
      'Drei Oktalziffern pro Byte.',
      'Три восьмеричных символа на байт.'],

    'base45': ['RFC 草案 Base45，二维码疫苗证书用。2 字节→3 字符，1 字节→2 字符。',
      'RFC 草案 Base45，用於 QR code 疫苗憑證。2 位元組→3 字元，1 位元組→2 字元。',
      'Base45 (RFC draft), used for QR-code vaccination certificates. 2 bytes → 3 chars, 1 byte → 2 chars.',
      'RFC ドラフトの Base45。QR コードのワクチン証明書で使用。2 バイト→3 文字、1 バイト→2 文字。',
      'RFC 초안 Base45, QR 코드 백신 증명서용. 2바이트→3문자, 1바이트→2문자.',
      'Base45 (projet de RFC), utilisé pour les certificats de vaccination en QR code. 2 octets → 3 caractères, 1 octet → 2 caractères.',
      'Base45 (RFC-Entwurf), verwendet für QR-Code-Impfzertifikate. 2 Bytes → 3 Zeichen, 1 Byte → 2 Zeichen.',
      'Base45 (проект RFC), применяется в QR-кодах сертификатов вакцинации. 2 байта → 3 символа, 1 байт → 2 символа.'],

    'base62': ['0-9a-zA-Z 共 62 字符，常用于短链接。',
      '0-9a-zA-Z 共 62 個字元，常用於短網址。',
      '62 characters (0-9a-zA-Z), commonly used for short links.',
      '0-9a-zA-Z の 62 文字。短縮 URL によく使われます。',
      '0-9a-zA-Z 62개 문자, 주로 단축 링크에 사용.',
      '62 caractères (0-9a-zA-Z), souvent utilisés pour les liens courts.',
      '62 Zeichen (0-9a-zA-Z), häufig für Kurzlinks verwendet.',
      '62 символа (0-9a-zA-Z), часто используются для коротких ссылок.'],

    'base91': ['basE91（Joachim Henke），比 Base64 更省空间，输出含符号。',
      'basE91（Joachim Henke），比 Base64 更省空間，輸出含符號。',
      'basE91 (Joachim Henke): more compact than Base64; output contains symbols.',
      'basE91（Joachim Henke）。Base64 より省スペースで、出力に記号を含みます。',
      'basE91(Joachim Henke). Base64보다 공간 효율이 좋으며 출력에 기호가 포함됩니다.',
      'basE91 (Joachim Henke) : plus compact que Base64 ; la sortie contient des symboles.',
      'basE91 (Joachim Henke): kompakter als Base64; die Ausgabe enthält Symbole.',
      'basE91 (Joachim Henke): компактнее Base64; вывод содержит символы.'],

    'rot47': ['ASCII 33~126 范围内旋转 47 位，含数字与符号。',
      'ASCII 33~126 範圍內旋轉 47 位，包含數字與符號。',
      'Rotates by 47 within ASCII 33~126, covering digits and symbols.',
      'ASCII 33~126 の範囲で 47 文字回転させます。数字と記号を含みます。',
      'ASCII 33~126 범위에서 47자리 회전, 숫자와 기호 포함.',
      'Rotation de 47 dans la plage ASCII 33~126, chiffres et symboles inclus.',
      'Rotation um 47 im ASCII-Bereich 33~126, einschließlich Ziffern und Symbolen.',
      'Сдвиг на 47 в диапазоне ASCII 33~126, включая цифры и символы.'],

    'quoted-printable': ['RFC 2045 邮件编码。非可打印字节写成 =XX，行末空格与 TAB 也会转义。',
      'RFC 2045 郵件編碼。不可列印位元組寫成 =XX，行尾空格與 TAB 也會跳脫。',
      'RFC 2045 e-mail encoding. Non-printable bytes become =XX; trailing spaces and TABs are escaped too.',
      'RFC 2045 のメールエンコード。印字できないバイトは =XX となり、行末の空白と TAB もエスケープされます。',
      'RFC 2045 메일 인코딩. 출력 불가 바이트는 =XX 로, 행 끝 공백과 TAB도 이스케이프됩니다.',
      'Encodage e-mail RFC 2045. Les octets non imprimables deviennent =XX ; espaces et tabulations en fin de ligne sont aussi échappés.',
      'E-Mail-Kodierung nach RFC 2045. Nicht druckbare Bytes werden zu =XX; Leerzeichen und Tabulatoren am Zeilenende werden ebenfalls maskiert.',
      'Кодирование электронной почты RFC 2045. Непечатаемые байты превращаются в =XX; пробелы и табуляции в конце строки также экранируются.'],

    'uuencode': ['传统 Unix 二进制编码，含 begin/end 包裹行。',
      '傳統 Unix 二進位編碼，含 begin/end 包裹行。',
      'Traditional Unix binary encoding, with begin/end wrapper lines.',
      '従来の Unix バイナリエンコード。begin/end のラップ行を含みます。',
      '전통적인 Unix 바이너리 인코딩, begin/end 감싸는 줄 포함.',
      'Encodage binaire Unix traditionnel, avec les lignes d’encadrement begin/end.',
      'Klassische Unix-Binärkodierung, mit begin/end-Rahmenzeilen.',
      'Традиционное бинарное кодирование Unix со строками-обёртками begin/end.'],

    'punycode': ['RFC 3492，国际化域名编码（输入 Unicode 文字，输出 xn-- 后的部分）。',
      'RFC 3492，國際化網域名稱編碼（輸入 Unicode 文字，輸出 xn-- 之後的部分）。',
      'RFC 3492 internationalized domain name encoding (input Unicode text; output is the part after xn--).',
      'RFC 3492 の国際化ドメイン名エンコード（Unicode 文字を入力し、xn-- より後ろの部分を出力）。',
      'RFC 3492 국제화 도메인 이름 인코딩(Unicode 텍스트 입력, xn-- 이후 부분 출력).',
      'RFC 3492, encodage des noms de domaine internationalisés (texte Unicode en entrée ; sortie : la partie après xn--).',
      'RFC 3492, Kodierung internationalisierter Domänen (Eingabe: Unicode-Text; Ausgabe: der Teil nach xn--).',
      'RFC 3492, кодирование интернационализированных доменов (на входе текст Unicode, на выходе — часть после xn--).'],

    'base64url': ['RFC 4648 §5，URL/文件名安全变体（- 与 _，无填充 =），JWT 用。',
      'RFC 4648 §5，URL/檔名安全變體（- 與 _，無填充 =），JWT 使用。',
      'RFC 4648 §5: URL/filename-safe variant (- and _, no = padding), used by JWT.',
      'RFC 4648 §5。URL/ファイル名安全な変種（- と _、パディングの = なし）。JWT で使用。',
      'RFC 4648 §5, URL/파일명 안전 변형(- 및 _, = 패딩 없음), JWT 사용.',
      'RFC 4648 §5 : variante sûre pour URL/noms de fichier (- et _, sans remplissage =), utilisée par JWT.',
      'RFC 4648 §5: URL-/dateinamen-sichere Variante (- und _, ohne =-Padding), von JWT verwendet.',
      'RFC 4648 §5: вариант, безопасный для URL и имён файлов (- и _, без дополнения =), используется в JWT.'],

    'cbor': ['CBOR 是 RFC 8949 定义的结构化二进制编码（JSON 的二进制版）。加密方向：把输入的诊断表示（如 [1, {a: 2}, h\'0102\']）编码为 CBOR，输出十六进制；解密方向：解析十六进制 CBOR，输出诊断表示。',
      'CBOR 是 RFC 8949 定義的結構化二進位編碼（JSON 的二進位版）。加密方向：把輸入的診斷表示法（如 [1, {a: 2}, h\'0102\']）編碼為 CBOR，輸出十六進位；解密方向：解析十六進位 CBOR，輸出診斷表示法。',
      'CBOR is the structured binary encoding defined in RFC 8949 (the binary version of JSON). Encrypt: encode the input diagnostic notation (e.g. [1, {a: 2}, h\'0102\']) into CBOR and output hex. Decrypt: parse hex CBOR and output the diagnostic notation.',
      'CBOR は RFC 8949 で定義された構造化バイナリエンコード（JSON のバイナリ版）。暗号化方向：入力の診断表現（例 [1, {a: 2}, h\'0102\']）を CBOR にエンコードし、16 進数で出力。復号方向：16 進数の CBOR を解析し、診断表現を出力。',
      'CBOR은 RFC 8949에 정의된 구조화된 바이너리 인코딩(JSON의 바이너리 버전). 암호화: 입력 진단 표기(예: [1, {a: 2}, h\'0102\'])를 CBOR로 인코딩하여 16진수 출력. 복호화: 16진수 CBOR를 파싱하여 진단 표기 출력.',
      'CBOR est l’encodage binaire structuré défini par la RFC 8949 (la version binaire de JSON). Chiffrer : encoder la notation diagnostique saisie (ex. [1, {a: 2}, h\'0102\']) en CBOR, sortie hexadécimale. Déchiffrer : analyser le CBOR hexadécimal, sortie en notation diagnostique.',
      'CBOR ist die in RFC 8949 definierte strukturierte Binärkodierung (die Binärversion von JSON). Verschlüsseln: die eingegebene Diagnose-Notation (z. B. [1, {a: 2}, h\'0102\']) nach CBOR kodieren und hexadezimal ausgeben. Entschlüsseln: hexadezimales CBOR parsen und die Diagnose-Notation ausgeben.',
      'CBOR — структурированное бинарное кодирование, определённое в RFC 8949 (бинарная версия JSON). Шифрование: входная диагностическая нотация (например [1, {a: 2}, h\'0102\']) кодируется в CBOR, выводится шестнадцатеричный вид. Дешифрование: шестнадцатеричный CBOR разбирается, выводится диагностическая нотация.'],

    'bech32': ['Bech32 地址编码（BIP-173，比特币原生隔离见证地址用）。加密：输入 Hex，参数栏填人类可读前缀（如 bc）→ 输出 bech32；解密：输入 bech32 → 输出前缀与数据 Hex。向量来自 BIP-173 官方 Test vectors。',
      'Bech32 地址編碼（BIP-173，比特幣原生隔離見證地址用）。加密：輸入 Hex，參數欄填人類可讀前綴（如 bc）→ 輸出 bech32；解密：輸入 bech32 → 輸出前綴與資料 Hex。向量來自 BIP-173 官方 Test vectors。',
      'Bech32 address encoding (BIP-173, used by native Bitcoin SegWit addresses). Encrypt: enter hex and put the human-readable prefix (e.g. bc) in the parameters field → bech32 output. Decrypt: enter bech32 → outputs the prefix and the data in hex. Vectors are the official BIP-173 test vectors.',
      'Bech32 アドレスエンコード（BIP-173。Bitcoin のネイティブ SegWit アドレスで使用）。暗号化：Hex を入力し、パラメータ欄に人間可読プレフィックス（例 bc）を記入 → bech32 を出力。復号：bech32 を入力 → プレフィックスとデータを Hex で出力。ベクトルは BIP-173 公式 Test vectors 由来。',
      'Bech32 주소 인코딩(BIP-173, 비트코인 네이티브 SegWit 주소용). 암호화: Hex 입력, 파라미터에 사람이 읽을 수 있는 접두사(예: bc) → bech32 출력. 복호화: bech32 입력 → 접두사와 데이터 Hex 출력. 벡터는 BIP-173 공식 Test vectors.',
      'Encodage d’adresse Bech32 (BIP-173, utilisé par les adresses SegWit natives de Bitcoin). Chiffrer : saisir du hex et indiquer le préfixe lisible (ex. bc) dans les paramètres → sortie bech32. Déchiffrer : saisir du bech32 → sortie du préfixe et des données en hex. Vecteurs issus des test vectors officiels BIP-173.',
      'Bech32-Adresskodierung (BIP-173, verwendet von nativen Bitcoin-SegWit-Adressen). Verschlüsseln: Hex eingeben und das menschenlesbare Präfix (z. B. bc) im Parameterfeld angeben → Bech32-Ausgabe. Entschlüsseln: Bech32 eingeben → Ausgabe von Präfix und Daten als Hex. Vektoren stammen aus den offiziellen BIP-173-Testvektoren.',
      'Кодирование адресов Bech32 (BIP-173, используется в нативных SegWit-адресах Bitcoin). Шифрование: введите hex и укажите человекочитаемый префикс (например bc) в поле параметров → вывод bech32. Дешифрование: введите bech32 → вывод префикса и данных в hex. Векторы взяты из официальных тестовых векторов BIP-173.'],

    'bech32m': ['Bech32m 地址编码（BIP-350），校验和常量改为 0x2bc830a3，用于 Taproot 等见证版本 1+。用法同 Bech32。⚠ 与 Bech32 不兼容：同一数据用两种编码得到的串不同。',
      'Bech32m 地址編碼（BIP-350），檢查碼常數改為 0x2bc830a3，用於 Taproot 等見證版本 1+。用法同 Bech32。⚠ 與 Bech32 不相容：同一資料用兩種編碼得到的字串不同。',
      'Bech32m address encoding (BIP-350), checksum constant changed to 0x2bc830a3, used for Taproot and other witness version 1+. Usage is the same as Bech32. ⚠ Not compatible with Bech32: the same data yields different strings under the two encodings.',
      'Bech32m アドレスエンコード（BIP-350）。チェックサム定数が 0x2bc830a3 に変更され、Taproot など witness バージョン 1+ で使用。使い方は Bech32 と同じ。⚠ Bech32 と非互換：同じデータでも二つのエンコードで文字列が異なります。',
      'Bech32m 주소 인코딩(BIP-350), 체크섬 상수가 0x2bc830a3으로 변경, Taproot 등 witness 버전 1+ 용. 사용법은 Bech32와 동일. ⚠ Bech32와 호환되지 않음: 같은 데이터도 두 인코딩에서 다른 문자열이 됩니다.',
      'Encodage d’adresse Bech32m (BIP-350), constante de checksum remplacée par 0x2bc830a3, utilisé pour Taproot et autres versions de témoin 1+. Même usage que Bech32. ⚠ Incompatible avec Bech32 : une même donnée produit des chaînes différentes selon l’encodage.',
      'Bech32m-Adresskodierung (BIP-350), Prüfsummenkonstante auf 0x2bc830a3 geändert, verwendet für Taproot und andere Witness-Versionen 1+. Handhabung wie bei Bech32. ⚠ Nicht kompatibel mit Bech32: dieselben Daten ergeben bei beiden Kodierungen unterschiedliche Zeichenketten.',
      'Кодирование адресов Bech32m (BIP-350), константа контрольной суммы изменена на 0x2bc830a3, используется для Taproot и других версий witness 1+. Применение такое же, как у Bech32. ⚠ Несовместимо с Bech32: одни и те же данные дают разные строки при двух кодировках.'],

    'bip39-mnemonic': ['BIP-39 助记词（比特币/以太坊钱包标准）。加密：输入熵 Hex（16/20/24/28/32 字节）→ 12~24 个助记词；解密：输入助记词 → 还原熵并校验校验和，篡改会报错。词表为 bitcoin/bips 官方 2048 词。',
      'BIP-39 助記詞（比特幣/以太坊錢包標準）。加密：輸入熵 Hex（16/20/24/28/32 位元組）→ 12~24 個助記詞；解密：輸入助記詞 → 還原熵並驗證檢查碼，遭竄改會報錯。詞表為 bitcoin/bips 官方 2048 詞。',
      'BIP-39 mnemonic (the Bitcoin/Ethereum wallet standard). Encrypt: enter entropy in hex (16/20/24/28/32 bytes) → 12~24 mnemonic words. Decrypt: enter the mnemonic → recovers the entropy and verifies the checksum; tampering raises an error. The word list is the official 2048-word list from bitcoin/bips.',
      'BIP-39 ニーモニック（Bitcoin/イーサリアムのウォレット標準）。暗号化：エントロピーを Hex（16/20/24/28/32 バイト）で入力 → 12~24 個のニーモニック。復号：ニーモニックを入力 → エントロピーを復元しチェックサムを検証、改ざんはエラー。語彙は bitcoin/bips 公式の 2048 語。',
      'BIP-39 니모닉(비트코인/이더리움 지갑 표준). 암호화: 엔트로피 Hex(16/20/24/28/32바이트) 입력 → 12~24개 니모닉. 복호화: 니모닉 입력 → 엔트로피 복원 및 체크섬 검증, 변조 시 오류. 단어 목록은 bitcoin/bips 공식 2048단어.',
      'Mnémonique BIP-39 (standard des portefeuilles Bitcoin/Ethereum). Chiffrer : saisir l’entropie en hex (16/20/24/28/32 octets) → 12~24 mots mnémoniques. Déchiffrer : saisir la phrase → restaure l’entropie et vérifie la somme de contrôle ; toute altération provoque une erreur. La liste de mots est celle officielle de bitcoin/bips (2048 mots).',
      'BIP-39-Mnemonik (Standard für Bitcoin-/Ethereum-Wallets). Verschlüsseln: Entropie als Hex eingeben (16/20/24/28/32 Bytes) → 12~24 Mnemonic-Wörter. Entschlüsseln: Mnemonic eingeben → stellt die Entropie wieder her und prüft die Prüfsumme; Manipulation führt zu einem Fehler. Die Wortliste ist die offizielle 2048-Wort-Liste von bitcoin/bips.',
      'Мнемоника BIP-39 (стандарт кошельков Bitcoin/Ethereum). Шифрование: введите энтропию в hex (16/20/24/28/32 байта) → 12~24 мнемонических слова. Дешифрование: введите мнемонику → восстанавливает энтропию и проверяет контрольную сумму; подмена вызывает ошибку. Список слов — официальные 2048 слов из bitcoin/bips.'],

    'base58check': ['在 Base58 基础上追加 4 字节校验和（SHA-256d 的前 4 字节），用于比特币地址与 WIF 私钥。\n【验证】Botan base58c.vec 官方向量 4/4（含空输入 → 3QJmnh）。\n【说明】输入栏填文本时按 UTF-8 取字节；需要按原始字节编码请勾选 Hex 输入。',
      '在 Base58 基礎上追加 4 位元組檢查碼（SHA-256d 的前 4 位元組），用於比特幣地址與 WIF 私鑰。\n【驗證】Botan base58c.vec 官方向量 4/4（含空輸入 → 3QJmnh）。\n【說明】輸入欄填文字時按 UTF-8 取位元組；需按原始位元組編碼請勾選 Hex 輸入。',
      'Base58 plus a 4-byte checksum (the leading 4 bytes of SHA-256d), used for Bitcoin addresses and WIF private keys.\n[Verified] Botan base58c.vec official vectors 4/4 (including empty input → 3QJmnh).\n[Note] Text entered in the input field is taken as UTF-8 bytes; to encode raw bytes, tick the Hex input option.',
      'Base58 に 4 バイトのチェックサム（SHA-256d の先頭 4 バイト）を追加。Bitcoin アドレスと WIF 秘密鍵で使用。\n【検証】Botan base58c.vec 官方向量 4/4（空入力 → 3QJmnh を含む）。\n【説明】入力欄にテキストを入れた場合は UTF-8 のバイト列として扱います。生のバイトを符号化したい場合は Hex 入力をチェックしてください。',
      'Base58에 4바이트 체크섬(SHA-256d의 앞 4바이트)을 추가, 비트코인 주소와 WIF 개인키에 사용.\n【검증】Botan base58c.vec 공식 벡터 4/4(빈 입력 → 3QJmnh 포함).\n【설명】입력란에 텍스트를 넣으면 UTF-8 바이트로 처리합니다. 원시 바이트로 인코딩하려면 Hex 입력을 선택하세요.',
      'Base58 avec 4 octets de somme de contrôle ajoutés (les 4 premiers octets de SHA-256d), utilisé pour les adresses Bitcoin et les clés privées WIF.\n[Vérifié] Vecteurs officiels Botan base58c.vec 4/4 (y compris entrée vide → 3QJmnh).\n[Note] Le texte saisi est pris comme octets UTF-8 ; pour encoder des octets bruts, cochez l’entrée Hex.',
      'Base58 mit zusätzlicher 4-Byte-Prüfsumme (die ersten 4 Bytes von SHA-256d), verwendet für Bitcoin-Adressen und WIF-Private-Keys.\n[Verifiziert] Offizielle Botan-Vektoren base58c.vec 4/4 (einschließlich leerer Eingabe → 3QJmnh).\n[Hinweis] Text im Eingabefeld wird als UTF-8-Bytes behandelt; um rohe Bytes zu kodieren, die Hex-Eingabe aktivieren.',
      'Base58 с добавленной 4-байтовой контрольной суммой (первые 4 байта SHA-256d), используется для адресов Bitcoin и приватных ключей WIF.\n[Проверено] Официальные векторы Botan base58c.vec 4/4 (включая пустой ввод → 3QJmnh).\n[Примечание] Текст в поле ввода берётся как байты UTF-8; для кодирования исходных байтов отметьте ввод Hex.'],

    /* ========== 校验和 ========== */
    'crc32': ['CRC32（IEEE 802.3）：循环冗余校验，用于检测传输/存储中的意外改动。不是密码学算法，不能防篡改——需要防篡改请改用 HMAC 或 AEAD。',
      'CRC32（IEEE 802.3）：循環冗餘檢查，用於偵測傳輸/儲存中的意外變更。不是密碼學演算法，不能防竄改——需要防竄改請改用 HMAC 或 AEAD。',
      'CRC32 (IEEE 802.3): a cyclic redundancy check for detecting accidental changes during transmission or storage. It is not a cryptographic algorithm and cannot prevent tampering — use HMAC or an AEAD if you need that.',
      'CRC32（IEEE 802.3）：巡回冗長検査。転送や保存中の偶発的な変更の検出に用います。暗号アルゴリズムではないため改ざんは防げません。改ざん防止には HMAC または AEAD を使ってください。',
      'CRC32(IEEE 802.3): 전송/저장 중 우발적 변경을 탐지하는 순환 중복 검사. 암호화 알고리즘이 아니므로 변조를 막을 수 없습니다. 변조 방지가 필요하면 HMAC 또는 AEAD를 사용하세요.',
      'CRC32 (IEEE 802.3) : contrôle de redondance cyclique détectant les modifications accidentelles en transmission/stockage. Ce n’est pas un algorithme cryptographique et ne protège pas contre la falsification — utilisez HMAC ou un AEAD pour cela.',
      'CRC32 (IEEE 802.3): zyklische Redundanzprüfung zum Erkennen unbeabsichtigter Änderungen bei Übertragung/Speicherung. Es ist kein kryptografischer Algorithmus und schützt nicht vor Manipulation — verwenden Sie dafür HMAC oder ein AEAD.',
      'CRC32 (IEEE 802.3): циклический избыточный код для обнаружения случайных изменений при передаче или хранении. Это не криптографический алгоритм, он не защищает от подмены — для этого используйте HMAC или AEAD.'],

    'crc32c': ['CRC32C：Castagnoli 多项式，用于 iSCSI、SCTP、ext4 等。同样不是密码学算法。',
      'CRC32C：Castagnoli 多項式，用於 iSCSI、SCTP、ext4 等。同樣不是密碼學演算法。',
      'CRC32C: the Castagnoli polynomial, used by iSCSI, SCTP, ext4 and others. Also not a cryptographic algorithm.',
      'CRC32C：Castagnoli 多項式。iSCSI、SCTP、ext4 などで使用。同様に暗号アルゴリズムではありません。',
      'CRC32C: Castagnoli 다항식, iSCSI, SCTP, ext4 등에서 사용. 마찬가지로 암호화 알고리즘이 아닙니다.',
      'CRC32C : polynôme de Castagnoli, utilisé par iSCSI, SCTP, ext4, etc. Pas non plus un algorithme cryptographique.',
      'CRC32C: das Castagnoli-Polynom, verwendet von iSCSI, SCTP, ext4 u. a. Ebenfalls kein kryptografischer Algorithmus.',
      'CRC32C: полином Кастаньоли, используется в iSCSI, SCTP, ext4 и др. Также не является криптографическим алгоритмом.'],

    'adler32': ['Adler32：zlib 使用的滚动校验和，比 CRC32 快但对短数据较弱。同样不是密码学算法。',
      'Adler32：zlib 使用的滾動檢查碼，比 CRC32 快但對短資料較弱。同樣不是密碼學演算法。',
      'Adler32: the rolling checksum used by zlib; faster than CRC32 but weaker on short data. Also not a cryptographic algorithm.',
      'Adler32：zlib が使うローリングチェックサム。CRC32 より高速ですが短いデータには弱いです。同様に暗号アルゴリズムではありません。',
      'Adler32: zlib이 사용하는 롤링 체크섬. CRC32보다 빠르지만 짧은 데이터에는 약합니다. 마찬가지로 암호화 알고리즘이 아닙니다.',
      'Adler32 : somme de contrôle glissante utilisée par zlib ; plus rapide que CRC32 mais plus faible sur les données courtes. Pas non plus un algorithme cryptographique.',
      'Adler32: die von zlib verwendete rollierende Prüfsumme; schneller als CRC32, aber bei kurzen Daten schwächer. Ebenfalls kein kryptografischer Algorithmus.',
      'Adler32: скользящая контрольная сумма, используемая в zlib; быстрее CRC32, но слабее на коротких данных. Также не является криптографическим алгоритмом.'],

    'crc8': ['CRC8：8 位循环冗余校验，多项式 0x07，用于 SMBus、ATM 头校验等。数据量大时冲突率高，不能防篡改。',
      'CRC8：8 位元循環冗餘檢查，多項式 0x07，用於 SMBus、ATM 標頭檢查等。資料量大時衝突率高，不能防竄改。',
      'CRC8: an 8-bit cyclic redundancy check with polynomial 0x07, used for SMBus, ATM header checks and similar. Collision rate is high on large data; it cannot prevent tampering.',
      'CRC8：8 ビット巡回冗長検査。多項式 0x07。SMBus、ATM ヘッダ検査などで使用。データ量が多いと衝突率が高く、改ざんは防げません。',
      'CRC8: 다항식 0x07을 사용하는 8비트 순환 중복 검사, SMBus, ATM 헤더 검사 등에 사용. 데이터가 많으면 충돌률이 높고 변조를 막을 수 없습니다.',
      'CRC8 : contrôle de redondance cyclique 8 bits, polynôme 0x07, utilisé pour SMBus, les en-têtes ATM, etc. Taux de collision élevé sur de grands volumes ; ne protège pas contre la falsification.',
      'CRC8: 8-Bit-Redundanzprüfung mit Polynom 0x07, verwendet für SMBus, ATM-Headerprüfung u. a. Bei großen Datenmengen hohe Kollisionsrate; schützt nicht vor Manipulation.',
      'CRC8: 8-битовый циклический избыточный код с полиномом 0x07, используется в SMBus, проверке заголовков ATM и т. п. При больших объёмах данных высокая вероятность коллизий; не защищает от подмены.'],

    'crc16ccitt': ['CRC16-CCITT：多项式 0x1021，初值 0x0000，用于 XMODEM、蓝牙、红外。出厂检查值 "123456789" → 31C3。',
      'CRC16-CCITT：多項式 0x1021，初值 0x0000，用於 XMODEM、藍牙、紅外線。出廠檢查值 "123456789" → 31C3。',
      'CRC16-CCITT: polynomial 0x1021, initial value 0x0000, used by XMODEM, Bluetooth and IrDA. Check value "123456789" → 31C3.',
      'CRC16-CCITT：多項式 0x1021、初期値 0x0000。XMODEM、Bluetooth、赤外線で使用。チェック値 "123456789" → 31C3。',
      'CRC16-CCITT: 다항식 0x1021, 초기값 0x0000, XMODEM, 블루투스, 적외선에서 사용. 검사값 "123456789" → 31C3.',
      'CRC16-CCITT : polynôme 0x1021, valeur initiale 0x0000, utilisé par XMODEM, Bluetooth et IrDA. Valeur de contrôle "123456789" → 31C3.',
      'CRC16-CCITT: Polynom 0x1021, Anfangswert 0x0000, verwendet von XMODEM, Bluetooth und IrDA. Prüfwert "123456789" → 31C3.',
      'CRC16-CCITT: полином 0x1021, начальное значение 0x0000, используется в XMODEM, Bluetooth, IrDA. Проверочное значение "123456789" → 31C3.'],

    'crc16modbus': ['CRC16-MODBUS：多项式 0x8005，初值 FFFF，输入输出均反射，用于工业总线。检查值 "123456789" → 4B37。',
      'CRC16-MODBUS：多項式 0x8005，初值 FFFF，輸入輸出皆反射，用於工業匯流排。檢查值 "123456789" → 4B37。',
      'CRC16-MODBUS: polynomial 0x8005, initial value FFFF, input and output both reflected, used on industrial buses. Check value "123456789" → 4B37.',
      'CRC16-MODBUS：多項式 0x8005、初期値 FFFF。入出力とも反射。産業用バスで使用。チェック値 "123456789" → 4B37。',
      'CRC16-MODBUS: 다항식 0x8005, 초기값 FFFF, 입출력 모두 반사, 산업용 버스에 사용. 검사값 "123456789" → 4B37.',
      'CRC16-MODBUS : polynôme 0x8005, valeur initiale FFFF, entrée et sortie réfléchies, utilisé sur les bus industriels. Valeur de contrôle "123456789" → 4B37.',
      'CRC16-MODBUS: Polynom 0x8005, Anfangswert FFFF, Ein- und Ausgabe gespiegelt, verwendet in industriellen Bussen. Prüfwert "123456789" → 4B37.',
      'CRC16-MODBUS: полином 0x8005, начальное значение FFFF, вход и выход отражаются, используется в промышленных шинах. Проверочное значение "123456789" → 4B37.'],

    'crc64ecma': ['CRC64-ECMA-182：64 位 CRC，多项式 0x42F0E1EBA9EA3693，用于分布式存储去重。检查值 "123456789" → 6C40DF5F0B497347。',
      'CRC64-ECMA-182：64 位元 CRC，多項式 0x42F0E1EBA9EA3693，用於分散式儲存去重。檢查值 "123456789" → 6C40DF5F0B497347。',
      'CRC64-ECMA-182: a 64-bit CRC with polynomial 0x42F0E1EBA9EA3693, used for deduplication in distributed storage. Check value "123456789" → 6C40DF5F0B497347.',
      'CRC64-ECMA-182：64 ビット CRC。多項式 0x42F0E1EBA9EA3693。分散ストレージの重複排除で使用。チェック値 "123456789" → 6C40DF5F0B497347。',
      'CRC64-ECMA-182: 다항식 0x42F0E1EBA9EA3693을 사용하는 64비트 CRC, 분산 스토리지 중복 제거에 사용. 검사값 "123456789" → 6C40DF5F0B497347.',
      'CRC64-ECMA-182 : CRC 64 bits, polynôme 0x42F0E1EBA9EA3693, utilisé pour la déduplication en stockage distribué. Valeur de contrôle "123456789" → 6C40DF5F0B497347.',
      'CRC64-ECMA-182: 64-Bit-CRC mit Polynom 0x42F0E1EBA9EA3693, verwendet zur Deduplizierung in verteiltem Speicher. Prüfwert "123456789" → 6C40DF5F0B497347.',
      'CRC64-ECMA-182: 64-битовый CRC с полиномом 0x42F0E1EBA9EA3693, используется для дедупликации в распределённом хранилище. Проверочное значение "123456789" → 6C40DF5F0B497347.'],

    'crc64xz': ['CRC64-XZ：与 ECMA 同多项式但初值/输出全 1 并反射，xz 压缩格式与 Go 标准库采用。',
      'CRC64-XZ：與 ECMA 同多項式但初值/輸出全為 1 並反射，xz 壓縮格式與 Go 標準庫採用。',
      'CRC64-XZ: same polynomial as ECMA but with all-ones initial value and output, both reflected; adopted by the xz compression format and the Go standard library.',
      'CRC64-XZ：ECMA と同じ多項式ですが、初期値/出力がすべて 1 で反射あり。xz 圧縮形式と Go 標準ライブラリが採用。',
      'CRC64-XZ: ECMA와 같은 다항식이지만 초기값/출력이 모두 1이고 반사됨. xz 압축 형식과 Go 표준 라이브러리가 채택.',
      'CRC64-XZ : même polynôme que ECMA mais valeur initiale et sortie à tous 1, réfléchies ; adopté par le format xz et la bibliothèque standard Go.',
      'CRC64-XZ: gleiches Polynom wie ECMA, aber Anfangs- und Ausgabewert vollständig 1 und gespiegelt; verwendet vom xz-Kompressionsformat und der Go-Standardbibliothek.',
      'CRC64-XZ: тот же полином, что у ECMA, но начальное значение и вывод полностью из единиц и отражаются; используется форматом сжатия xz и стандартной библиотекой Go.'],

    'fnv1a32': ['FNV-1a 32：非密码学哈希，常用于哈希表与去重，比 CRC 快但冲突率更高。检查值 "foobar" → BF9CF968。',
      'FNV-1a 32：非密碼學雜湊，常用於雜湊表與去重，比 CRC 快但衝突率更高。檢查值 "foobar" → BF9CF968。',
      'FNV-1a 32: a non-cryptographic hash, commonly used for hash tables and deduplication; faster than CRC but with a higher collision rate. Check value "foobar" → BF9CF968.',
      'FNV-1a 32：非暗号学的ハッシュ。ハッシュテーブルや重複排除によく使われます。CRC より高速ですが衝突率は高め。チェック値 "foobar" → BF9CF968。',
      'FNV-1a 32: 비암호화 해시, 해시 테이블과 중복 제거에 자주 사용. CRC보다 빠르지만 충돌률이 더 높습니다. 검사값 "foobar" → BF9CF968.',
      'FNV-1a 32 : hachage non cryptographique, courant pour les tables de hachage et la déduplication ; plus rapide que CRC mais taux de collision plus élevé. Valeur de contrôle "foobar" → BF9CF968.',
      'FNV-1a 32: nicht-kryptografischer Hash, häufig für Hashtabellen und Deduplizierung; schneller als CRC, aber höhere Kollisionsrate. Prüfwert "foobar" → BF9CF968.',
      'FNV-1a 32: некриптографический хеш, часто применяется в хеш-таблицах и для дедупликации; быстрее CRC, но выше вероятность коллизий. Проверочное значение "foobar" → BF9CF968.'],

    'crc24': ['24 位 CRC，OpenPGP（RFC 4880 §6.1）用它校验 ASCII Armor 的 Radix-64 数据，3 字节再编成 4 个 Base64 字符（前缀 "="）。多项式 0x1864CFB，初值 0xB704CE，非反射无末异或，故空输入即 0xB704CE。Botan 向量全通过。CRC 只能检错，不能当 MAC。',
      '24 位元 CRC，OpenPGP（RFC 4880 §6.1）用它驗證 ASCII Armor 的 Radix-64 資料，3 位元組再編成 4 個 Base64 字元（前綴 "="）。多項式 0x1864CFB，初值 0xB704CE，非反射且無末尾 XOR，故空輸入即 0xB704CE。Botan 向量全通過。CRC 只能偵錯，不能當 MAC。',
      'A 24-bit CRC. OpenPGP (RFC 4880 §6.1) uses it to check the Radix-64 data of ASCII Armor; the 3 bytes are then encoded as 4 Base64 characters (prefix "="). Polynomial 0x1864CFB, initial value 0xB704CE, non-reflected with no final XOR, so an empty input yields 0xB704CE. All Botan vectors pass. A CRC only detects errors; it is not a MAC.',
      '24 ビット CRC。OpenPGP（RFC 4880 §6.1）は ASCII Armor の Radix-64 データの検証にこれを使います。3 バイトを 4 つの Base64 文字（接頭辞 "="）に符号化。多項式 0x1864CFB、初期値 0xB704CE、非反射で末尾 XOR なしのため空入力は 0xB704CE。Botan のベクトルは全て合格。CRC は誤り検出のみで、MAC にはできません。',
      '24비트 CRC, OpenPGP(RFC 4880 §6.1)는 ASCII Armor의 Radix-64 데이터 검증에 사용, 3바이트를 4개의 Base64 문자(접두사 "=")로 인코딩. 다항식 0x1864CFB, 초기값 0xB704CE, 비반사에 최종 XOR 없음, 따라서 빈 입력은 0xB704CE. Botan 벡터 모두 통과. CRC는 오류 검출만 가능하며 MAC이 될 수 없습니다.',
      'CRC 24 bits. OpenPGP (RFC 4880 §6.1) l’utilise pour vérifier les données Radix-64 de l’ASCII Armor ; les 3 octets sont ensuite encodés en 4 caractères Base64 (préfixe "="). Polynôme 0x1864CFB, valeur initiale 0xB704CE, non réfléchi et sans XOR final, donc une entrée vide donne 0xB704CE. Tous les vecteurs Botan passent. Un CRC ne détecte que les erreurs ; ce n’est pas un MAC.',
      '24-Bit-CRC. OpenPGP (RFC 4880 §6.1) verwendet ihn zur Prüfung der Radix-64-Daten von ASCII Armor; die 3 Bytes werden anschließend als 4 Base64-Zeichen kodiert (Präfix "="). Polynom 0x1864CFB, Anfangswert 0xB704CE, nicht gespiegelt und ohne abschließendes XOR, daher ergibt eine leere Eingabe 0xB704CE. Alle Botan-Vektoren bestehen. Ein CRC erkennt nur Fehler; er ist kein MAC.',
      '24-битовый CRC. OpenPGP (RFC 4880 §6.1) использует его для проверки данных Radix-64 в ASCII Armor; 3 байта затем кодируются в 4 символа Base64 (префикс "="). Полином 0x1864CFB, начальное значение 0xB704CE, без отражения и без финального XOR, поэтому пустой ввод даёт 0xB704CE. Все векторы Botan проходят. CRC лишь обнаруживает ошибки; он не является MAC.']
  };

  /* ---- 挂载到 I18N（惰性：i18n.js 可能在本文件之后才定义） ---- */
  var I18N = window.I18N || (window.I18N = {});
  var TABLES = I18N.__ALGO_TABLES || (I18N.__ALGO_TABLES = []);
  TABLES.push(INFO);
  I18N.__ALGO_INFO_SELF = INFO;   /* 供测试逐片校验「译文原文 vs 运行期 info」是否漂移 */

  function langIndex() {
    if (!I18N.LANGS || typeof I18N.get !== 'function') return -1;
    var cur = I18N.get();
    for (var i = 0; i < I18N.LANGS.length; i++) if (I18N.LANGS[i].code === cur) return i;
    return -1;
  }

  /* 取某条算法说明的译文。未收录的条目原样返回中文原文（增量覆盖的关键）。 */
  I18N.algoInfo = function (id, fallback) {
    var i = langIndex();
    if (i < 0) i = 0;
    for (var t = 0; t < TABLES.length; t++) {
      var row = TABLES[t][id];
      if (!row) continue;
      var v = row[i];
      if (v === undefined || v === null || v === '') v = row[0];   /* 缺译回退 zh-CN */
      if (v === undefined || v === null || v === '') v = fallback;
      return v;
    }
    return fallback;
  };

  /* 已收录条目数（供覆盖率测试统计，不含测试里的重复计数） */
  I18N.algoInfoCount = function () {
    var n = 0, seen = {};
    for (var t = 0; t < TABLES.length; t++) {
      for (var k in TABLES[t]) if (!seen[k]) { seen[k] = 1; n++; }
    }
    return n;
  };
})();
