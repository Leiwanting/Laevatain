/* i18n_sec.js —— 安全提示（securityAudit）多语言
 *
 * 【为什么单独一个文件】
 * 安全提示是「算法/模式/填充/KDF 选错了会出事」的告警，比界面标签更需要被读懂。
 * 但它是运行期按当前选择动态拼出来的，不挂在 data-i18n 上，通用 apply() 覆盖不到，
 * 所以单独建表、由 crypto_modes.js 的 _secT() 查询。
 *
 * 【设计原则】
 * 1. 增量表：查不到就原样返回中文原文（_secRaw 的 fallback），不渲染 undefined。
 *    所以补一批就多覆盖一批，没补到的行为与加文件之前完全一致。
 * 2. 占位符 {n} {mode} {id} {kdf} {b} 由调用方替换，**翻译时必须原样保留**，
 *    否则会显示成字面量 {n}。测试 t_i18n_sec.js 会逐条校验。
 * 3. 专有名词不翻译：ECB / CBC / AEAD / GCM / CCM / OCB / EAX / SIV / nonce /
 *    Padding Oracle / PKCS7 / PBKDF2 / Argon2id / SHA-1 / SHA-256 / NIST SP 800-38D …
 *    翻译了用户就跟官方文档对不上号。
 * 4. 每条都是安全建议，宁可朴素直译也不要意译加戏。
 *
 * 语言顺序固定：zh-CN, zh-TW, en, ja, ko, fr, de, ru
 */
(function () {
  'use strict';

  var SEC = {
    'sec.ecb': {
      title: ['ECB 模式不安全', 'ECB 模式不安全', 'ECB mode is insecure', 'ECB モードは安全ではありません', 'ECB 모드는 안전하지 않습니다', 'Le mode ECB n\'est pas sûr', 'ECB-Modus ist unsicher', 'Режим ECB небезопасен'],
      why: ['ECB 模式对相同明文块总是产生相同密文块，会直接泄露明文的结构与重复模式（著名的「ECB 企鹅」图就是例子）。它不提供任何语义安全，仅适用于加密单个块或兼容旧数据。',
            'ECB 模式對相同明文區塊總是產生相同密文區塊，會直接洩漏明文的結構與重複模式（著名的「ECB 企鵝」圖就是例子）。它不提供任何語義安全，僅適用於加密單個區塊或相容舊資料。',
            'ECB always produces the same ciphertext block for the same plaintext block, leaking the structure and repeated patterns of the plaintext (the famous "ECB penguin" image is the classic example). It provides no semantic security and is only suitable for a single block or legacy data.',
            'ECB モードは同じ平文ブロックから常に同じ暗号文ブロックを生成し、平文の構造や繰り返しパターンをそのまま漏らします（有名な「ECB ペンギン」の画像が典型例です）。意味論的安全性を一切提供せず、単一ブロックの暗号化や旧データ互換以外には適しません。',
            'ECB 모드는 같은 평문 블록에서 항상 같은 암호문 블록을 만들어 평문의 구조와 반복 패턴을 그대로 드러냅니다(유명한 「ECB 펭귄」 이미지가 대표적입니다). 의미론적 안전성을 전혀 제공하지 않으며, 단일 블록 암호화나 구형 데이터 호환에만 적합합니다.',
            'Le mode ECB produit toujours le même bloc chiffré pour le même bloc clair, révélant la structure et les motifs répétés du texte clair (la fameuse image du « pingouin ECB » en est l\'exemple classique). Il n\'offre aucune sécurité sémantique et ne convient qu\'à un bloc unique ou à des données héritées.',
            'ECB erzeugt für denselben Klartextblock immer denselben Geheimtextblock und verrät damit Struktur und Wiederholungsmuster des Klartexts (das berühmte „ECB-Pinguin"-Bild ist das klassische Beispiel). Es bietet keine semantische Sicherheit und taugt nur für einen Einzelblock oder Altdaten.',
            'Режим ECB всегда даёт один и тот же блок шифртекста для одного и того же блока открытого текста, раскрывая структуру и повторяющиеся шаблоны (классический пример — знаменитый «пингвин ECB»). Он не даёт никакой семантической стойкости и пригоден лишь для одного блока или старых данных.'],
      use: ['改用 CBC（随机 IV）或 AEAD（GCM / CCM / OCB / EAX / SIV）。',
            '改用 CBC（隨機 IV）或 AEAD（GCM / CCM / OCB / EAX / SIV）。',
            'Use CBC (random IV) or an AEAD mode (GCM / CCM / OCB / EAX / SIV).',
            'CBC（ランダム IV）または AEAD（GCM / CCM / OCB / EAX / SIV）を使用してください。',
            'CBC(무작위 IV) 또는 AEAD(GCM / CCM / OCB / EAX / SIV)를 사용하세요.',
            'Utilisez CBC (IV aléatoire) ou un mode AEAD (GCM / CCM / OCB / EAX / SIV).',
            'Verwenden Sie CBC (zufälliger IV) oder einen AEAD-Modus (GCM / CCM / OCB / EAX / SIV).',
            'Используйте CBC (случайный IV) или AEAD (GCM / CCM / OCB / EAX / SIV).']
    },

    'sec.gcm.hard': {
      title: ['该密钥的 GCM 使用次数已超上限（{n}）', '該金鑰的 GCM 使用次數已超上限（{n}）', 'This key has exceeded its GCM usage limit ({n})', 'この鍵の GCM 使用回数が上限を超えました（{n}）', '이 키의 GCM 사용 횟수가 상한을 초과했습니다({n})', 'Cette clé a dépassé sa limite d\'utilisation GCM ({n})', 'Dieser Schlüssel hat sein GCM-Nutzungslimit überschritten ({n})', 'Этот ключ превысил лимит использований GCM ({n})'],
      why: ['NIST SP 800-38D §8.3 规定：96 位随机 nonce 下，同一密钥的调用次数不得超过 2^32 次。到达此数量后 nonce 碰撞概率约 2^-33，已不可接受。',
            'NIST SP 800-38D §8.3 規定：96 位元隨機 nonce 下，同一金鑰的呼叫次數不得超過 2^32 次。到達此數量後 nonce 碰撞機率約 2^-33，已不可接受。',
            'NIST SP 800-38D §8.3: with 96-bit random nonces, a single key must not be used more than 2^32 times. At this count the nonce collision probability is about 2^-33, which is unacceptable.',
            'NIST SP 800-38D §8.3 では、96 ビットのランダム nonce において同一鍵の呼び出し回数は 2^32 回を超えてはならないと規定されています。この回数に達すると nonce 衝突確率は約 2^-33 となり、許容できません。',
            'NIST SP 800-38D §8.3: 96비트 무작위 nonce에서 같은 키는 2^32회를 넘겨 사용할 수 없습니다. 이 횟수에 도달하면 nonce 충돌 확률은 약 2^-33으로 허용할 수 없습니다.',
            'NIST SP 800-38D §8.3 : avec des nonces aléatoires de 96 bits, une même clé ne doit pas être utilisée plus de 2^32 fois. À ce niveau, la probabilité de collision de nonce est d\'environ 2^-33, ce qui est inacceptable.',
            'NIST SP 800-38D §8.3: Mit 96-Bit-Zufalls-Nonces darf ein Schlüssel höchstens 2^32-mal verwendet werden. Bei dieser Anzahl liegt die Nonce-Kollisionswahrscheinlichkeit bei etwa 2^-33 — nicht akzeptabel.',
            'NIST SP 800-38D §8.3: при 96-битных случайных nonce один ключ нельзя использовать более 2^32 раз. При таком числе вероятность коллизии nonce составляет около 2^-33 — это недопустимо.'],
      use: ['必须更换密钥。换 nonce 无济于事——碰撞来自随机取值本身。',
            '必須更換金鑰。換 nonce 無濟於事——碰撞來自隨機取值本身。',
            'You must rotate the key. Changing the nonce does not help — the collision comes from the random draw itself.',
            '鍵を交換する必要があります。nonce を変えても無意味です——衝突はランダムな値の取り出しそのものに由来します。',
            '키를 교체해야 합니다. nonce를 바꿔도 소용없습니다——충돌은 무작위 추출 자체에서 비롯됩니다.',
            'Vous devez changer la clé. Changer le nonce ne sert à rien — la collision provient du tirage aléatoire lui-même.',
            'Sie müssen den Schlüssel wechseln. Ein anderer Nonce hilft nicht — die Kollision kommt aus der Zufallsziehung selbst.',
            'Необходимо сменить ключ. Смена nonce не поможет — коллизия возникает из самого случайного выбора.']
    },

    'sec.gcm.warn': {
      title: ['该密钥已用于 {n} 次 GCM 加密', '該金鑰已用於 {n} 次 GCM 加密', 'This key has been used for {n} GCM encryptions', 'この鍵は {n} 回の GCM 暗号化に使用されました', '이 키는 {n}회의 GCM 암호화에 사용되었습니다', 'Cette clé a été utilisée pour {n} chiffrements GCM', 'Dieser Schlüssel wurde für {n} GCM-Verschlüsselungen verwendet', 'Этот ключ использовался для {n} шифрований GCM'],
      why: ['接近单密钥上限 2^32。2^28 是本项目自定的保守预警线（非标准要求），对应碰撞概率约 2^-41。',
            '接近單金鑰上限 2^32。2^28 是本專案自訂的保守預警線（非標準要求），對應碰撞機率約 2^-41。',
            'Approaching the 2^32 single-key limit. 2^28 is this project\'s own conservative warning threshold (not a standard requirement), corresponding to a collision probability of about 2^-41.',
            '単一鍵の上限 2^32 に近づいています。2^28 は本プロジェクト独自の保守的な警告ライン（標準の要件ではありません）で、衝突確率は約 2^-41 に相当します。',
            '단일 키 상한 2^32에 접근했습니다. 2^28은 이 프로젝트 자체의 보수적 경고선(표준 요구사항이 아님)이며, 충돌 확률 약 2^-41에 해당합니다.',
            'Approche de la limite 2^32 par clé. 2^28 est un seuil d\'avertissement prudent propre à ce projet (ce n\'est pas une exigence de la norme), correspondant à une probabilité de collision d\'environ 2^-41.',
            'Nähert sich dem 2^32-Einzelkey-Limit. 2^28 ist die konservative Warnschwelle dieses Projekts (keine Norm-Anforderung), entsprechend einer Kollisionswahrscheinlichkeit von etwa 2^-41.',
            'Приближение к пределу 2^32 на ключ. 2^28 — собственная консервативная предупредительная граница этого проекта (не требование стандарта), что соответствует вероятности коллизии около 2^-41.'],
      use: ['尽快轮换密钥，不要等到达上限。', '儘快輪換金鑰，不要等到達上限。', 'Rotate the key soon; do not wait until the limit is reached.', '早めに鍵をローテーションし、上限に達するまで待たないでください。', '상한에 도달할 때까지 기다리지 말고 가능한 한 빨리 키를 교체하세요.', 'Faites tourner la clé dès que possible ; n\'attendez pas d\'atteindre la limite.', 'Wechseln Sie den Schlüssel bald; warten Sie nicht, bis die Grenze erreicht ist.', 'Смените ключ как можно скорее; не ждите достижения предела.']
    },

    'sec.gcm.info': {
      title: ['该密钥已用于 {n} 次 GCM 加密', '該金鑰已用於 {n} 次 GCM 加密', 'This key has been used for {n} GCM encryptions', 'この鍵は {n} 回の GCM 暗号化に使用されました', '이 키는 {n}회의 GCM 암호화에 사용되었습니다', 'Cette clé a été utilisée pour {n} chiffrements GCM', 'Dieser Schlüssel wurde für {n} GCM-Verschlüsselungen verwendet', 'Этот ключ использовался для {n} шифрований GCM'],
      why: ['单密钥上限为 2^32（NIST SP 800-38D §8.3）。2^24 是本项目自定的提醒线（非标准要求），对应碰撞概率约 2^-49。',
            '單金鑰上限為 2^32（NIST SP 800-38D §8.3）。2^24 是本專案自訂的提醒線（非標準要求），對應碰撞機率約 2^-49。',
            'The single-key limit is 2^32 (NIST SP 800-38D §8.3). 2^24 is this project\'s own reminder line (not a standard requirement), corresponding to a collision probability of about 2^-49.',
            '単一鍵の上限は 2^32 です（NIST SP 800-38D §8.3）。2^24 は本プロジェクト独自の注意喚起ライン（標準の要件ではありません）で、衝突確率は約 2^-49 に相当します。',
            '단일 키 상한은 2^32입니다(NIST SP 800-38D §8.3). 2^24는 이 프로젝트 자체의 알림선(표준 요구사항이 아님)이며 충돌 확률 약 2^-49에 해당합니다.',
            'La limite par clé est de 2^32 (NIST SP 800-38D §8.3). 2^24 est un repère propre à ce projet (ce n\'est pas une exigence de la norme), correspondant à une probabilité de collision d\'environ 2^-49.',
            'Das Einzelkey-Limit beträgt 2^32 (NIST SP 800-38D §8.3). 2^24 ist die projektinterne Erinnerungsschwelle (keine Norm-Anforderung), entsprechend einer Kollisionswahrscheinlichkeit von etwa 2^-49.',
            'Предел на один ключ — 2^32 (NIST SP 800-38D §8.3). 2^24 — собственная напоминающая граница этого проекта (не требование стандарта), что соответствует вероятности коллизии около 2^-49.'],
      use: ['规划密钥轮换；若对同一密钥的调用量很大，可考虑改用抗误用的 AES-GCM-SIV。',
            '規劃金鑰輪換；若對同一金鑰的呼叫量很大，可考慮改用抗誤用的 AES-GCM-SIV。',
            'Plan key rotation; if a single key is called very often, consider the misuse-resistant AES-GCM-SIV.',
            '鍵のローテーションを計画してください。同一鍵の呼び出し回数が非常に多い場合は、誤用耐性のある AES-GCM-SIV の使用も検討してください。',
            '키 교체를 계획하세요. 같은 키를 매우 자주 사용한다면 오용 저항성이 있는 AES-GCM-SIV 사용도 고려하세요.',
            'Planifiez la rotation des clés ; si une même clé est très souvent sollicitée, envisagez AES-GCM-SIV, résistant aux mésusages.',
            'Planen Sie die Schlüsselrotation; bei sehr häufiger Nutzung eines Schlüssels bietet sich das missbrauchsresistente AES-GCM-SIV an.',
            'Планируйте ротацию ключа; если один ключ вызывается очень часто, рассмотрите устойчивый к misuse AES-GCM-SIV.']
    },

    'sec.pcbc': {
      title: ['PCBC 已不推荐', 'PCBC 已不推薦', 'PCBC is deprecated', 'PCBC は非推奨です', 'PCBC는 권장되지 않습니다', 'PCBC est déconseillé', 'PCBC ist nicht mehr empfohlen', 'PCBC не рекомендуется'],
      why: ['错误传播特性使其可被构造篡改攻击（Knudsen, 1994），实践中已被 CBC 取代。',
            '錯誤傳播特性使其可被構造篡改攻擊（Knudsen, 1994），實務上已被 CBC 取代。',
            'Its error-propagation property enables constructed tampering attacks (Knudsen, 1994); in practice it has been replaced by CBC.',
            '誤り伝播の性質により改ざん攻撃を構成でき（Knudsen, 1994）、実務上は CBC に置き換えられています。',
            '오류 전파 특성 때문에 변조 공격을 구성할 수 있으며(Knudsen, 1994), 실제로는 CBC로 대체되었습니다.',
            'Sa propriété de propagation d\'erreur permet des attaques de falsification construites (Knudsen, 1994) ; en pratique il a été remplacé par CBC.',
            'Durch seine Fehlerfortpflanzung sind konstruierte Manipulationsangriffe möglich (Knudsen, 1994); in der Praxis wurde es durch CBC ersetzt.',
            'Свойство распространения ошибок позволяет конструировать атаки на подделку (Knudsen, 1994); на практике он вытеснен режимом CBC.'],
      use: ['改用 CBC 或 AEAD 模式。', '改用 CBC 或 AEAD 模式。', 'Use CBC or an AEAD mode.', 'CBC または AEAD モードを使用してください。', 'CBC 또는 AEAD 모드를 사용하세요.', 'Utilisez CBC ou un mode AEAD.', 'Verwenden Sie CBC oder einen AEAD-Modus.', 'Используйте CBC или AEAD.']
    },

    'sec.kw': {
      title: ['AES-KW 只用于包装密钥', 'AES-KW 僅用於包裝金鑰', 'AES-KW is for wrapping keys only', 'AES-KW は鍵ラップ専用です', 'AES-KW는 키 래핑 전용입니다', 'AES-KW sert uniquement à envelopper des clés', 'AES-KW dient nur zum Einhüllen von Schlüsseln', 'AES-KW предназначен только для обёртки ключей'],
      why: ['RFC 3394 的密钥包装算法设计目标是保护密钥材料，不是通用数据加密；明文必须 ≥16 字节且为 8 的倍数。',
            'RFC 3394 的金鑰包裝演算法設計目標是保護金鑰材料，不是通用資料加密；明文必須 ≥16 位元組且為 8 的倍數。',
            'The RFC 3394 key-wrap algorithm is designed to protect key material, not to encrypt general data; the plaintext must be ≥16 bytes and a multiple of 8.',
            'RFC 3394 の鍵ラップアルゴリズムは鍵素材の保護を目的としており、一般的なデータ暗号化ではありません。平文は 16 バイト以上かつ 8 の倍数でなければなりません。',
            'RFC 3394 키 랩 알고리즘은 키 자료 보호를 목적으로 하며 일반 데이터 암호화용이 아닙니다. 평문은 16바이트 이상이면서 8의 배수여야 합니다.',
            'L\'algorithme d\'enveloppement de clés RFC 3394 vise à protéger du matériel de clé, pas à chiffrer des données générales ; le texte clair doit faire ≥16 octets et être un multiple de 8.',
            'Der Key-Wrap-Algorithmus aus RFC 3394 dient dem Schutz von Schlüsselmaterial, nicht der Verschlüsselung allgemeiner Daten; der Klartext muss ≥16 Byte und ein Vielfaches von 8 sein.',
            'Алгоритм обёртки ключей из RFC 3394 предназначен для защиты ключевого материала, а не для шифрования обычных данных; открытый текст должен быть ≥16 байт и кратен 8.'],
      use: ['加密普通数据请用 GCM / CBC。', '加密一般資料請用 GCM / CBC。', 'To encrypt ordinary data, use GCM / CBC.', '通常のデータを暗号化するには GCM / CBC を使用してください。', '일반 데이터를 암호화할 때는 GCM / CBC를 사용하세요.', 'Pour chiffrer des données ordinaires, utilisez GCM / CBC.', 'Für gewöhnliche Daten verwenden Sie GCM / CBC.', 'Для шифрования обычных данных используйте GCM / CBC.']
    },

    'sec.unauth': {
      title: ['{mode} 不提供完整性保护', '{mode} 不提供完整性保護', '{mode} provides no integrity protection', '{mode} は完全性保護を提供しません', '{mode}는 무결성 보호를 제공하지 않습니다', '{mode} n\'offre aucune protection d\'intégrité', '{mode} bietet keinen Integritätsschutz', '{mode} не обеспечивает защиту целостности'],
      why: ['该模式只保证机密性：攻击者翻转密文比特会造成明文相应变化，解密方无法察觉。这也是 Padding Oracle 攻击得以成立的前提。',
            '該模式只保證機密性：攻擊者翻轉密文位元會造成明文相應變化，解密方無法察覺。這也是 Padding Oracle 攻擊得以成立的前提。',
            'This mode guarantees confidentiality only: an attacker flipping ciphertext bits causes corresponding changes in the plaintext, which the receiver cannot detect. This is also the precondition that makes Padding Oracle attacks work.',
            'このモードは機密性のみを保証します。攻撃者が暗号文のビットを反転させると平文が対応して変化し、復号側はそれを検出できません。これは Padding Oracle 攻撃が成立する前提でもあります。',
            '이 모드는 기밀성만 보장합니다. 공격자가 암호문 비트를 뒤집으면 평문이 그에 맞게 바뀌고 복호화 측은 이를 알아챌 수 없습니다. 이는 Padding Oracle 공격이 성립하는 전제이기도 합니다.',
            'Ce mode ne garantit que la confidentialité : un attaquant qui inverse des bits du chiffré provoque des changements correspondants dans le clair, indétectables par le destinataire. C\'est aussi la condition qui rend possibles les attaques Padding Oracle.',
            'Dieser Modus garantiert nur Vertraulichkeit: Ein Angreifer, der Bits im Geheimtext kippt, bewirkt entsprechende Änderungen im Klartext, die der Empfänger nicht bemerkt. Das ist auch die Voraussetzung für Padding-Oracle-Angriffe.',
            'Этот режим гарантирует только конфиденциальность: изменив биты шифртекста, атакующий вызывает соответствующие изменения открытого текста, которые получатель не может обнаружить. Это также предпосылка, делающая возможными атаки Padding Oracle.'],
      use: ['需要防篡改时改用 AEAD（GCM / CCM / OCB / EAX / SIV），或在密文后附加 HMAC。',
            '需要防篡改時改用 AEAD（GCM / CCM / OCB / EAX / SIV），或在密文後附加 HMAC。',
            'For tamper protection use AEAD (GCM / CCM / OCB / EAX / SIV), or append an HMAC after the ciphertext.',
            '改ざん防止が必要な場合は AEAD（GCM / CCM / OCB / EAX / SIV）を使用するか、暗号文の後ろに HMAC を付加してください。',
            '변조 방지가 필요하면 AEAD(GCM / CCM / OCB / EAX / SIV)를 사용하거나 암호문 뒤에 HMAC을 덧붙이세요.',
            'Pour une protection contre la falsification, utilisez AEAD (GCM / CCM / OCB / EAX / SIV) ou ajoutez un HMAC après le chiffré.',
            'Für Manipulationsschutz nutzen Sie AEAD (GCM / CCM / OCB / EAX / SIV) oder hängen einen HMAC an den Geheimtext an.',
            'Для защиты от подделки используйте AEAD (GCM / CCM / OCB / EAX / SIV) или добавьте HMAC после шифртекста.']
    },

    'sec.siv': {
      title: ['SIV 抗 nonce 误用', 'SIV 抗 nonce 誤用', 'SIV resists nonce misuse', 'SIV は nonce 誤用に耐性があります', 'SIV는 nonce 오용에 저항합니다', 'SIV résiste au mésusage du nonce', 'SIV ist resistent gegen Nonce-Missbrauch', 'SIV устойчив к неправильному использованию nonce'],
      why: ['SIV 是确定性认证加密：即使重复使用同一 nonce，也只会泄露「两段明文是否相同」，不会像 GCM 那样泄露明文异或。代价是加密必须两遍、且密文与明文等长。',
            'SIV 是確定性認證加密：即使重複使用同一 nonce，也只會洩漏「兩段明文是否相同」，不會像 GCM 那樣洩漏明文互斥或。代價是加密必須兩遍、且密文與明文等長。',
            'SIV is deterministic authenticated encryption: even if the same nonce is reused, it only leaks whether two plaintexts are identical — unlike GCM, it does not leak the XOR of the plaintexts. The cost is two passes over the data and a ciphertext exactly as long as the plaintext.',
            'SIV は決定的認証暗号です。同じ nonce を再利用しても「二つの平文が同一かどうか」しか漏れず、GCM のように平文の XOR が漏れることはありません。代償として暗号化は二巡必要で、暗号文は平文と同じ長さになります。',
            'SIV는 결정적 인증 암호입니다. 같은 nonce를 재사용해도 「두 평문이 같은지」만 드러나며 GCM처럼 평문의 XOR이 드러나지 않습니다. 대가는 암호화를 두 번 수행해야 하고 암호문이 평문과 같은 길이가 된다는 점입니다.',
            'SIV est un chiffrement authentifié déterministe : même en réutilisant le même nonce, il ne révèle que si deux textes clairs sont identiques — contrairement à GCM, il ne révèle pas leur XOR. Le coût est un double passage sur les données et un chiffré exactement aussi long que le clair.',
            'SIV ist deterministische authentifizierte Verschlüsselung: Selbst bei Nonce-Wiederverwendung verrät sie nur, ob zwei Klartexte identisch sind — anders als GCM nicht deren XOR. Der Preis sind zwei Durchläufe und ein Geheimtext genau so lang wie der Klartext.',
            'SIV — это детерминированное аутентифицированное шифрование: даже при повторном использовании nonce раскрывается лишь то, совпадают ли два открытых текста, но не их XOR, как в GCM. Плата — два прохода по данным и шифртекст той же длины, что открытый текст.'],
      use: ['适合「无法安全保存 nonce」的场景；其它情况 GCM 更常用。',
            '適合「無法安全保存 nonce」的場景；其它情況 GCM 更常用。',
            'Suited to scenarios where the nonce cannot be stored safely; otherwise GCM is the more common choice.',
            'nonce を安全に保存できない場面に適しています。それ以外では GCM の方が一般的です。',
            'nonce를 안전하게 저장할 수 없는 상황에 적합합니다. 그 외에는 GCM이 더 흔히 쓰입니다.',
            'Convient aux cas où le nonce ne peut pas être stocké de façon sûre ; sinon GCM est le choix le plus courant.',
            'Geeignet für Fälle, in denen der Nonce nicht sicher gespeichert werden kann; sonst ist GCM die gängigere Wahl.',
            'Подходит для случаев, когда nonce нельзя безопасно сохранить; в остальном чаще используют GCM.']
    },

    'sec.xts': {
      title: ['{mode} 面向磁盘加密', '{mode} 面向磁碟加密', '{mode} is designed for disk encryption', '{mode} はディスク暗号向けです', '{mode}는 디스크 암호화용입니다', '{mode} est conçu pour le chiffrement de disque', '{mode} ist für Festplattenverschlüsselung gedacht', '{mode} предназначен для шифрования дисков'],
      why: ['它是窄块（16 字节）的可调分组密码，设计目标是原地加密固定大小的扇区，且 tweak 通常与扇区号绑定。',
            '它是窄區塊（16 位元組）的可調分組密碼，設計目標是原地加密固定大小的磁區，且 tweak 通常與磁區編號綁定。',
            'It is a narrow-block (16-byte) tweakable block cipher, designed to encrypt fixed-size sectors in place, with the tweak usually tied to the sector number.',
            'これは狭ブロック（16 バイト）の tweak 付きブロック暗号であり、固定サイズのセクタをその場で暗号化するよう設計されています。tweak は通常セクタ番号に結び付けられます。',
            '이는 좁은 블록(16바이트) 조정 가능 블록 암호로, 고정 크기 섹터를 제자리에서 암호화하도록 설계되었으며 tweak는 보통 섹터 번호에 묶입니다.',
            'C\'est un chiffrement par bloc à tweak à bloc étroit (16 octets), conçu pour chiffrer sur place des secteurs de taille fixe, le tweak étant généralement lié au numéro de secteur.',
            'Es ist eine schmalblockige (16 Byte) tweakable Blockchiffre, die feste Sektoren an Ort und Stelle verschlüsselt; der Tweak ist meist an die Sektornummer gebunden.',
            'Это узкоблочный (16 байт) настраиваемый блочный шифр, предназначенный для шифрования секторов фиксированного размера на месте; tweak обычно привязан к номеру сектора.'],
      use: ['不要把它当通用加密用；同一密钥 + 同一 tweak 绝不能加密两份不同数据。',
            '不要把它當通用加密用；同一金鑰 + 同一 tweak 絕不能加密兩份不同資料。',
            'Do not use it as general-purpose encryption; the same key plus the same tweak must never encrypt two different pieces of data.',
            '汎用の暗号化として使わないでください。同一鍵と同一 tweak で二つの異なるデータを暗号化してはなりません。',
            '범용 암호화로 사용하지 마세요. 같은 키와 같은 tweak로 서로 다른 두 데이터를 암호화해서는 안 됩니다.',
            'Ne l\'utilisez pas comme chiffrement généraliste ; la même clé avec le même tweak ne doit jamais chiffrer deux données différentes.',
            'Nicht als Universalverschlüsselung verwenden; derselbe Schlüssel mit demselben Tweak darf niemals zwei verschiedene Daten verschlüsseln.',
            'Не используйте его как универсальное шифрование; один ключ с одним tweak никогда не должен шифровать два разных набора данных.']
    },

    'sec.weak.des': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['DES 的 56 位密钥可被暴力破解（1998 年已有人在 56 小时内破开）；3DES 虽然等效 112 位，但 64 位块在大量数据下存在 Sweet32 生日攻击风险。',
            'DES 的 56 位元金鑰可被暴力破解（1998 年已有人在 56 小時內破開）；3DES 雖然等效 112 位元，但 64 位元區塊在大量資料下存在 Sweet32 生日攻擊風險。',
            'DES\'s 56-bit key can be brute-forced (broken in 56 hours back in 1998); 3DES is equivalent to 112 bits, but its 64-bit block is exposed to the Sweet32 birthday attack on large volumes of data.',
            'DES の 56 ビット鍵は総当たりで破れます（1998 年に 56 時間で解かれています）。3DES は 112 ビット相当ですが、64 ビットブロックは大量データで Sweet32 誕生日攻撃のリスクがあります。',
            'DES의 56비트 키는 무차별 대입으로 뚫립니다(1998년에 56시간 만에 해독됨). 3DES는 112비트에 해당하지만 64비트 블록은 대량 데이터에서 Sweet32 생일 공격 위험이 있습니다.',
            'La clé 56 bits de DES peut être cassée par force brute (cassée en 56 heures dès 1998) ; le 3DES équivaut à 112 bits, mais son bloc de 64 bits expose à l\'attaque d\'anniversaire Sweet32 sur de gros volumes.',
            'Der 56-Bit-Schlüssel von DES lässt sich per Brute Force brechen (1998 in 56 Stunden geknackt); 3DES entspricht 112 Bit, doch sein 64-Bit-Block ist bei großen Datenmengen durch den Sweet32-Geburtstagsangriff gefährdet.',
            '56-битный ключ DES поддаётся перебору (взломан за 56 часов ещё в 1998); 3DES эквивалентен 112 битам, но его 64-битный блок подвержен атаке дней рождения Sweet32 на больших объёмах данных.'],
      use: ['改用 AES-128 或更高。', '改用 AES-128 或更高。', 'Use AES-128 or stronger.', 'AES-128 以上を使用してください。', 'AES-128 이상을 사용하세요.', 'Utilisez AES-128 ou mieux.', 'Verwenden Sie AES-128 oder stärker.', 'Используйте AES-128 или сильнее.']
    },

    'sec.weak.rc4': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['RC4 的密钥流存在统计偏差，已被用于攻击 TLS（RFC 7465 明确禁止在 TLS 中使用）。',
            'RC4 的金鑰流存在統計偏差，已被用於攻擊 TLS（RFC 7465 明確禁止在 TLS 中使用）。',
            'RC4\'s keystream has statistical biases that have been exploited to attack TLS (RFC 7465 explicitly prohibits its use in TLS).',
            'RC4 の鍵ストリームには統計的偏りがあり、TLS への攻撃に利用されています（RFC 7465 は TLS での使用を明確に禁止しています）。',
            'RC4의 키 스트림에는 통계적 편향이 있어 TLS 공격에 악용되었습니다(RFC 7465는 TLS에서의 사용을 명시적으로 금지합니다).',
            'Le flux de clé de RC4 présente des biais statistiques exploités pour attaquer TLS (la RFC 7465 en interdit explicitement l\'usage dans TLS).',
            'Der RC4-Schlüsselstrom besitzt statistische Abweichungen, die für Angriffe auf TLS ausgenutzt wurden (RFC 7465 verbietet seine Verwendung in TLS ausdrücklich).',
            'Ключевой поток RC4 имеет статистические смещения, использованные для атак на TLS (RFC 7465 явно запрещает его применение в TLS).'],
      use: ['改用 ChaCha20 或 AES-CTR。', '改用 ChaCha20 或 AES-CTR。', 'Use ChaCha20 or AES-CTR.', 'ChaCha20 または AES-CTR を使用してください。', 'ChaCha20 또는 AES-CTR를 사용하세요.', 'Utilisez ChaCha20 ou AES-CTR.', 'Verwenden Sie ChaCha20 oder AES-CTR.', 'Используйте ChaCha20 или AES-CTR.']
    },

    'sec.weak.md5': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['MD5 抗碰撞性已完全破裂，数秒即可构造碰撞（2008 年 rogue CA 事件即由此产生）。',
            'MD5 抗碰撞性已完全破裂，數秒即可構造碰撞（2008 年 rogue CA 事件即由此產生）。',
            'MD5\'s collision resistance is completely broken — collisions can be crafted in seconds (the 2008 rogue CA incident came from this).',
            'MD5 の耐衝突性は完全に破られており、衝突は数秒で構成できます（2008 年の rogue CA 事件はこれに由来します）。',
            'MD5의 충돌 저항성은 완전히 깨졌으며 충돌을 수 초 만에 만들 수 있습니다(2008년 rogue CA 사건이 여기서 비롯되었습니다).',
            'La résistance aux collisions de MD5 est totalement rompue — des collisions se fabriquent en quelques secondes (l\'incident rogue CA de 2008 en découle).',
            'Die Kollisionsresistenz von MD5 ist vollständig gebrochen — Kollisionen lassen sich in Sekunden erzeugen (der Rogue-CA-Vorfall von 2008 beruhte darauf).',
            'Стойкость MD5 к коллизиям полностью разрушена — коллизии создаются за секунды (инцидент с rogue CA в 2008 году произошёл именно из-за этого).'],
      use: ['改用 SHA-256。', '改用 SHA-256。', 'Use SHA-256.', 'SHA-256 を使用してください。', 'SHA-256을 사용하세요.', 'Utilisez SHA-256.', 'Verwenden Sie SHA-256.', 'Используйте SHA-256.']
    },

    'sec.weak.md4': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['MD4 比 MD5 更弱，1995 年就被破解，碰撞可在几秒内构造。',
            'MD4 比 MD5 更弱，1995 年就被破解，碰撞可在幾秒內構造。',
            'MD4 is weaker than MD5, broken back in 1995; collisions can be crafted within seconds.',
            'MD4 は MD5 より弱く、1995 年に破られています。衝突は数秒で構成可能です。',
            'MD4는 MD5보다 약하며 1995년에 이미 깨졌습니다. 충돌은 수 초 안에 만들 수 있습니다.',
            'MD4 est plus faible que MD5, cassé dès 1995 ; des collisions se fabriquent en quelques secondes.',
            'MD4 ist schwächer als MD5 und wurde bereits 1995 gebrochen; Kollisionen entstehen in wenigen Sekunden.',
            'MD4 слабее MD5, взломан ещё в 1995 году; коллизии создаются за несколько секунд.'],
      use: ['改用 SHA-256。', '改用 SHA-256。', 'Use SHA-256.', 'SHA-256 を使用してください。', 'SHA-256을 사용하세요.', 'Utilisez SHA-256.', 'Verwenden Sie SHA-256.', 'Используйте SHA-256.']
    },

    'sec.weak.sha1': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['SHA-1 抗碰撞性已被实际攻破（2017 年 SHAttered 攻击，Google 公开了两个内容不同但 SHA-1 相同的 PDF）。',
            'SHA-1 抗碰撞性已被實際攻破（2017 年 SHAttered 攻擊，Google 公開了兩個內容不同但 SHA-1 相同的 PDF）。',
            'SHA-1\'s collision resistance has been practically broken (the 2017 SHAttered attack, where Google published two different PDFs with the same SHA-1).',
            'SHA-1 の耐衝突性は実際に破られています（2017 年の SHAttered 攻撃。Google は内容が異なるのに SHA-1 が同じ二つの PDF を公開しました）。',
            'SHA-1의 충돌 저항성은 실제로 깨졌습니다(2017년 SHAttered 공격. Google은 내용이 다르지만 SHA-1이 같은 두 PDF를 공개했습니다).',
            'La résistance aux collisions de SHA-1 a été effectivement rompue (l\'attaque SHAttered de 2017, où Google a publié deux PDF différents de même SHA-1).',
            'Die Kollisionsresistenz von SHA-1 ist praktisch gebrochen (der SHAttered-Angriff 2017, bei dem Google zwei verschiedene PDFs mit gleichem SHA-1 veröffentlichte).',
            'Стойкость SHA-1 к коллизиям фактически взломана (атака SHAttered 2017 года, когда Google опубликовал два разных PDF с одинаковым SHA-1).'],
      use: ['改用 SHA-256。', '改用 SHA-256。', 'Use SHA-256.', 'SHA-256 を使用してください。', 'SHA-256을 사용하세요.', 'Utilisez SHA-256.', 'Verwenden Sie SHA-256.', 'Используйте SHA-256.']
    },

    'sec.weak.tea': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['这些是较早期的轻量级密码（TEA 系存在等效密钥等已知弱点），未被主流标准采纳。',
            '這些是較早期的輕量級密碼（TEA 系存在等效金鑰等已知弱點），未被主流標準採納。',
            'These are early lightweight ciphers (the TEA family has known weaknesses such as equivalent keys) and have not been adopted by mainstream standards.',
            'これらは初期の軽量暗号であり（TEA 系には等価鍵などの既知の弱点があります）、主流の標準には採用されていません。',
            '이들은 초기의 경량 암호이며(TEA 계열에는 등가 키 등 알려진 약점이 있음) 주류 표준에 채택되지 않았습니다.',
            'Ce sont des chiffrements légers anciens (la famille TEA a des faiblesses connues comme les clés équivalentes) qui n\'ont pas été adoptés par les normes courantes.',
            'Dies sind frühe leichtgewichtige Chiffren (die TEA-Familie hat bekannte Schwächen wie äquivalente Schlüssel) und wurden von gängigen Standards nicht übernommen.',
            'Это ранние облегчённые шифры (у семейства TEA есть известные слабости, например эквивалентные ключи), не принятые основными стандартами.'],
      use: ['改用 AES。', '改用 AES。', 'Use AES.', 'AES を使用してください。', 'AES를 사용하세요.', 'Utilisez AES.', 'Verwenden Sie AES.', 'Используйте AES.']
    },

    'sec.weak.dsa': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['采用 1024 位模素数域参数。按当前算力，1024 位离散对数已处于国家级别攻击的可行边缘（Logjam 攻击即针对此）。',
            '採用 1024 位元模質數域參數。按當前算力，1024 位元離散對數已處於國家級別攻擊的可行邊緣（Logjam 攻擊即針對此）。',
            'It uses 1024-bit prime-field parameters. At today\'s computing power, 1024-bit discrete logarithms sit at the edge of feasibility for nation-state attackers (the Logjam attack targets exactly this).',
            '1024 ビットの素数体上パラメータを使用しています。現在の計算能力では、1024 ビットの離散対数は国家級の攻撃者にとって実行可能な境界にあります（Logjam 攻撃はまさにこれを標的にしています）。',
            '1024비트 소수체 매개변수를 사용합니다. 현재 계산 능력에서 1024비트 이산대수는 국가 수준 공격자가 실행 가능한 경계에 있습니다(Logjam 공격이 바로 이를 겨냥합니다).',
            'Il utilise des paramètres de corps premier de 1024 bits. Avec la puissance actuelle, le logarithme discret 1024 bits est à la limite du faisable pour un attaquant étatique (l\'attaque Logjam vise précisément cela).',
            'Es verwendet 1024-Bit-Primkörperparameter. Bei heutiger Rechenleistung liegt der 1024-Bit-Diskrete-Logarithmus an der Grenze des für staatliche Angreifer Machbaren (der Logjam-Angriff zielt genau darauf).',
            'Используются 1024-битные параметры простого поля. При нынешних вычислительных мощностях 1024-битное дискретное логарифмирование находится на грани возможного для атакующих уровня государства (атака Logjam нацелена именно на это).'],
      use: ['改用 ECC（P-256 及以上）或 SM2；若必须用 DH/DSA，请选 2048 位以上的域参数。',
            '改用 ECC（P-256 及以上）或 SM2；若必須用 DH/DSA，請選 2048 位元以上的域參數。',
            'Use ECC (P-256 or above) or SM2; if you must use DH/DSA, choose domain parameters of 2048 bits or more.',
            'ECC（P-256 以上）または SM2 を使用してください。DH/DSA を使う必要がある場合は 2048 ビット以上のドメインパラメータを選んでください。',
            'ECC(P-256 이상) 또는 SM2를 사용하세요. DH/DSA를 써야 한다면 2048비트 이상의 도메인 매개변수를 선택하세요.',
            'Utilisez ECC (P-256 ou plus) ou SM2 ; si vous devez utiliser DH/DSA, choisissez des paramètres de domaine d\'au moins 2048 bits.',
            'Verwenden Sie ECC (P-256 oder höher) oder SM2; wenn DH/DSA nötig ist, wählen Sie Domänenparameter ab 2048 Bit.',
            'Используйте ECC (P-256 и выше) или SM2; если необходимы DH/DSA, выбирайте параметры домена от 2048 бит.']
    },

    'sec.weak.blk64': {
      title: ['算法强度不足', '演算法強度不足', 'Algorithm strength insufficient', 'アルゴリズム強度が不足', '알고리즘 강도 부족', 'Force de l\'algorithme insuffisante', 'Algorithmusstärke unzureichend', 'Недостаточная стойкость алгоритма'],
      why: ['块大小为 64 位。加密接近 4GB 数据时会触发生日界（Sweet32 类攻击），存在明文泄露风险。',
            '區塊大小為 64 位元。加密接近 4GB 資料時會觸發生日界（Sweet32 類攻擊），存在明文洩漏風險。',
            'The block size is 64 bits. Around 4 GB of data under one key the birthday bound kicks in (Sweet32-style attacks), risking plaintext leakage.',
            'ブロックサイズは 64 ビットです。約 4 GB のデータを暗号化すると誕生日界に達し（Sweet32 系の攻撃）、平文漏洩のリスクがあります。',
            '블록 크기가 64비트입니다. 약 4GB 데이터를 암호화하면 생일 경계에 도달해(Sweet32 계열 공격) 평문 유출 위험이 있습니다.',
            'La taille de bloc est de 64 bits. Vers 4 Go de données, la borne d\'anniversaire est atteinte (attaques de type Sweet32), avec un risque de fuite du texte clair.',
            'Die Blockgröße beträgt 64 Bit. Bei etwa 4 GB Daten greift die Geburtstagsgrenze (Sweet32-artige Angriffe), mit Risiko der Klartext-Offenlegung.',
            'Размер блока — 64 бита. При примерно 4 ГБ данных срабатывает граница дней рождения (атаки типа Sweet32), что создаёт риск утечки открытого текста.'],
      use: ['大批量数据请用 128 位块的算法（AES / Camellia / Twofish / SM4）。',
            '大批量資料請用 128 位元區塊的演算法（AES / Camellia / Twofish / SM4）。',
            'For bulk data use algorithms with a 128-bit block (AES / Camellia / Twofish / SM4).',
            '大量データには 128 ビットブロックのアルゴリズム（AES / Camellia / Twofish / SM4）を使用してください。',
            '대량 데이터에는 128비트 블록 알고리즘(AES / Camellia / Twofish / SM4)을 사용하세요.',
            'Pour les gros volumes, utilisez des algorithmes à bloc de 128 bits (AES / Camellia / Twofish / SM4).',
            'Für Massendaten nutzen Sie Algorithmen mit 128-Bit-Block (AES / Camellia / Twofish / SM4).',
            'Для больших объёмов данных используйте алгоритмы с 128-битным блоком (AES / Camellia / Twofish / SM4).']
    },

    'sec.hash.md45': {
      title: ['哈希算法不安全', '雜湊演算法不安全', 'Hash algorithm insecure', 'ハッシュアルゴリズムが安全ではありません', '해시 알고리즘이 안전하지 않습니다', 'Algorithme de hachage non sûr', 'Hash-Algorithmus unsicher', 'Хэш-алгоритм небезопасен'],
      why: ['已被完全攻破：可在数秒内构造碰撞（MD5）甚至原像（MD4），不能用于任何安全场景。',
            '已被完全攻破：可在數秒內構造碰撞（MD5）甚至原像（MD4），不能用於任何安全場景。',
            'Fully broken: collisions (MD5) and even preimages (MD4) can be crafted in seconds. Not usable in any security context.',
            '完全に破られています。衝突（MD5）やさらには原像（MD4）を数秒で構成できます。いかなるセキュリティ用途にも使えません。',
            '완전히 깨졌습니다. 충돌(MD5)이나 심지어 원상(MD4)도 수 초 만에 만들 수 있습니다. 어떤 보안 용도에도 쓸 수 없습니다.',
            'Totalement cassés : collisions (MD5) et même préimages (MD4) se fabriquent en quelques secondes. Inutilisables dans tout contexte de sécurité.',
            'Vollständig gebrochen: Kollisionen (MD5) und sogar Urbilder (MD4) entstehen in Sekunden. In keinem Sicherheitskontext einsetzbar.',
            'Полностью взломаны: коллизии (MD5) и даже прообразы (MD4) создаются за секунды. Неприменимы ни в одном сценарии безопасности.'],
      use: ['改用 SHA-256 / SHA-3 / BLAKE2b。', '改用 SHA-256 / SHA-3 / BLAKE2b。', 'Use SHA-256 / SHA-3 / BLAKE2b.', 'SHA-256 / SHA-3 / BLAKE2b を使用してください。', 'SHA-256 / SHA-3 / BLAKE2b를 사용하세요.', 'Utilisez SHA-256 / SHA-3 / BLAKE2b.', 'Verwenden Sie SHA-256 / SHA-3 / BLAKE2b.', 'Используйте SHA-256 / SHA-3 / BLAKE2b.']
    },

    'sec.hash.sha1': {
      title: ['哈希算法不安全', '雜湊演算法不安全', 'Hash algorithm insecure', 'ハッシュアルゴリズムが安全ではありません', '해시 알고리즘이 안전하지 않습니다', 'Algorithme de hachage non sûr', 'Hash-Algorithmus unsicher', 'Хэш-алгоритм небезопасен'],
      why: ['SHAttered 与 SHA-1 选前缀碰撞攻击已证实可行，证书与签名场景已被全面淘汰。',
            'SHAttered 與 SHA-1 選前綴碰撞攻擊已證實可行，憑證與簽章場景已被全面淘汰。',
            'SHAttered and chosen-prefix collision attacks on SHA-1 have been shown practical; it is fully retired for certificates and signatures.',
            'SHAttered や SHA-1 の選定前置き衝突攻撃は実行可能と実証されており、証明書や署名の用途では全面的に廃止されています。',
            'SHAttered 및 SHA-1 선택 접두사 충돌 공격은 실행 가능함이 입증되었으며, 인증서와 서명 용도에서는 전면 퇴출되었습니다.',
            'SHAttered et les attaques de collision à préfixe choisi sur SHA-1 se sont révélées praticables ; il est totalement retiré pour les certificats et signatures.',
            'SHAttered und Chosen-Prefix-Kollisionsangriffe auf SHA-1 sind praktisch erwiesen; für Zertifikate und Signaturen ist es vollständig ausgemustert.',
            'SHAttered и атаки на коллизии с выбранным префиксом для SHA-1 признаны практически осуществимыми; для сертификатов и подписей он полностью выведен из употребления.'],
      use: ['改用 SHA-256 或以上。', '改用 SHA-256 或以上。', 'Use SHA-256 or above.', 'SHA-256 以上を使用してください。', 'SHA-256 이상을 사용하세요.', 'Utilisez SHA-256 ou mieux.', 'Verwenden Sie SHA-256 oder höher.', 'Используйте SHA-256 или выше.']
    },

    'sec.hash.ripemd': {
      title: ['哈希算法不安全', '雜湊演算法不安全', 'Hash algorithm insecure', 'ハッシュアルゴリズムが安全ではありません', '해시 알고리즘이 안전하지 않습니다', 'Algorithme de hachage non sûr', 'Hash-Algorithmus unsicher', 'Хэш-алгоритм небезопасен'],
      why: ['160 位输出，碰撞强度仅约 80 位，且缺乏现代的广泛使用与审计。',
            '160 位元輸出，碰撞強度僅約 80 位元，且缺乏現代的廣泛使用與審計。',
            '160-bit output, so collision strength is only about 80 bits, and it lacks broad modern usage and auditing.',
            '160 ビット出力のため衝突強度は約 80 ビットにとどまり、現代における広範な利用と監査も欠いています。',
            '160비트 출력이라 충돌 강도가 약 80비트에 불과하며, 현대의 폭넓은 사용과 감사도 부족합니다.',
            'Sortie de 160 bits : la résistance aux collisions n\'est que d\'environ 80 bits, et il manque d\'usage moderne étendu et d\'audit.',
            '160-Bit-Ausgabe, damit nur etwa 80 Bit Kollisionsstärke; außerdem fehlt breite moderne Nutzung und Prüfung.',
            'Выход 160 бит, поэтому стойкость к коллизиям лишь около 80 бит; также отсутствуют широкое современное применение и аудит.'],
      use: ['改用 SHA-256。', '改用 SHA-256。', 'Use SHA-256.', 'SHA-256 を使用してください。', 'SHA-256을 사용하세요.', 'Utilisez SHA-256.', 'Verwenden Sie SHA-256.', 'Используйте SHA-256.']
    },

    'sec.asym.rsa1024': {
      title: ['非对称参数偏弱', '非對稱參數偏弱', 'Asymmetric parameters weak', '非対称パラメータが弱い', '비대칭 매개변수가 약함', 'Paramètres asymétriques faibles', 'Asymmetrische Parameter schwach', 'Слабые асимметричные параметры'],
      why: ['1024 位 RSA 的分解难度已接近可攻破边缘，学术界公认不安全。',
            '1024 位元 RSA 的分解難度已接近可攻破邊緣，學術界公認不安全。',
            'Factoring 1024-bit RSA is close to the edge of feasibility; the academic community regards it as insecure.',
            '1024 ビット RSA の因数分解は実行可能な境界に近づいており、学界では安全でないと広く認められています。',
            '1024비트 RSA의 소인수분해는 실행 가능한 경계에 가까우며 학계에서는 안전하지 않다고 널리 인정됩니다.',
            'La factorisation de RSA 1024 bits est proche de la limite du faisable ; la communauté académique la considère comme non sûre.',
            'Die Faktorisierung von 1024-Bit-RSA liegt nahe an der Machbarkeitsgrenze; die Wissenschaft hält sie für unsicher.',
            'Факторизация 1024-битного RSA близка к грани осуществимости; академическое сообщество считает его небезопасным.'],
      use: ['至少 2048 位，推荐 3072 位或改用 ECC / SM2。',
            '至少 2048 位元，推薦 3072 位元或改用 ECC / SM2。',
            'Use at least 2048 bits; 3072 bits or ECC / SM2 is recommended.',
            '2048 ビット以上、できれば 3072 ビット、または ECC / SM2 への移行を推奨します。',
            '최소 2048비트, 권장은 3072비트 또는 ECC / SM2로 전환입니다.',
            'Au moins 2048 bits ; 3072 bits ou ECC / SM2 sont recommandés.',
            'Mindestens 2048 Bit; empfohlen sind 3072 Bit oder ECC / SM2.',
            'Минимум 2048 бит; рекомендуется 3072 бит или ECC / SM2.']
    },

    'sec.asym.dh': {
      title: ['非对称参数偏弱', '非對稱參數偏弱', 'Asymmetric parameters weak', '非対称パラメータが弱い', '비대칭 매개변수가 약함', 'Paramètres asymétriques faibles', 'Asymmetrische Parameter schwach', 'Слабые асимметричные параметры'],
      why: ['经典有限域离散对数体系：1024 位参数已不安全，且参数生成若不规范可能存在后门。',
            '經典有限域離散對數體系：1024 位元參數已不安全，且參數生成若不规范可能存在後門。',
            'Classical finite-field discrete logarithm systems: 1024-bit parameters are no longer secure, and non-standard parameter generation may hide backdoors.',
            '古典的な有限体離散対数体系です。1024 ビットパラメータは既に安全でなく、パラメータ生成が適切でない場合バックドアが仕込まれている可能性があります。',
            '고전적 유한체 이산대수 체계입니다. 1024비트 매개변수는 더 이상 안전하지 않고, 매개변수 생성 절차가 부실하면 백도어가 숨어 있을 수 있습니다.',
            'Systèmes classiques de logarithme discret sur corps fini : les paramètres 1024 bits ne sont plus sûrs, et une génération non conforme peut cacher des portes dérobées.',
            'Klassische diskrete Logarithmen über endlichen Körpern: 1024-Bit-Parameter sind nicht mehr sicher, und unsaubere Parametererzeugung kann Hintertüren bergen.',
            'Классические системы дискретного логарифма в конечном поле: 1024-битные параметры уже небезопасны, а нестандартная генерация параметров может скрывать бэкдоры.'],
      use: ['改用 ECC（P-256 起）或 SM2。', '改用 ECC（P-256 起）或 SM2。', 'Use ECC (from P-256) or SM2.', 'ECC（P-256 以上）または SM2 を使用してください。', 'ECC(P-256 이상) 또는 SM2를 사용하세요.', 'Utilisez ECC (à partir de P-256) ou SM2.', 'Verwenden Sie ECC (ab P-256) oder SM2.', 'Используйте ECC (начиная с P-256) или SM2.']
    },

    'sec.asym.rsa2048': {
      title: ['非对称参数偏弱', '非對稱參數偏弱', 'Asymmetric parameters weak', '非対称パラメータが弱い', '비대칭 매개변수가 약함', 'Paramètres asymétriques faibles', 'Asymmetrische Parameter schwach', 'Слабые асимметричные параметры'],
      why: ['2048 位 RSA 目前仍可接受，但长期（2030 年后）不建议，且抗量子能力为零。',
            '2048 位元 RSA 目前仍可接受，但長期（2030 年後）不建議，且抗量子能力為零。',
            '2048-bit RSA is still acceptable today, but not recommended long-term (after 2030), and it offers zero quantum resistance.',
            '2048 ビット RSA は現時点では許容されますが、長期的には（2030 年以降）推奨されず、耐量子性は皆無です。',
            '2048비트 RSA는 현재는 허용되지만 장기적으로(2030년 이후)는 권장되지 않으며 양자 내성은 전혀 없습니다.',
            'RSA 2048 bits reste acceptable aujourd\'hui, mais n\'est pas recommandé à long terme (après 2030) et n\'offre aucune résistance quantique.',
            '2048-Bit-RSA ist heute noch akzeptabel, langfristig (nach 2030) aber nicht empfohlen, und es bietet keinerlei Quantenresistenz.',
            '2048-битный RSA сегодня ещё приемлем, но в долгосрочной перспективе (после 2030) не рекомендуется и не даёт никакой квантовой стойкости.'],
      use: ['新系统建议 3072 位或 ECC / SM2。', '新系統建議 3072 位元或 ECC / SM2。', 'New systems should use 3072 bits or ECC / SM2.', '新規システムでは 3072 ビットまたは ECC / SM2 を推奨します。', '새 시스템에는 3072비트 또는 ECC / SM2를 권장합니다.', 'Les nouveaux systèmes devraient utiliser 3072 bits ou ECC / SM2.', 'Neue Systeme sollten 3072 Bit oder ECC / SM2 nutzen.', 'Для новых систем рекомендуются 3072 бит или ECC / SM2.']
    },

    'sec.sweet32': {
      title: ['64 位块存在 Sweet32 风险', '64 位元區塊存在 Sweet32 風險', '64-bit block: Sweet32 risk', '64 ビットブロックに Sweet32 のリスク', '64비트 블록의 Sweet32 위험', 'Bloc 64 bits : risque Sweet32', '64-Bit-Block: Sweet32-Risiko', '64-битный блок: риск Sweet32'],
      why: ['{id} 的块只有 8 字节：同一密钥加密约 2^32 个块（约 32 GB）后，生日攻击可开始泄露明文块之间的关系。',
            '{id} 的區塊只有 8 位元組：同一金鑰加密約 2^32 個區塊（約 32 GB）後，生日攻擊可開始洩漏明文區塊之間的關係。',
            '{id} has only an 8-byte block: after about 2^32 blocks (~32 GB) under one key, birthday attacks can start leaking relationships between plaintext blocks.',
            '{id} のブロックは 8 バイトしかありません。同一鍵で約 2^32 ブロック（約 32 GB）を暗号化すると、誕生日攻撃によって平文ブロック間の関係が漏れ始めます。',
            '{id}의 블록은 8바이트뿐입니다. 같은 키로 약 2^32블록(약 32GB)을 암호화하면 생일 공격으로 평문 블록 간 관계가 드러나기 시작합니다.',
            '{id} n\'a qu\'un bloc de 8 octets : après environ 2^32 blocs (~32 Go) sous une même clé, les attaques d\'anniversaire peuvent révéler des relations entre blocs clairs.',
            '{id} hat nur einen 8-Byte-Block: Nach etwa 2^32 Blöcken (~32 GB) unter einem Schlüssel können Geburtstagsangriffe Beziehungen zwischen Klartextblöcken offenlegen.',
            'У {id} блок всего 8 байт: после примерно 2^32 блоков (~32 ГБ) на одном ключе атаки дней рождения могут начать раскрывать связи между блоками открытого текста.'],
      use: ['改用 AES / Camellia / SM4 等 128 位块算法，或限制单密钥加密的数据量。',
            '改用 AES / Camellia / SM4 等 128 位元區塊演算法，或限制單金鑰加密的資料量。',
            'Use an algorithm with a 128-bit block (AES / Camellia / SM4), or limit how much data a single key encrypts.',
            'AES / Camellia / SM4 など 128 ビットブロックのアルゴリズムを使用するか、単一鍵で暗号化するデータ量を制限してください。',
            'AES / Camellia / SM4 등 128비트 블록 알고리즘을 사용하거나, 단일 키로 암호화하는 데이터 양을 제한하세요.',
            'Utilisez un algorithme à bloc de 128 bits (AES / Camellia / SM4), ou limitez le volume chiffré par une même clé.',
            'Nutzen Sie einen Algorithmus mit 128-Bit-Block (AES / Camellia / SM4) oder begrenzen Sie die Datenmenge pro Schlüssel.',
            'Используйте алгоритм с 128-битным блоком (AES / Camellia / SM4) или ограничьте объём данных на один ключ.']
    },

    'sec.gg20': {
      title: ['GG20 存在已知攻击面（Alpha-Rays）', 'GG20 存在已知攻擊面（Alpha-Rays）', 'GG20 has a known attack surface (Alpha-Rays)', 'GG20 には既知の攻撃面があります（Alpha-Rays）', 'GG20에는 알려진 공격 표면이 있습니다(Alpha-Rays)', 'GG20 présente une surface d\'attaque connue (Alpha-Rays)', 'GG20 hat eine bekannte Angriffsfläche (Alpha-Rays)', 'У GG20 есть известная поверхность атаки (Alpha-Rays)'],
      why: ['2023 年披露的 Alpha-Rays 攻击针对 GG18/GG20 一类 ECDSA 阈值协议的实现缺陷，多家主流库受影响。此外本实现只包含协议的算术核心（Paillier + MtA），未实现原论文中的范围证明、MtA 正确性与一致性零知识证明，因此无法抵御恶意参与者的偏离行为。',
            '2023 年揭露的 Alpha-Rays 攻擊針對 GG18/GG20 一類 ECDSA 閾值協定的實作缺陷，多家主流庫受影響。此外本實作只包含協定的算術核心（Paillier + MtA），未實作原論文中的範圍證明、MtA 正確性與一致性零知識證明，因此無法抵禦惡意參與者的偏離行為。',
            'The Alpha-Rays attacks disclosed in 2023 target implementation flaws in ECDSA threshold protocols of the GG18/GG20 family; several mainstream libraries were affected. In addition, this implementation contains only the arithmetic core (Paillier + MtA) and lacks the range proofs and the MtA correctness/consistency zero-knowledge proofs of the original paper, so it cannot resist deviation by malicious participants.',
            '2023 年に公開された Alpha-Rays 攻撃は GG18/GG20 系の ECDSA 閾値プロトコルの実装上の欠陥を標的としており、複数の主要ライブラリが影響を受けました。さらに本実装はプロトコルの算術の中核（Paillier + MtA）のみを含み、原論文の範囲証明や MtA の正当性・一致性ゼロ知識証明を実装していないため、悪意ある参加者の逸脱行為に耐えられません。',
            '2023년에 공개된 Alpha-Rays 공격은 GG18/GG20 계열 ECDSA 임계값 프로토콜의 구현 결함을 노리며 여러 주요 라이브러리가 영향을 받았습니다. 또한 이 구현은 프로토콜의 산술 핵심(Paillier + MtA)만 포함하고 원 논문의 범위 증명과 MtA 정당성·일관성 영지식 증명을 구현하지 않아 악의적 참여자의 이탈 행위를 막을 수 없습니다.',
            'Les attaques Alpha-Rays divulguées en 2023 ciblent des défauts d\'implémentation des protocoles ECDSA à seuil de type GG18/GG20 ; plusieurs bibliothèques courantes ont été touchées. De plus, cette implémentation ne contient que le noyau arithmétique (Paillier + MtA) et omet les preuves de plage et les preuves à divulgation nulle de correction/cohérence MtA de l\'article original : elle ne résiste donc pas aux déviations de participants malveillants.',
            'Die 2023 veröffentlichten Alpha-Rays-Angriffe zielen auf Implementierungsfehler in ECDSA-Schwellenprotokollen der GG18/GG20-Familie; mehrere gängige Bibliotheken waren betroffen. Zudem enthält diese Implementierung nur den arithmetischen Kern (Paillier + MtA) und nicht die Bereichsbeweise sowie die MtA-Korrektheits-/Konsistenz-Zero-Knowledge-Beweise der Originalarbeit und hält damit böswilligen Abweichungen nicht stand.',
            'Раскрытые в 2023 году атаки Alpha-Rays нацелены на недостатки реализации пороговых протоколов ECDSA семейства GG18/GG20; пострадал ряд распространённых библиотек. Кроме того, эта реализация содержит лишь арифметическое ядро (Paillier + MtA) и не включает доказательства диапазона и Zero-Knowledge-доказательства корректности/согласованности MtA из исходной статьи, поэтому не способна противостоять отклонениям злонамеренных участников.'],
      use: ['真实资产请使用 FROST（RFC 9591）：它是 IETF 标准、结构更简单、且已内建对恶意行为的防护。本条目仅供协议学习与演示。',
            '真實資產請使用 FROST（RFC 9591）：它是 IETF 標準、結構更簡單、且已內建對惡意行為的防護。本條目僅供協定學習與演示。',
            'For real assets use FROST (RFC 9591): it is an IETF standard, structurally simpler, and has built-in protection against malicious behaviour. This entry is for protocol study and demonstration only.',
            '実際の資産には FROST（RFC 9591）を使用してください。IETF 標準であり、構造がより単純で、悪意ある挙動への防护が組み込まれています。本項目はプロトコルの学習とデモ専用です。',
            '실제 자산에는 FROST(RFC 9591)를 사용하세요. IETF 표준이며 구조가 더 단순하고 악의적 행위에 대한 보호가 내장되어 있습니다. 이 항목은 프로토콜 학습과 시연 전용입니다.',
            'Pour des actifs réels, utilisez FROST (RFC 9591) : c\'est un standard IETF, structurellement plus simple, avec une protection intégrée contre les comportements malveillants. Cette entrée sert uniquement à l\'étude et à la démonstration du protocole.',
            'Für reale Werte verwenden Sie FROST (RFC 9591): ein IETF-Standard, strukturell einfacher und mit eingebautem Schutz gegen böswilliges Verhalten. Dieser Eintrag dient nur dem Studium und der Demonstration des Protokolls.',
            'Для реальных активов используйте FROST (RFC 9591): это стандарт IETF, структурно более простой и со встроенной защитой от злонамеренного поведения. Данная запись предназначена только для изучения и демонстрации протокола.']
    },

    'sec.frost': {
      title: ['FROST 的协作前提', 'FROST 的協作前提', 'FROST collaboration prerequisite', 'FROST の協調の前提', 'FROST 협업 전제', 'Prérequis de collaboration FROST', 'FROST-Voraussetzung für Zusammenarbeit', 'Предпосылка совместной работы FROST'],
      why: ['阈值签名要求 t 个参与者各自用【自己的份额】参与两轮交互；任何单一方都不掌握完整私钥。本工具为单机演示，所有份额在同一页面内使用，不具备真实多方部署的隔离性。',
            '閾值簽章要求 t 個參與者各自用【自己的份額】參與兩輪互動；任何單一方都不掌握完整私鑰。本工具為單機演示，所有份額在同一頁面內使用，不具備真實多方部署的隔離性。',
            'Threshold signing requires t participants to take part in two rounds, each using their own share; no single party ever holds the complete private key. This tool is a single-machine demo: all shares are used within one page, so it lacks the isolation of a real multi-party deployment.',
            '閾値署名では t 人の参加者がそれぞれ【自分のシェア】を使って二巡のやり取りに参加する必要があり、どの単一の参加者も完全な秘密鍵を保持しません。本ツールは単機デモであり、すべてのシェアが同一ページ内で使われるため、実際のマルチパーティ配備のような分離性はありません。',
            '임계값 서명은 t명의 참여자가 각각 【자신의 몫】으로 두 차례 상호작용에 참여해야 하며, 어떤 단일 당사자도 완전한 개인키를 갖지 않습니다. 이 도구는 단일 기기 데모이므로 모든 몫이 한 페이지 안에서 사용되어 실제 다자 배포의 격리성이 없습니다.',
            'La signature à seuil exige que t participants participent à deux tours, chacun avec sa propre part ; aucune partie ne détient la clé privée complète. Cet outil est une démonstration sur une seule machine : toutes les parts sont utilisées dans une même page, sans l\'isolation d\'un déploiement multi-parties réel.',
            'Threshold-Signatur erfordert, dass t Teilnehmer in zwei Runden jeweils mit ihrem eigenen Anteil mitwirken; keine Partei hält je den vollständigen privaten Schlüssel. Dieses Werkzeug ist eine Einzelplatz-Demo: alle Anteile werden auf einer Seite genutzt, ohne die Isolation eines echten Mehrparteien-Betriebs.',
            'Пороговая подпись требует участия t участников в двух раундах, каждый со своей долей; ни одна сторона не владеет полным закрытым ключом. Этот инструмент — однопользовательская демонстрация: все доли используются на одной странице, без изоляции реального многостороннего развёртывания.'],
      use: ['生产环境请让各参与方在各自设备上独立运行协议，仅交换承诺与签名份额。',
            '生產環境請讓各參與方在各自設備上獨立運行協定，僅交換承諾與簽章份額。',
            'In production, have each party run the protocol independently on their own device, exchanging only commitments and signature shares.',
            '本番環境では各参加者がそれぞれの端末で独立してプロトコルを実行し、コミットメントと署名シェアのみを交換してください。',
            '운영 환경에서는 각 참여자가 자신의 기기에서 독립적으로 프로토콜을 실행하고 커밋먼트와 서명 몫만 교환하세요.',
            'En production, chaque partie doit exécuter le protocole indépendamment sur son propre appareil, en n\'échangeant que les engagements et les parts de signature.',
            'In Produktion sollte jede Partei das Protokoll auf ihrem eigenen Gerät unabhängig ausführen und nur Commitments und Signaturanteile austauschen.',
            'В промышленной среде каждая сторона должна выполнять протокол независимо на своём устройстве, обмениваясь только коммитментами и долями подписи.']
    },

    'sec.elgamal': {
      title: ['ElGamal 密文会膨胀', 'ElGamal 密文會膨脹', 'ElGamal ciphertext expansion', 'ElGamal 暗号文の膨張', 'ElGamal 암호문 팽창', 'Expansion du chiffré ElGamal', 'ElGamal-Geheimtext-Expansion', 'Раздувание шифртекста ElGamal'],
      why: ['每个明文块产生两个密文块，加上分帧开销，最终密文约为明文的 256 倍。',
            '每個明文區塊產生兩個密文區塊，加上分幀開銷，最終密文約為明文的 256 倍。',
            'Each plaintext block produces two ciphertext blocks; with framing overhead the final ciphertext is about 256 times the plaintext.',
            '各平文ブロックから二つの暗号文ブロックが生成され、フレーミングのオーバーヘッドも加わるため、最終的な暗号文は平文の約 256 倍になります。',
            '각 평문 블록에서 두 개의 암호문 블록이 생성되고 프레이밍 오버헤드까지 더해져 최종 암호문은 평문의 약 256배가 됩니다.',
            'Chaque bloc clair produit deux blocs chiffrés ; avec le coût de tramage, le chiffré final vaut environ 256 fois le clair.',
            'Jeder Klartextblock erzeugt zwei Geheimtextblöcke; mit Framing-Overhead ist der Geheimtext am Ende etwa 256-mal so groß wie der Klartext.',
            'Каждый блок открытого текста даёт два блока шифртекста; с учётом накладных расходов на кадрирование итоговый шифртекст примерно в 256 раз больше открытого текста.'],
      use: ['只用来加密会话密钥，数据本体用对称加密（混合加密）。',
            '只用來加密會話金鑰，資料本體用對稱加密（混合加密）。',
            'Use it only to encrypt session keys; encrypt the data itself symmetrically (hybrid encryption).',
            'セッション鍵の暗号化にのみ使用し、データ本体は対称暗号（ハイブリッド暗号）で暗号化してください。',
            '세션 키 암호화에만 사용하고 데이터 본문은 대칭 암호(하이브리드 암호화)로 암호화하세요.',
            'Utilisez-le uniquement pour chiffrer des clés de session ; chiffrez les données elles-mêmes en symétrique (chiffrement hybride).',
            'Verwenden Sie es nur zum Verschlüsseln von Sitzungsschlüsseln; die eigentlichen Daten werden symmetrisch verschlüsselt (hybride Verschlüsselung).',
            'Используйте его только для шифрования сессионных ключей; сами данные шифруйте симметрично (гибридное шифрование).']
    },

    'sec.pad.zero': {
      title: ['零填充有歧义', '零填充有歧義', 'Zero padding is ambiguous', 'ゼロ埋めには曖昧さがあります', '제로 패딩은 모호합니다', 'Le remplissage zéro est ambigu', 'Null-Padding ist mehrdeutig', 'Нулевое дополнение неоднозначно'],
      why: ['解密时无法区分「补的零」和「明文自带的零」：明文末尾若本来就是 0x00，会被当作填充一并剥掉。',
            '解密時無法區分「補的零」和「明文自帶的零」：明文末尾若本來就是 0x00，會被當作填充一併剝掉。',
            'On decryption you cannot tell "padding zeros" from "zeros that belong to the plaintext": if the plaintext already ends in 0x00, it will be stripped along with the padding.',
            '復号時に「埋めたゼロ」と「平文が元々持つゼロ」を区別できません。平文の末尾が元々 0x00 だった場合、パディングと一緒に削り取られます。',
            '복호화할 때 「채운 0」과 「평문이 원래 가진 0」을 구분할 수 없습니다. 평문 끝이 원래 0x00이면 패딩과 함께 잘려 나갑니다.',
            'Au déchiffrement, on ne peut distinguer les « zéros de remplissage » des « zéros appartenant au clair » : si le clair se termine déjà par 0x00, il sera retiré avec le remplissage.',
            'Bei der Entschlüsselung sind „aufgefüllte Nullen" und „Nullen des Klartexts" nicht unterscheidbar: Endet der Klartext ohnehin auf 0x00, wird er mit dem Padding entfernt.',
            'При расшифровании нельзя отличить «дополняющие нули» от «нулей самого открытого текста»: если открытый текст и так оканчивается на 0x00, он будет удалён вместе с дополнением.'],
      use: ['改用 PKCS7（唯一无歧义的通用填充）。', '改用 PKCS7（唯一無歧義的通用填充）。', 'Use PKCS7 (the only unambiguous general padding).', 'PKCS7（曖昧さのない唯一の汎用パディング）を使用してください。', 'PKCS7(모호하지 않은 유일한 범용 패딩)를 사용하세요.', 'Utilisez PKCS7 (le seul remplissage général non ambigu).', 'Verwenden Sie PKCS7 (das einzige eindeutige Universal-Padding).', 'Используйте PKCS7 (единственное однозначное универсальное дополнение).']
    },

    'sec.pad.none': {
      title: ['未启用填充', '未啟用填充', 'Padding not enabled', 'パディングが無効です', '패딩이 비활성화됨', 'Remplissage non activé', 'Padding nicht aktiviert', 'Дополнение не включено'],
      why: ['无填充时明文长度必须是块大小的整数倍，否则会被截断或直接报错。',
            '無填充時明文長度必須是區塊大小的整數倍，否則會被截斷或直接報錯。',
            'Without padding the plaintext length must be an exact multiple of the block size, otherwise it will be truncated or raise an error.',
            'パディングがない場合、平文の長さはブロックサイズの整数倍でなければならず、そうでなければ切り詰められるかエラーになります。',
            '패딩이 없으면 평문 길이는 블록 크기의 정수배여야 하며, 그렇지 않으면 잘리거나 오류가 납니다.',
            'Sans remplissage, la longueur du clair doit être un multiple exact de la taille de bloc, sinon il sera tronqué ou une erreur sera levée.',
            'Ohne Padding muss die Klartextlänge ein exaktes Vielfaches der Blockgröße sein, sonst wird gekürzt oder ein Fehler ausgelöst.',
            'Без дополнения длина открытого текста должна быть точным кратным размера блока, иначе он будет обрезан или возникнет ошибка.'],
      use: ['改用 PKCS7，或在流模式 / AEAD 下自然无需填充。', '改用 PKCS7，或在串流模式 / AEAD 下自然無需填充。', 'Use PKCS7, or work in a stream / AEAD mode where padding is naturally unnecessary.', 'PKCS7 を使用するか、パディングが本質的に不要なストリームモード / AEAD を利用してください。', 'PKCS7을 사용하거나 패딩이 본질적으로 필요 없는 스트림 모드 / AEAD를 이용하세요.', 'Utilisez PKCS7, ou un mode flux / AEAD où le remplissage est naturellement inutile.', 'Verwenden Sie PKCS7 oder einen Strom-/AEAD-Modus, bei dem Padding naturgemäß entfällt.', 'Используйте PKCS7 или поточный режим / AEAD, где дополнение естественным образом не требуется.']
    },

    'sec.pad.loose': {
      title: ['宽松填充校验构成攻击面', '寬鬆填充驗證構成攻擊面', 'Loose padding check is an attack surface', '緩いパディング検証は攻撃面になります', '느슨한 패딩 검증은 공격 표면이 됩니다', 'Une vérification de remplissage souple est une surface d\'attaque', 'Laxe Padding-Prüfung ist eine Angriffsfläche', 'Слабая проверка дополнения — поверхность атаки'],
      why: ['宽松模式下填充不合规也不报错，这正是 Padding Oracle 攻击所依赖的「可区分的失败信号」。攻击者可借此逐字节还原明文。',
            '寬鬆模式下填充不合規也不報錯，這正是 Padding Oracle 攻擊所依賴的「可區分的失敗訊號」。攻擊者可藉此逐位元組還原明文。',
            'In loose mode, invalid padding produces no error — exactly the "distinguishable failure signal" that Padding Oracle attacks rely on. An attacker can use it to recover the plaintext byte by byte.',
            '緩いモードではパディングが不正でもエラーにならず、これは Padding Oracle 攻撃が依存する「識別可能な失敗信号」そのものです。攻撃者はこれを利用して平文を 1 バイトずつ復元できます。',
            '느슨한 모드에서는 패딩이 잘못되어도 오류가 나지 않으며, 이는 Padding Oracle 공격이 의존하는 「구별 가능한 실패 신호」 그 자체입니다. 공격자는 이를 이용해 평문을 바이트 단위로 복원할 수 있습니다.',
            'En mode souple, un remplissage invalide ne produit aucune erreur — exactement le « signal d\'échec distinguable » sur lequel reposent les attaques Padding Oracle. Un attaquant peut ainsi reconstituer le clair octet par octet.',
            'Im lax-Modus erzeugt ungültiges Padding keinen Fehler — genau das „unterscheidbare Fehlersignal", auf dem Padding-Oracle-Angriffe beruhen. Ein Angreifer kann so den Klartext Byte für Byte rekonstruieren.',
            'В мягком режиме неверное дополнение не вызывает ошибки — это именно тот «различимый сигнал отказа», на который опираются атаки Padding Oracle. Атакующий может восстановить открытый текст побайтово.'],
      use: ['务必切回「严格」。解密来路不明的旧数据时才临时放宽。',
            '務必切回「嚴格」。解密來路不明的舊資料時才臨時放寬。',
            'Switch back to "strict". Only relax it temporarily when decrypting legacy data of unknown origin.',
            '必ず「厳格」に戻してください。出所不明の旧データを復号するときだけ一時的に緩めてください。',
            '반드시 「엄격」으로 되돌리세요. 출처가 불분명한 옛 데이터를 복호화할 때만 일시적으로 완화하세요.',
            'Revenez à « strict ». Ne l\'assouplissez que temporairement pour déchiffrer des données anciennes d\'origine inconnue.',
            'Wechseln Sie zurück auf „streng". Lockern Sie es nur vorübergehend für Altdaten unbekannter Herkunft.',
            'Обязательно верните «строгий» режим. Ослабляйте его лишь временно при расшифровании старых данных неизвестного происхождения.']
    },

    'sec.kdf.legacy': {
      title: ['旧版口令派生极不安全', '舊版口令派生極不安全', 'Legacy password derivation is extremely unsafe', '旧版パスワード派生は極めて危険です', '구버전 비밀번호 파생은 매우 위험합니다', 'La dérivation de mot de passe héritée est extrêmement dangereuse', 'Alte Passwort-Ableitung ist extrem unsicher', 'Устаревшая деривация пароля крайне небезопасна'],
      why: ['仅对口令做一次 SHA-256 再循环填充：单次哈希没有成本放大，GPU 上每秒可试数十亿个口令。',
            '僅對口令做一次 SHA-256 再循環填充：單次雜湊沒有成本放大，GPU 上每秒可試數十億個口令。',
            'It applies just one SHA-256 pass over the password and then cycles the result: a single hash has no cost amplification, so billions of passwords per second can be tried on a GPU.',
            'パスワードに SHA-256 を一度かけて結果を循環させるだけです。単一のハッシュにはコスト増幅がなく、GPU なら毎秒数十億個のパスワードを試せます。',
            '비밀번호에 SHA-256을 한 번 적용하고 결과를 순환시킬 뿐입니다. 단일 해시에는 비용 증폭이 없어 GPU에서 초당 수십억 개의 비밀번호를 시도할 수 있습니다.',
            'Il n\'applique qu\'un seul SHA-256 au mot de passe puis recycle le résultat : un hachage unique n\'amplifie pas le coût, donc des milliards de mots de passe par seconde peuvent être essayés sur GPU.',
            'Es wendet nur einmal SHA-256 auf das Passwort an und führt das Ergebnis zyklisch fort: Ein einzelner Hash verstärkt die Kosten nicht, auf einer GPU lassen sich Milliarden Passwörter pro Sekunde probieren.',
            'Применяется лишь один проход SHA-256 к паролю с последующим циклическим заполнением: одиночный хэш не даёт увеличения стоимости, поэтому на GPU можно перебирать миллиарды паролей в секунду.'],
      use: ['改用 Argon2id 或 PBKDF2（≥210000 次）。此档位仅用于解开历史密文。',
            '改用 Argon2id 或 PBKDF2（≥210000 次）。此檔位僅用於解開歷史密文。',
            'Use Argon2id or PBKDF2 (≥210000 iterations). This option exists only to open legacy ciphertexts.',
            'Argon2id または PBKDF2（210000 回以上）を使用してください。この設定は過去の暗号文を開くためだけに存在します。',
            'Argon2id 또는 PBKDF2(210000회 이상)를 사용하세요. 이 옵션은 과거 암호문을 열 때만 존재합니다.',
            'Utilisez Argon2id ou PBKDF2 (≥210000 itérations). Cette option ne sert qu\'à ouvrir des chiffrés anciens.',
            'Verwenden Sie Argon2id oder PBKDF2 (≥210000 Iterationen). Diese Stufe dient nur zum Öffnen alter Geheimtexte.',
            'Используйте Argon2id или PBKDF2 (≥210000 итераций). Этот режим существует только для открытия старых шифртекстов.']
    },

    'sec.kdf.lowiter': {
      title: ['PBKDF2 迭代次数过低', 'PBKDF2 迭代次數過低', 'PBKDF2 iteration count too low', 'PBKDF2 の反復回数が少なすぎます', 'PBKDF2 반복 횟수가 너무 적음', 'Nombre d\'itérations PBKDF2 trop faible', 'PBKDF2-Iterationszahl zu niedrig', 'Слишком мало итераций PBKDF2'],
      why: ['当前 {n} 次，远低于 OWASP 建议的 210000，抗暴力破解能力很弱。',
            '當前 {n} 次，遠低於 OWASP 建議的 210000，抗暴力破解能力很弱。',
            'Currently {n} iterations, far below the 210000 recommended by OWASP; resistance to brute force is very weak.',
            '現在 {n} 回で、OWASP が推奨する 210000 を大きく下回っており、総当たりへの耐性が非常に弱いです。',
            '현재 {n}회로 OWASP 권장 210000에 크게 못 미치며 무차별 대입 저항이 매우 약합니다.',
            'Actuellement {n} itérations, bien en dessous des 210000 recommandés par l\'OWASP ; la résistance à la force brute est très faible.',
            'Derzeit {n} Iterationen, weit unter den von OWASP empfohlenen 210000; der Schutz gegen Brute Force ist sehr schwach.',
            'Сейчас {n} итераций, что значительно ниже рекомендованных OWASP 210000; стойкость к перебору очень слабая.'],
      use: ['调到 210000 以上；或改用 Argon2id。', '調到 210000 以上；或改用 Argon2id。', 'Raise it to 210000 or more; or switch to Argon2id.', '210000 以上に引き上げるか、Argon2id に変更してください。', '210000 이상으로 올리거나 Argon2id로 바꾸세요.', 'Portez-le à 210000 ou plus ; ou passez à Argon2id.', 'Erhöhen Sie auf 210000 oder mehr; oder wechseln Sie zu Argon2id.', 'Поднимите до 210000 или выше; либо перейдите на Argon2id.']
    },

    'sec.kdf.sha1': {
      title: ['用 SHA-1 做口令派生', '用 SHA-1 做口令派生', 'Using SHA-1 for password derivation', 'パスワード派生に SHA-1 を使用', '비밀번호 파생에 SHA-1 사용', 'SHA-1 utilisé pour la dérivation', 'SHA-1 für die Passwort-Ableitung', 'Использование SHA-1 для деривации пароля'],
      why: ['SHA-1 已可构造碰撞，虽对 PBKDF2 的直接影响小于签名场景，但不应出现在新系统里。',
            'SHA-1 已可構造碰撞，雖對 PBKDF2 的直接影響小於簽章場景，但不應出現在新系統裡。',
            'SHA-1 collisions can now be constructed. Although the direct impact on PBKDF2 is smaller than in signature scenarios, it should not appear in new systems.',
            'SHA-1 では衝突を構成可能です。PBKDF2 への直接的な影響は署名用途より小さいものの、新規システムで使うべきではありません。',
            'SHA-1은 충돌 구성이 가능합니다. PBKDF2에 대한 직접적 영향은 서명 시나리오보다 작지만 새 시스템에 등장해서는 안 됩니다.',
            'Des collisions SHA-1 peuvent désormais être construites. Bien que l\'impact direct sur PBKDF2 soit moindre que pour les signatures, il ne devrait pas figurer dans de nouveaux systèmes.',
            'Für SHA-1 lassen sich Kollisionen konstruieren. Die direkte Auswirkung auf PBKDF2 ist geringer als bei Signaturen, dennoch sollte es in neuen Systemen nicht vorkommen.',
            'Для SHA-1 уже можно строить коллизии. Хотя прямое влияние на PBKDF2 меньше, чем в сценариях подписи, он не должен встречаться в новых системах.'],
      use: ['改用 SHA-256 或以上。', '改用 SHA-256 或以上。', 'Use SHA-256 or above.', 'SHA-256 以上を使用してください。', 'SHA-256 이상을 사용하세요.', 'Utilisez SHA-256 ou mieux.', 'Verwenden Sie SHA-256 oder höher.', 'Используйте SHA-256 или выше.']
    },

    'sec.kdf.bcrypt': {
      title: ['bcrypt 会截断长口令', 'bcrypt 會截斷長口令', 'bcrypt truncates long passwords', 'bcrypt は長いパスワードを切り詰めます', 'bcrypt는 긴 비밀번호를 잘라냅니다', 'bcrypt tronque les mots de passe longs', 'bcrypt schneidet lange Passwörter ab', 'bcrypt обрезает длинные пароли'],
      why: ['bcrypt 只取口令前 72 字节，超出部分被静默丢弃——口令很长时实际参与派生的并不是全部字符。',
            'bcrypt 只取口令前 72 位元組，超出部分被靜默丟棄——口令很長時實際參與派生的並不是全部字元。',
            'bcrypt only uses the first 72 bytes of the password; anything beyond is silently discarded — so with a very long password, not all characters actually take part in the derivation.',
            'bcrypt はパスワードの先頭 72 バイトしか使わず、それを超える分は黙って捨てられます。パスワードが非常に長い場合、実際に派生に参加するのは全文字ではありません。',
            'bcrypt는 비밀번호의 앞 72바이트만 사용하고 나머지는 조용히 버립니다. 비밀번호가 매우 길면 실제로 파생에 참여하는 것은 전체 문자가 아닙니다.',
            'bcrypt n\'utilise que les 72 premiers octets du mot de passe ; le reste est ignoré silencieusement — avec un mot de passe très long, tous les caractères ne participent pas à la dérivation.',
            'bcrypt nutzt nur die ersten 72 Byte des Passworts; der Rest wird stillschweigend verworfen — bei sehr langen Passwörtern nehmen nicht alle Zeichen an der Ableitung teil.',
            'bcrypt использует только первые 72 байта пароля; остальное молча отбрасывается — при очень длинном пароле в деривации участвуют не все символы.'],
      use: ['口令控制在 72 字节内，或先做一次 HKDF 压缩再交给 bcrypt。',
            '口令控制在 72 位元組內，或先做一次 HKDF 壓縮再交給 bcrypt。',
            'Keep the password within 72 bytes, or compress it with one HKDF pass before handing it to bcrypt.',
            'パスワードを 72 バイト以内に収めるか、あらかじめ HKDF で圧縮してから bcrypt に渡してください。',
            '비밀번호를 72바이트 이내로 유지하거나 HKDF로 한 번 압축한 뒤 bcrypt에 넘기세요.',
            'Gardez le mot de passe sous 72 octets, ou compressez-le d\'abord avec un passage HKDF avant de le confier à bcrypt.',
            'Halten Sie das Passwort unter 72 Byte oder komprimieren Sie es vorher mit einem HKDF-Durchlauf, bevor es an bcrypt geht.',
            'Держите пароль в пределах 72 байт или предварительно сожмите его одним проходом HKDF перед передачей в bcrypt.']
    },

    'sec.kdf.memhard': {
      title: ['内存硬派生的参数取舍', '記憶體硬派生的參數取捨', 'Memory-hard derivation parameter trade-off', 'メモリハード派生のパラメータのトレードオフ', '메모리 하드 파생의 매개변수 트레이드오프', 'Compromis sur les paramètres de dérivation à mémoire dure', 'Parameterabwägung bei speicherharter Ableitung', 'Компромисс параметров memory-hard деривации'],
      why: ['{kdf} 的抗 ASIC/GPU 能力来自内存占用；参数过低退化为普通慢哈希。',
            '{kdf} 的抗 ASIC/GPU 能力來自記憶體佔用；參數過低退化為普通慢雜湊。',
            '{kdf}\'s resistance to ASIC/GPU comes from its memory usage; if the parameters are too low it degrades into an ordinary slow hash.',
            '{kdf} の ASIC/GPU 耐性はメモリ使用量に由来します。パラメータが低すぎると通常の低速ハッシュに退化します。',
            '{kdf}의 ASIC/GPU 저항은 메모리 사용량에서 비롯됩니다. 매개변수가 너무 낮으면 평범한 느린 해시로 전락합니다.',
            'La résistance de {kdf} aux ASIC/GPU vient de son occupation mémoire ; si les paramètres sont trop bas, il dégénère en un simple hachage lent.',
            'Der ASIC/GPU-Widerstand von {kdf} stammt aus seinem Speicherbedarf; sind die Parameter zu niedrig, entartet es zu einem gewöhnlichen langsamen Hash.',
            'Устойчивость {kdf} к ASIC/GPU обеспечивается объёмом памяти; при слишком низких параметрах он вырождается в обычный медленный хэш.'],
      use: ['在可接受的延迟内尽量调高内存与轮数（本工具为交互流畅做了保守默认）。',
            '在可接受的延遲內盡量調高記憶體與輪數（本工具為互動流暢做了保守預設）。',
            'Raise memory and rounds as high as the acceptable latency allows (this tool ships conservative defaults for interactive smoothness).',
            '許容できる遅延の範囲でメモリとラウンド数をできるだけ高くしてください（本ツールは対話の滑らかさを優先し保守的な初期値にしています）。',
            '허용 가능한 지연 범위에서 메모리와 라운드 수를 가능한 한 높이세요(이 도구는 상호작용의 부드러움을 위해 보수적 기본값을 씁니다).',
            'Augmentez mémoire et nombre de tours autant que la latence acceptable le permet (cet outil adopte des valeurs par défaut prudentes pour la fluidité).',
            'Erhöhen Sie Speicher und Runden so weit, wie es die akzeptable Latenz erlaubt (dieses Werkzeug nutzt konservative Standardwerte für flüssige Bedienung).',
            'Поднимайте объём памяти и число раундов настолько, насколько допускает приемлемая задержка (в этом инструменте по умолчанию стоят консервативные значения ради плавности интерфейса).']
    },

    'sec.nonce.off': {
      title: ['nonce 复用检测已关闭', 'nonce 重複使用偵測已關閉', 'nonce reuse detection is off', 'nonce 再利用検出が無効です', 'nonce 재사용 감지가 꺼져 있음', 'La détection de réutilisation de nonce est désactivée', 'Nonce-Wiederverwendungsprüfung ist aus', 'Проверка повторного использования nonce отключена'],
      why: ['同一密钥 + 同一 nonce 在 CTR 系 AEAD 下会复用密钥流：不仅泄露两段明文的异或，还能反推出认证密钥 H 从而伪造标签。',
            '同一金鑰 + 同一 nonce 在 CTR 系 AEAD 下會複用金鑰流：不僅洩漏兩段明文的互斥或，還能反推出認證金鑰 H 從而偽造標籤。',
            'In CTR-based AEAD, the same key plus the same nonce reuses the keystream: it leaks not only the XOR of two plaintexts, but also lets the attacker recover the authentication subkey H and forge tags.',
            'CTR 系 AEAD で同一鍵と同一 nonce を使うと鍵ストリームが再利用されます。二つの平文の XOR が漏れるだけでなく、認証副鍵 H を逆算でき、タグを偽造できます。',
            'CTR 계열 AEAD에서 같은 키와 같은 nonce를 쓰면 키 스트림이 재사용됩니다. 두 평문의 XOR이 드러날 뿐 아니라 인증 부키 H를 역산해 태그를 위조할 수 있습니다.',
            'Dans un AEAD basé sur CTR, la même clé avec le même nonce réutilise le flux de clé : cela révèle non seulement le XOR de deux textes clairs, mais permet aussi de retrouver la sous-clé d\'authentification H et de forger des tags.',
            'Bei CTR-basiertem AEAD führt derselbe Schlüssel mit demselben Nonce zur Wiederverwendung des Schlüsselstroms: Es leakt nicht nur das XOR zweier Klartexte, sondern erlaubt auch, den Authentifizierungsschlüssel H zu ermitteln und Tags zu fälschen.',
            'В AEAD на основе CTR тот же ключ с тем же nonce повторно использует ключевой поток: раскрывается не только XOR двух открытых текстов, но и появляется возможность восстановить ключ аутентификации H и подделать теги.'],
      use: ['保持「严格」档位，或确保每次加密都更换 nonce。',
            '保持「嚴格」檔位，或確保每次加密都更換 nonce。',
            'Keep the "strict" setting, or make sure the nonce changes on every encryption.',
            '「厳格」設定を維持するか、暗号化のたびに必ず nonce を変更してください。',
            '「엄격」 설정을 유지하거나 암호화할 때마다 nonce가 바뀌도록 하세요.',
            'Conservez le réglage « strict », ou assurez-vous que le nonce change à chaque chiffrement.',
            'Behalten Sie die Einstellung „streng" bei, oder stellen Sie sicher, dass sich der Nonce bei jeder Verschlüsselung ändert.',
            'Сохраняйте «строгий» режим или следите, чтобы nonce менялся при каждом шифровании.']
    },

    'sec.tag.short': {
      title: ['认证标签过短', '認證標籤過短', 'Authentication tag too short', '認証タグが短すぎます', '인증 태그가 너무 짧음', 'Tag d\'authentification trop court', 'Authentifizierungs-Tag zu kurz', 'Слишком короткий тег аутентификации'],
      why: ['当前 {n} 字节：伪造成功率约 2^-{b}，对高价值数据不够。',
            '當前 {n} 位元組：偽造成功率約 2^-{b}，對高價值資料不夠。',
            'Currently {n} bytes: the forgery success rate is about 2^-{b}, which is not enough for high-value data.',
            '現在 {n} バイトです。偽造成功率は約 2^-{b} で、価値の高いデータには不十分です。',
            '현재 {n}바이트로 위조 성공률이 약 2^-{b}이며 고가치 데이터에는 부족합니다.',
            'Actuellement {n} octets : le taux de succès de falsification est d\'environ 2^-{b}, insuffisant pour des données de grande valeur.',
            'Derzeit {n} Byte: Die Fälschungserfolgsrate liegt bei etwa 2^-{b}, für wertvolle Daten zu wenig.',
            'Сейчас {n} байт: вероятность успешной подделки около 2^-{b}, что недостаточно для ценных данных.'],
      use: ['使用 16 字节（128 位）标签；空间极受限时也不建议低于 12 字节。',
            '使用 16 位元組（128 位元）標籤；空間極受限時也不建議低於 12 位元組。',
            'Use a 16-byte (128-bit) tag; even under tight space constraints, do not go below 12 bytes.',
            '16 バイト（128 ビット）のタグを使用してください。容量が極端に限られる場合でも 12 バイト未満にはしないでください。',
            '16바이트(128비트) 태그를 사용하세요. 공간이 극도로 제한된 경우에도 12바이트 미만은 권하지 않습니다.',
            'Utilisez un tag de 16 octets (128 bits) ; même avec des contraintes d\'espace sévères, ne descendez pas sous 12 octets.',
            'Verwenden Sie ein 16-Byte-Tag (128 Bit); selbst bei extremem Platzmangel nicht unter 12 Byte gehen.',
            'Используйте тег длиной 16 байт (128 бит); даже при жёстких ограничениях по размеру не опускайтесь ниже 12 байт.']
    },

    'sec.cont.cryptojs': {
      title: ['CryptoJS 兼容格式用 MD5 派生', 'CryptoJS 相容格式用 MD5 派生', 'CryptoJS-compatible format derives with MD5', 'CryptoJS 互換形式は MD5 で派生します', 'CryptoJS 호환 형식은 MD5로 파생합니다', 'Le format compatible CryptoJS dérive avec MD5', 'CryptoJS-kompatibles Format leitet mit MD5 ab', 'Совместимый с CryptoJS формат использует MD5'],
      why: ['该格式为兼容 CryptoJS 默认的 OpenSSL EVP_BytesToKey(MD5, 1 次迭代)，派生强度很低。',
            '該格式為相容 CryptoJS 預設的 OpenSSL EVP_BytesToKey(MD5, 1 次迭代)，派生強度很低。',
            'This format is compatible with CryptoJS\'s default OpenSSL EVP_BytesToKey(MD5, 1 iteration); its derivation strength is very low.',
            'この形式は CryptoJS 既定の OpenSSL EVP_BytesToKey(MD5, 1 回反復) との互換用であり、派生強度は非常に低いです。',
            '이 형식은 CryptoJS 기본값인 OpenSSL EVP_BytesToKey(MD5, 1회 반복)와 호환되며 파생 강도가 매우 낮습니다.',
            'Ce format est compatible avec EVP_BytesToKey(MD5, 1 itération) d\'OpenSSL, le défaut de CryptoJS ; la force de dérivation est très faible.',
            'Dieses Format ist kompatibel zu CryptoJS\' Standard OpenSSL EVP_BytesToKey(MD5, 1 Iteration); die Ableitungsstärke ist sehr gering.',
            'Этот формат совместим с OpenSSL EVP_BytesToKey(MD5, 1 итерация) — значением по умолчанию в CryptoJS; стойкость деривации очень низкая.'],
      use: ['仅在与旧 CryptoJS 系统互通时使用；新数据用 OpenSSL 容器或直接不选容器。',
            '僅在與舊 CryptoJS 系統互通時使用；新資料用 OpenSSL 容器或直接不選容器。',
            'Use it only to interoperate with legacy CryptoJS systems; for new data use the OpenSSL container or no container at all.',
            '古い CryptoJS システムとの相互運用時のみ使用してください。新しいデータには OpenSSL コンテナを使うか、コンテナを選択しないでください。',
            '구형 CryptoJS 시스템과 상호 운용할 때만 사용하고 새 데이터에는 OpenSSL 컨테이너를 쓰거나 컨테이너를 선택하지 마세요.',
            'Utilisez-le uniquement pour interopérer avec d\'anciens systèmes CryptoJS ; pour de nouvelles données, utilisez le conteneur OpenSSL ou aucun conteneur.',
            'Nur für die Interoperation mit alten CryptoJS-Systemen verwenden; für neue Daten den OpenSSL-Container oder gar keinen Container nutzen.',
            'Используйте только для взаимодействия со старыми системами CryptoJS; для новых данных берите контейнер OpenSSL или не используйте контейнер вовсе.']
    },

    'sec.cont.openssl': {
      title: ['OpenSSL 容器的派生强度', 'OpenSSL 容器的派生強度', 'OpenSSL container derivation strength', 'OpenSSL コンテナの派生強度', 'OpenSSL 컨테이너의 파생 강도', 'Force de dérivation du conteneur OpenSSL', 'Ableitungsstärke des OpenSSL-Containers', 'Стойкость деривации контейнера OpenSSL'],
      why: ['openssl enc 默认用 EVP_BytesToKey(SHA-256, 1 次迭代)，迭代次数只有 1，抗暴力破解远弱于 PBKDF2。',
            'openssl enc 預設用 EVP_BytesToKey(SHA-256, 1 次迭代)，迭代次數只有 1，抗暴力破解遠弱於 PBKDF2。',
            'openssl enc defaults to EVP_BytesToKey(SHA-256, 1 iteration) — only one iteration, so brute-force resistance is far weaker than PBKDF2.',
            'openssl enc は既定で EVP_BytesToKey(SHA-256, 1 回反復) を使います。反復は 1 回だけで、総当たり耐性は PBKDF2 よりはるかに弱いです。',
            'openssl enc는 기본적으로 EVP_BytesToKey(SHA-256, 1회 반복)를 씁니다. 반복이 1회뿐이라 무차별 대입 저항이 PBKDF2보다 훨씬 약합니다.',
            'openssl enc utilise par défaut EVP_BytesToKey(SHA-256, 1 itération) — une seule itération, donc une résistance à la force brute bien moindre que PBKDF2.',
            'openssl enc nutzt standardmäßig EVP_BytesToKey(SHA-256, 1 Iteration) — nur eine Iteration, damit deutlich schwächer gegen Brute Force als PBKDF2.',
            'openssl enc по умолчанию использует EVP_BytesToKey(SHA-256, 1 итерация) — всего одна итерация, поэтому стойкость к перебору значительно слабее, чем у PBKDF2.'],
      use: ['仅在与 openssl 命令行互通时使用。', '僅在與 openssl 命令列互通時使用。', 'Use it only to interoperate with the openssl command line.', 'openssl コマンドラインとの相互運用時のみ使用してください。', 'openssl 명령줄과 상호 운용할 때만 사용하세요.', 'Utilisez-le uniquement pour interopérer avec la ligne de commande openssl.', 'Nur für die Interoperation mit der openssl-Kommandozeile verwenden.', 'Используйте только для взаимодействия с командной строкой openssl.']
    },

    'sec.fmt.pem': {
      title: ['PEM 风格只是外观', 'PEM 風格只是外觀', 'PEM style is only cosmetic', 'PEM 形式は見た目だけです', 'PEM 스타일은 겉모습일 뿐', 'Le style PEM n\'est qu\'apparence', 'PEM-Stil ist nur Optik', 'Стиль PEM — только оформление'],
      why: ['这个输出只是把字节按 PEM 的折行与头尾标记排版，并不含算法标识、参数或校验，不能当真正的 PEM 证书/密钥使用。',
            '這個輸出只是把位元組按 PEM 的折行與頭尾標記排版，並不含演算法標識、參數或校驗，不能當真正的 PEM 憑證/金鑰使用。',
            'This output merely lays out the bytes with PEM-style line folding and header/footer markers. It contains no algorithm identifier, parameters, or checksum, so it cannot be used as a real PEM certificate or key.',
            'この出力は PEM 風の折り返しとヘッダ・フッタを付けて並べているだけです。アルゴリズム識別子、パラメータ、検査値を含まないため、真正な PEM 証明書や鍵としては使えません。',
            '이 출력은 PEM 방식의 줄바꿈과 머리/꼬리 표시로 바이트를 배치한 것뿐입니다. 알고리즘 식별자, 매개변수, 검사값이 없어 진짜 PEM 인증서나 키로 쓸 수 없습니다.',
            'Cette sortie ne fait que disposer les octets avec les retours à la ligne et les marqueurs de début/fin du style PEM. Elle ne contient aucun identifiant d\'algorithme, paramètre ou contrôle : elle ne peut pas servir de certificat ou de clé PEM réelle.',
            'Diese Ausgabe ordnet die Bytes lediglich mit PEM-artigem Zeilenumbruch und Kopf-/Fußmarken an. Sie enthält keine Algorithmuskennung, keine Parameter und keine Prüfsumme und kann daher nicht als echtes PEM-Zertifikat bzw. echter PEM-Schlüssel verwendet werden.',
            'Этот вывод лишь раскладывает байты с PEM-подобными переносами и маркерами начала/конца. В нём нет идентификатора алгоритма, параметров или контрольной суммы, поэтому его нельзя использовать как настоящий сертификат или ключ PEM.'],
      use: ['需要标准密钥文件请用「密钥导出」功能生成的 PEM。',
            '需要標準金鑰檔案請用「金鑰匯出」功能產生的 PEM。',
            'If you need a standard key file, use the PEM produced by the "export key" function.',
            '標準的な鍵ファイルが必要な場合は、「鍵エクスポート」機能が生成する PEM を使用してください。',
            '표준 키 파일이 필요하면 「키 내보내기」 기능이 만든 PEM을 사용하세요.',
            'Si vous avez besoin d\'un fichier de clé standard, utilisez le PEM produit par la fonction « exporter la clé ».',
            'Wenn Sie eine Standard-Schlüsseldatei brauchen, verwenden Sie das PEM aus der Funktion „Schlüssel exportieren".',
            'Если нужен стандартный файл ключа, используйте PEM, созданный функцией «экспорт ключа».']
    },
    /* 【第 155 批】Argon2 三种变体此前共用 sec.kdf.memhard，选 id / i / D 出来的
     * 文案一字不差。三者取舍不同（RFC 9106 §4），拆成三条独立提示。
     * 占位符规则不变：本表内无需占位符，调用方传的 {kdf} 由 _secT 忽略即可。 */
    'sec.kdf.argon2id': {
      title: ['Argon2id 的参数取舍', 'Argon2id 的參數取捨', 'Argon2id parameter trade-off', 'Argon2id のパラメータのトレードオフ', 'Argon2id 매개변수 트레이드오프', 'Compromis sur les paramètres d\'Argon2id', 'Parameterabwägung bei Argon2id', 'Компромисс параметров Argon2id'],
      why: ['Argon2id 是混合模式（RFC 9106 首选）：前一半内存访问与口令无关、后一半相关，兼顾抗侧信道与抗 GPU/ASIC。它的抗攻击能力来自内存占用，参数过低会退化成普通慢哈希。',
            'Argon2id 是混合模式（RFC 9106 首選）：前一半記憶體存取與口令無關、後一半相關，兼顧抗側通道與抗 GPU/ASIC。它的抗攻擊能力來自記憶體佔用，參數過低會退化成普通慢雜湊。',
            'Argon2id is a hybrid mode (the first choice in RFC 9106): the first half of its memory access is password-independent and the second half password-dependent, balancing side-channel resistance with resistance to GPU/ASIC attacks. Its strength comes from memory usage; if the parameters are too low it degrades into an ordinary slow hash.',
            'Argon2id はハイブリッドモードです（RFC 9106 の第一選択）。メモリアクセスの前半はパスワードに依存せず、後半は依存する方式で、サイドチャネル耐性と GPU/ASIC 耐性を両立させます。強さはメモリ使用量に由来するため、パラメータが低すぎると通常の低速ハッシュに退化します。',
            'Argon2id는 하이브리드 모드입니다(RFC 9106의 첫 번째 권장). 메모리 접근의 전반부는 비밀번호와 무관하고 후반부는 비밀번호에 의존하는 방식이어서, 사이드채널 저항과 GPU/ASIC 저항을 함께 제공합니다. 강도는 메모리 사용량에서 나오므로 매개변수가 너무 낮으면 일반적인 느린 해시로 퇴화합니다.',
            'Argon2id est un mode hybride (premier choix de la RFC 9106) : la première moitié de ses accès mémoire est indépendante du mot de passe et la seconde en dépend, conciliant la résistance aux canaux auxiliaires et la résistance aux GPU/ASIC. Sa robustesse vient de l\'occupation mémoire ; si les paramètres sont trop bas, il dégénère en un simple hachage lent.',
            'Argon2id ist ein Hybridmodus (erste Wahl laut RFC 9106): Die erste Hälfte seiner Speicherzugriffe ist passwortunabhängig, die zweite passwortabhängig — ein Ausgleich zwischen Seitenkanal- und GPU/ASIC-Resistenz. Seine Stärke kommt aus dem Speicherbedarf; bei zu niedrigen Parametern verkommt es zu einem gewöhnlichen langsamen Hash.',
            'Argon2id — гибридный режим (первый выбор в RFC 9106): первая половина обращений к памяти не зависит от пароля, вторая зависит, что сочетает стойкость к побочным каналам и к атакам на GPU/ASIC. Его стойкость обеспечивается объёмом памяти; при слишком низких параметрах он вырождается в обычный медленный хеш.'],
      use: ['在可接受的延迟内尽量调高内存与轮数；口令哈希场景下优先用 argon2id，不要用 argon2i。',
            '在可接受的延遲內盡量調高記憶體與輪數；口令雜湊場景下優先用 argon2id，不要用 argon2i。',
            'Raise memory and rounds as high as the acceptable latency allows; for password hashing prefer argon2id over argon2i.',
            '許容できる遅延の範囲でメモリとラウンド数をできるだけ高くしてください。パスワードハッシュでは argon2i ではなく argon2id を優先してください。',
            '허용 가능한 지연 범위에서 메모리와 라운드 수를 가능한 한 높이세요. 비밀번호 해시에서는 argon2i가 아니라 argon2id를 우선 사용하세요.',
            'Augmentez la mémoire et les itérations autant que la latence acceptable le permet ; pour le hachage de mots de passe, préférez argon2id à argon2i.',
            'Erhöhen Sie Speicher und Runden so weit, wie die akzeptable Latenz es erlaubt; bevorzugen Sie beim Passwort-Hashing argon2id statt argon2i.',
            'Поднимайте память и число проходов настолько, насколько позволяет допустимая задержка; для хеширования паролей предпочитайте argon2id, а не argon2i.']
    },
    'sec.kdf.argon2i': {
      title: ['Argon2i 不是口令派生的首选', 'Argon2i 不是口令派生的首選', 'Argon2i is not the first choice for password derivation', 'Argon2i はパスワード派生の第一選択ではありません', 'Argon2i는 비밀번호 파생의 첫 번째 선택이 아닙니다', 'Argon2i n\'est pas le premier choix pour la dérivation de mot de passe', 'Argon2i ist nicht die erste Wahl für die Passwortableitung', 'Argon2i — не лучший выбор для выработки ключа из пароля'],
      why: ['Argon2i 全程数据无关访问，抗侧信道能力最强，但在同等内存与轮数下对 GPU/ASIC 的抵抗弱于 Argon2id —— 攻击者可换来更低的攻击成本。RFC 9106 明确推荐口令哈希用 argon2id。',
            'Argon2i 全程資料無關存取，抗側通道能力最強，但在同等記憶體與輪數下對 GPU/ASIC 的抵抗弱於 Argon2id —— 攻擊者可換來更低的攻擊成本。RFC 9106 明確推薦口令雜湊用 argon2id。',
            'Argon2i uses fully data-independent memory access, giving the strongest side-channel resistance, but at equal memory and rounds it is weaker than Argon2id against GPU/ASIC attacks — the attacker gets a lower attack cost. RFC 9106 explicitly recommends argon2id for password hashing.',
            'Argon2i は全体がデータ非依存のメモリアクセス方式で、サイドチャネル耐性は最も高くなります。ただし同じメモリ量とラウンド数では GPU/ASIC 攻撃への耐性が Argon2id より弱く、攻撃者のコストが下がります。RFC 9106 はパスワードハッシュに argon2id を明示的に推奨しています。',
            'Argon2i는 전체가 데이터 비의존적인 메모리 접근 방식이어서 사이드채널 저항이 가장 높습니다. 다만 같은 메모리와 라운드 수에서는 GPU/ASIC 공격에 대한 저항이 Argon2id보다 약해 공격자의 비용이 낮아집니다. RFC 9106은 비밀번호 해시에 argon2id를 명시적으로 권장합니다.',
            'Argon2i utilise des accès mémoire entièrement indépendants des données, offrant la meilleure résistance aux canaux auxiliaires, mais à mémoire et itérations égales il est plus faible qu\'Argon2id face aux attaques GPU/ASIC — l\'attaquant bénéficie d\'un coût moindre. La RFC 9106 recommande explicitement argon2id pour le hachage de mots de passe.',
            'Argon2i nutzt vollständig datenunabhängige Speicherzugriffe und bietet damit die beste Seitenkanalresistenz, ist aber bei gleichem Speicher und gleichen Runden schwächer als Argon2id gegen GPU/ASIC-Angriffe — der Angreifer erhält geringere Kosten. RFC 9106 empfiehlt für Passwort-Hashing ausdrücklich argon2id.',
            'Argon2i использует полностью независимый от данных доступ к памяти, обеспечивая максимальную стойкость к побочным каналам, но при равных памяти и проходах он слабее Argon2id против атак на GPU/ASIC — затраты атакующего снижаются. В RFC 9106 для хеширования паролей явно рекомендуется argon2id.'],
      use: ['改用 Argon2id；只有在确有侧信道顾虑、且愿意加大参数补偿时才保留 argon2i。',
            '改用 Argon2id；只有在確有側通道顧慮、且願意加大參數補償時才保留 argon2i。',
            'Switch to Argon2id; keep argon2i only if you have real side-channel concerns and are willing to raise the parameters to compensate.',
            'Argon2id に変更してください。実際にサイドチャネルの懸念があり、パラメータを増やして補う用意がある場合にのみ argon2i を残してください。',
            'Argon2id로 바꾸세요. 실제로 사이드채널 우려가 있고 매개변수를 높여 보완할 의사가 있는 경우에만 argon2i를 남기세요.',
            'Passez à Argon2id ; ne conservez argon2i que si vous avez de réelles préoccupations de canal auxiliaire et acceptez d\'augmenter les paramètres en compensation.',
            'Wechseln Sie zu Argon2id; behalten Sie argon2i nur, wenn Sie tatsächliche Seitenkanal-Bedenken haben und die Parameter zum Ausgleich erhöhen wollen.',
            'Перейдите на Argon2id; оставляйте argon2i только при реальных опасениях по побочным каналам и готовности поднять параметры для компенсации.']
    },
    'sec.kdf.argon2d': {
      title: ['Argon2d 存在侧信道风险', 'Argon2d 存在側通道風險', 'Argon2d has side-channel risk', 'Argon2d にはサイドチャネルのリスクがあります', 'Argon2d에는 사이드채널 위험이 있습니다', 'Argon2d présente un risque de canal auxiliaire', 'Argon2d birgt ein Seitenkanal-Risiko', 'У Argon2d есть риск побочных каналов'],
      why: ['Argon2d 全程数据相关访问：内存访问模式依赖口令内容，抗 GPU/ASIC 最强，但会把口令信息泄漏到时序与缓存访问模式上。在不可信环境、多租户主机或浏览器里，这可能被同机攻击者利用。',
            'Argon2d 全程資料相關存取：記憶體存取模式依賴口令內容，抗 GPU/ASIC 最強，但會把口令資訊洩漏到時序與快取存取模式上。在不可信環境、多租戶主機或瀏覽器裡，這可能被同機攻擊者利用。',
            'Argon2d uses fully data-dependent access: the memory access pattern depends on the password contents. It gives the strongest GPU/ASIC resistance but leaks password information through timing and cache access patterns. On untrusted hosts, multi-tenant machines or in a browser, a co-located attacker may exploit this.',
            'Argon2d は全体がデータ依存のアクセス方式です。メモリアクセスのパターンがパスワードの内容に依存するため GPU/ASIC 耐性は最も高くなりますが、タイミングやキャッシュのアクセスパターンを通じてパスワード情報が漏れます。信頼できないホスト、マルチテナント環境、ブラウザ上では同一マシンの攻撃者に利用されるおそれがあります。',
            'Argon2d는 전체가 데이터 의존적인 접근 방식입니다. 메모리 접근 패턴이 비밀번호 내용에 의존하므로 GPU/ASIC 저항은 가장 높지만, 타이밍과 캐시 접근 패턴을 통해 비밀번호 정보가 새어 나갑니다. 신뢰할 수 없는 호스트, 멀티테넌트 환경, 브라우저에서는 동일 시스템의 공격자에게 악용될 수 있습니다.',
            'Argon2d utilise des accès entièrement dépendants des données : le motif d\'accès mémoire dépend du contenu du mot de passe. Il offre la meilleure résistance aux GPU/ASIC mais fuit des informations sur le mot de passe via la temporisation et les motifs d\'accès au cache. Sur un hôte non fiable, une machine multi-locataire ou dans un navigateur, un attaquant co-localisé peut en profiter.',
            'Argon2d nutzt vollständig datenabhängige Zugriffe: Das Speicherzugriffsmuster hängt vom Passwortinhalt ab. Es bietet die stärkste GPU/ASIC-Resistenz, verrät aber Passwortinformationen über Timing und Cache-Zugriffsmuster. Auf nicht vertrauenswürdigen Hosts, Mehrmandanten-Rechnern oder im Browser kann ein Angreifer auf derselben Maschine das ausnutzen.',
            'Argon2d использует полностью зависимый от данных доступ: шаблон обращений к памяти зависит от содержимого пароля. Он даёт максимальную стойкость к GPU/ASIC, но утечка информации о пароле происходит через временные характеристики и шаблоны обращений к кэшу. На ненадёжных хостах, многопользовательских машинах или в браузере это может использовать атакующий на той же системе.'],
      use: ['口令派生改用 Argon2id；仅在完全可信、无共同租户的环境（如自有后端做口令哈希）才考虑 argon2d。',
            '口令派生改用 Argon2id；僅在完全可信、無共同租戶的環境（如自有後端做口令雜湊）才考慮 argon2d。',
            'Use Argon2id for password derivation; consider argon2d only in a fully trusted, single-tenant environment (for example your own backend doing password hashing).',
            'パスワード派生には Argon2id を使用してください。argon2d は完全に信頼できるシングルテナント環境（自社バックエンドでのパスワードハッシュなど）でのみ検討してください。',
            '비밀번호 파생에는 Argon2id를 사용하세요. argon2d는 완전히 신뢰할 수 있는 단일 테넌트 환경(예: 자체 백엔드에서의 비밀번호 해시)에서만 고려하세요.',
            'Utilisez Argon2id pour la dérivation de mot de passe ; n\'envisagez argon2d que dans un environnement entièrement fiable et mono-locataire (par exemple votre propre backend qui hache les mots de passe).',
            'Verwenden Sie für die Passwortableitung Argon2id; ziehen Sie argon2d nur in einer vollständig vertrauenswürdigen Single-Tenant-Umgebung in Betracht (z. B. Ihr eigenes Backend beim Passwort-Hashing).',
            'Для выработки ключа из пароля используйте Argon2id; рассматривайте argon2d только в полностью доверенной однопользовательской среде (например собственный бэкенд, хеширующий пароли).']
    }
  };

  if (typeof window !== 'undefined') {
    window.__I18N_SEC = SEC;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = SEC; }
})();
