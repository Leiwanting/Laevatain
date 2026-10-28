/* i18n.js —— 界面多语言（八国语言）
 *
 * 设计原则（改动前请先读）：
 * 1. 只翻译「界面外壳」——标签、按钮、提示、侧边栏。
 *    算法名、模式缩写（GCM/CBC/PKCS7…）、版本号一律不翻译：它们是专有名词，
 *    翻译会让用户无法与官方文档和别的工具对上号。
 * 2. 未收录的键一律回退 zh-CN，绝不渲染成 undefined 或空串。
 * 3. 语言选择存 localStorage（键名 CRYPTO_TOOLBOX_LANG）；读取失败时按 zh-CN 处理。
 *    只存语言代码，不存任何密钥、明文或运算结果。
 * 4. 长篇说明（<details> 里的算法用法、免责声明）有意保持中文原文，不做机翻——
 *    半通不通的翻译比不翻译更误导人。侧边栏里已明示这一点。
 *
 * 用法：I18N.t('btn.enc') / I18N.set('en') / I18N.apply()
 */
(function () {
  'use strict';

  var LANGS = [
    { code: 'zh-CN', native: '简体中文',    short: '中' },
    { code: 'zh-TW', native: '繁體中文',    short: '繁' },
    { code: 'en',    native: 'English',     short: 'EN' },
    { code: 'ja',    native: '日本語',      short: '日' },
    { code: 'ko',    native: '한국어',      short: '한' },
    { code: 'fr',    native: 'Français',    short: 'FR' },
    { code: 'de',    native: 'Deutsch',     short: 'DE' },
    { code: 'ru',    native: 'Русский',     short: 'RU' }
  ];

  /* 每个键 8 种语言，顺序与 LANGS 一致。缺语言就补在这里，别在别处打补丁。 */
  var T = {
    'app.name':        ['加密工具箱', '加密工具箱', 'Crypto Toolbox', '暗号ツールボックス', '암호 도구상자', 'Boîte à outils crypto', 'Krypto-Werkzeugkasten', 'Крипто-инструменты'],
    'app.title':       ['加密 / 解密工具', '加密 / 解密工具', 'Encrypt / Decrypt', '暗号化 / 復号ツール', '암호화 / 복호화', 'Chiffrer / Déchiffrer', 'Ver-/Entschlüsseln', 'Шифрование / Дешифрование'],
    /* 产品全称是专有名词：八种语言同一串，不翻译（翻译了就与官方署名对不上） */
    'app.full':        ["Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox", "Laevatain_sky's Cryptography Toolbox"],

    /* 开屏动画文案 */
    'splash.init':     ['正在初始化算法表…', '正在初始化演算法表…', 'Initializing algorithms…', 'アルゴリズム表を初期化中…', '알고리즘 표 초기화 중…', 'Initialisation des algorithmes…', 'Algorithmen werden initialisiert…', 'Инициализация алгоритмов…'],
    'splash.ready':    ['就绪', '就緒', 'Ready', '準備完了', '준비 완료', 'Prêt', 'Bereit', 'Готово'],
    'splash.skip':     ['点击跳过', '點擊跳過', 'Tap to skip', 'タップでスキップ', '탭하여 건너뛰기', 'Appuyez pour passer', 'Tippen zum Überspringen', 'Нажмите, чтобы пропустить'],

    'label.algo':      ['算法', '演算法', 'Algorithm', 'アルゴリズム', '알고리즘', 'Algorithme', 'Algorithmus', 'Алгоритм'],
    'label.key':       ['密钥', '金鑰', 'Key', '鍵', '키', 'Clé', 'Schlüssel', 'Ключ'],
    'label.key2':      ['第二密钥', '第二金鑰', 'Second key', '第二鍵', '두 번째 키', 'Seconde clé', 'Zweiter Schlüssel', 'Второй ключ'],
    'label.param':     ['参数', '參數', 'Parameters', 'パラメータ', '매개변수', 'Paramètres', 'Parameter', 'Параметры'],
    'label.mode':      ['加密模式', '加密模式', 'Cipher mode', '暗号モード', '암호 모드', 'Mode de chiffrement', 'Verschlüsselungsmodus', 'Режим шифрования'],
    'label.padding':   ['填充模式', '填充模式', 'Padding', 'パディング', '패딩', 'Rembourrage', 'Padding', 'Дополнение'],
    'label.etm':       ['附加认证（EtM）', '附加認證（EtM）', 'Extra auth (EtM)', '追加認証（EtM）', '추가 인증(EtM)', 'Auth. suppl. (EtM)', 'Zusatz-Auth. (EtM)', 'Доп. аутентификация (EtM)'],
    'label.aad':       ['AAD 附加认证数据（可选）', 'AAD 附加認證資料（選填）', 'AAD (optional)', 'AAD 追加認証データ（任意）', 'AAD 추가 인증 데이터(선택)', 'AAD (optionnel)', 'AAD (optional)', 'AAD (необязательно)'],
    'label.container': ['封装格式', '封裝格式', 'Container format', 'コンテナ形式', '컨테이너 형식', 'Format conteneur', 'Container-Format', 'Формат контейнера'],
    'label.salt':      ['Salt 盐值（留空自动生成）', 'Salt 鹽值（留空自動產生）', 'Salt (auto if empty)', 'ソルト（空なら自動生成）', '솔트(비우면 자동 생성)', 'Sel (auto si vide)', 'Salt (auto wenn leer)', 'Соль (авто если пусто)'],
    'label.taglen':    ['AEAD 标签长度', 'AEAD 標籤長度', 'AEAD tag length', 'AEAD タグ長', 'AEAD 태그 길이', 'Longueur du tag AEAD', 'AEAD-Tag-Länge', 'Длина тега AEAD'],
    'label.kdf':       ['口令派生（KDF）', '口令派生（KDF）', 'Password KDF', 'パスワード派生（KDF）', '비밀번호 파생(KDF)', 'Dérivation (KDF)', 'Passwort-KDF', 'KDF для пароля'],
    'label.kdfhash':   ['PBKDF2 摘要算法', 'PBKDF2 摘要演算法', 'PBKDF2 digest', 'PBKDF2 ダイジェスト', 'PBKDF2 다이제스트', 'Digest PBKDF2', 'PBKDF2-Digest', 'Хэш PBKDF2'],
    'label.iter':      ['迭代次数', '迭代次數', 'Iterations', '反復回数', '반복 횟수', 'Itérations', 'Iterationen', 'Итерации'],
    'label.nonce':     ['nonce 复用检测', 'nonce 重複使用偵測', 'nonce reuse guard', 'nonce 再利用検出', 'nonce 재사용 감지', 'Garde nonce', 'Nonce-Schutz', 'Контроль nonce'],
    'label.padstrict': ['填充校验', '填充驗證', 'Padding check', 'パディング検証', '패딩 검증', 'Vérif. remplissage', 'Padding-Prüfung', 'Проверка дополнения'],
    'label.iv':        ['IV（留空自动生成）', 'IV（留空自動產生）', 'IV (auto if empty)', 'IV（空なら自動生成）', 'IV(비우면 자동 생성)', 'IV (auto si vide)', 'IV (auto wenn leer)', 'IV (авто если пусто)'],
    'label.input':     ['输入内容', '輸入內容', 'Input', '入力', '입력', 'Entrée', 'Eingabe', 'Ввод'],
    'label.fmt':       ['密文格式', '密文格式', 'Output format', '暗号文形式', '암호문 형식', 'Format du chiffré', 'Ausgabeformat', 'Формат шифртекста'],
    'label.output':    ['输出结果', '輸出結果', 'Output', '出力', '출력', 'Sortie', 'Ausgabe', 'Вывод'],

    /* 安全提示框的框架文案（第 154 批）：分级标签与标题 */
    'sec.head':        ['安全提示（{n}）', '安全提示（{n}）', 'Security notes ({n})', 'セキュリティ上の注意（{n}）', '보안 알림({n})', 'Notes de sécurité ({n})', 'Sicherheitshinweise ({n})', 'Замечания по безопасности ({n})'],
    'sec.lv.danger':   ['严重', '嚴重', 'Critical', '重大', '심각', 'Critique', 'Kritisch', 'Критично'],
    'sec.lv.warn':     ['警告', '警告', 'Warning', '警告', '경고', 'Avertissement', 'Warnung', 'Предупреждение'],
    'sec.lv.info':     ['说明', '說明', 'Note', '説明', '안내', 'Note', 'Hinweis', 'Примечание'],
    'sec.advice':      ['建议', '建議', 'Advice', '対処', '권장', 'Conseil', 'Empfehlung', 'Рекомендация'],

    /* 【第 154 批】运行期动态改写、通用 apply() 覆盖不到的界面文案。
       这些由 JS 直接写 textContent，没有 data-i18n 标记，所以必须显式走 _t()，
       并在 onChange 里重新触发渲染（见 _rerenderDynamicI18n）。 */
    'label.iv.tweak':  ['Tweak（留空则自动生成并回写）', 'Tweak（留空則自動產生並回寫）', 'Tweak (auto-generated if empty)', 'Tweak（空なら自動生成して書き戻します）', 'Tweak(비우면 자동 생성되어 되돌려 기록)', 'Tweak (auto si vide)', 'Tweak (auto wenn leer)', 'Tweak (авто если пусто)'],
    'label.iv.nonce':  ['Nonce（留空则自动生成并回写）', 'Nonce（留空則自動產生並回寫）', 'Nonce (auto-generated if empty)', 'Nonce（空なら自動生成して書き戻します）', 'Nonce(비우면 자동 생성되어 되돌려 기록)', 'Nonce (auto si vide)', 'Nonce (auto wenn leer)', 'Nonce (авто если пусто)'],
    'label.iv.iv':     ['IV（留空则自动生成并回写）', 'IV（留空則自動產生並回寫）', 'IV (auto-generated if empty)', 'IV（空なら自動生成して書き戻します）', 'IV(비우면 자동 생성되어 되돌려 기록)', 'IV (auto si vide)', 'IV (auto wenn leer)', 'IV (авто если пусто)'],
    'label.iv.dflt':   ['IV / Nonce（Hex，留空则自动生成）', 'IV / Nonce（Hex，留空則自動產生）', 'IV / Nonce (hex, auto if empty)', 'IV / Nonce（Hex、空なら自動生成）', 'IV / Nonce(Hex, 비우면 자동 생성)', 'IV / Nonce (hex, auto si vide)', 'IV / Nonce (Hex, auto wenn leer)', 'IV / Nonce (hex, авто если пусто)'],
    'file.drop':       ['拖拽文件到此处，或点击选择文件', '拖拽檔案到此處，或點擊選擇檔案', 'Drop a file here, or tap to choose', 'ファイルをここにドロップ、またはタップして選択', '파일을 여기에 끌어다 놓거나 탭하여 선택', 'Déposez un fichier ici, ou touchez pour choisir', 'Datei hierher ziehen oder tippen zum Auswählen', 'Перетащите файл сюда или нажмите для выбора'],
    'file.loaded':     ['已加载：{n}（{b} 字节）', '已載入：{n}（{b} 位元組）', 'Loaded: {n} ({b} bytes)', '読み込み済み：{n}（{b} バイト）', '불러옴: {n}({b}바이트)', 'Chargé : {n} ({b} octets)', 'Geladen: {n} ({b} Bytes)', 'Загружено: {n} ({b} байт)'],
    'file.picked':     ['已选择：{n}（点击可重新选择）', '已選擇：{n}（點擊可重新選擇）', 'Selected: {n} (tap to choose again)', '選択済み：{n}（タップで再選択）', '선택됨: {n}(다시 탭하여 선택)', 'Sélectionné : {n} (touchez pour rechoisir)', 'Ausgewählt: {n} (tippen zum erneuten Wählen)', 'Выбрано: {n} (нажмите для повторного выбора)'],
    'iv.info.auto':    ['IV（Hex，已自动填入上方 IV 框）：', 'IV（Hex，已自動填入上方 IV 框）：', 'IV (hex, auto-filled above):', 'IV（Hex、上の IV 欄に自動入力済み）：', 'IV(Hex, 위 IV 칸에 자동 입력됨):', 'IV (hex, rempli auto ci-dessus) :', 'IV (Hex, oben automatisch eingetragen):', 'IV (hex, автозаполнено выше):'],
    'iv.info.json':    ['IV（Hex，已写入 JSON 并回填输入框）：', 'IV（Hex，已寫入 JSON 並回填輸入框）：', 'IV (hex, written to JSON and filled in):', 'IV（Hex、JSON に書き込み入力欄へ反映済み）：', 'IV(Hex, JSON에 기록되고 입력칸에 반영됨):', 'IV (hex, écrit dans le JSON et réinjecté) :', 'IV (Hex, ins JSON geschrieben und eingetragen):', 'IV (hex, записан в JSON и подставлен):'],
    'iv.info.save':    ['IV（Hex，已自动填入上方 IV 框，供保存；再次加密会自动换新的）：', 'IV（Hex，已自動填入上方 IV 框，供保存；再次加密會自動換新的）：', 'IV (hex, auto-filled above for saving; a new one is generated on each encryption):', 'IV（Hex、保存用に上の IV 欄へ自動入力。再度暗号化すると新しくなります）：', 'IV(Hex, 저장을 위해 위 IV 칸에 자동 입력됨. 다시 암호화하면 새로 생성됩니다):', 'IV (hex, rempli auto ci-dessus pour sauvegarde ; un nouveau sera généré à chaque chiffrement) :', 'IV (Hex, oben zum Speichern automatisch eingetragen; bei jeder Verschlüsselung neu):', 'IV (hex, автозаполнено выше для сохранения; при повторном шифровании будет новым):'],
    'iv.info.mine':    ['IV（Hex，使用你填写的值）：', 'IV（Hex，使用你填寫的值）：', 'IV (hex, using the value you entered):', 'IV（Hex、あなたが入力した値を使用）：', 'IV(Hex, 입력한 값 사용):', 'IV (hex, utilisant la valeur saisie) :', 'IV (Hex, mit deinem eingegebenen Wert):', 'IV (hex, используется введённое вами значение):'],

    'btn.enc':         ['加密', '加密', 'Encrypt', '暗号化', '암호화', 'Chiffrer', 'Verschlüsseln', 'Шифровать'],
    'btn.dec':         ['解密', '解密', 'Decrypt', '復号', '복호화', 'Déchiffrer', 'Entschlüsseln', 'Дешифровать'],
    'btn.clear':       ['清空', '清空', 'Clear', 'クリア', '지우기', 'Effacer', 'Leeren', 'Очистить'],
    'btn.clearnonce':  ['清空 nonce 记录', '清空 nonce 記錄', 'Clear nonce log', 'nonce 記録を消去', 'nonce 기록 삭제', 'Effacer nonce', 'Nonce-Log leeren', 'Очистить журнал nonce'],
    'btn.selftest':    ['内置自检', '內建自檢', 'Self-test', '自己診断', '자체 점검', 'Auto-test', 'Selbsttest', 'Самопроверка'],
    'btn.cancel':      ['取消', '取消', 'Cancel', 'キャンセル', '취소', 'Annuler', 'Abbrechen', 'Отмена'],
    'btn.copy':        ['复制结果', '複製結果', 'Copy result', '結果をコピー', '결과 복사', 'Copier', 'Ergebnis kopieren', 'Копировать'],
    'btn.download':    ['下载结果', '下載結果', 'Download', 'ダウンロード', '다운로드', 'Télécharger', 'Herunterladen', 'Скачать'],
    'btn.loadfile':    ['载入文件', '載入檔案', 'Load file', 'ファイル読込', '파일 불러오기', 'Charger fichier', 'Datei laden', 'Загрузить файл'],
    'btn.importkey':   ['导入密钥(PEM)', '匯入金鑰(PEM)', 'Import key (PEM)', '鍵を読込(PEM)', '키 가져오기(PEM)', 'Importer clé (PEM)', 'Schlüssel importieren', 'Импорт ключа (PEM)'],
    'btn.copyiv':      ['复制 IV', '複製 IV', 'Copy IV', 'IV をコピー', 'IV 복사', 'Copier IV', 'IV kopieren', 'Копировать IV'],

    'side.open':       ['菜单', '選單', 'Menu', 'メニュー', '메뉴', 'Menu', 'Menü', 'Меню'],
    'side.close':      ['收起', '收起', 'Close', '閉じる', '닫기', 'Fermer', 'Schließen', 'Закрыть'],
    'side.language':   ['语言', '語言', 'Language', '言語', '언어', 'Langue', 'Sprache', 'Язык'],
    'side.nav':        ['导航', '導航', 'Navigate', 'ナビゲーション', '탐색', 'Navigation', 'Navigation', 'Навигация'],
    'side.goTool':     ['加密 / 解密', '加密 / 解密', 'Encrypt / Decrypt', '暗号化 / 復号', '암호화 / 복호화', 'Chiffrer / Déchiffrer', 'Ver-/Entschlüsseln', 'Шифрование'],
    'side.goVersion':  ['版本信息', '版本資訊', 'Version info', 'バージョン情報', '버전 정보', 'Version', 'Version', 'Версия'],
    'side.goFormat':   ['输出格式说明', '輸出格式說明', 'Output formats', '出力形式の説明', '출력 형식 설명', 'Formats de sortie', 'Ausgabeformate', 'Форматы вывода'],
    'side.goUsage':    ['填充 / 模式 / 容器', '填充 / 模式 / 容器', 'Padding / mode / container', 'パディング・モード・コンテナ', '패딩/모드/컨테이너', 'Rembourrage / mode', 'Padding / Modus', 'Дополнение / режим'],
    'side.goDisclaimer':['免责声明', '免責聲明', 'Disclaimer', '免責事項', '면책 조항', 'Avertissement', 'Haftungsausschluss', 'Отказ от ответственности'],
    'side.playSplash': ['播放开屏动画', '播放開屏動畫', 'Play splash animation', 'スプラッシュ画面を再生', '스플래시 애니메이션 재생', "Lancer l'animation de démarrage", 'Startanimation abspielen', 'Показать заставку'],
    'side.note':       ['算法名与长篇说明保持原文，不做翻译——避免与官方文档对不上。',
                        '演算法名稱與長篇說明維持原文，不做翻譯——避免與官方文件對不上。',
                        'Algorithm names and long-form docs stay untranslated, so they still match the official specs.',
                        'アルゴリズム名と長文の説明は原文のまま（公式文書との照合のため）。',
                        '알고리즘 이름과 긴 설명은 원문 유지(공식 문서 대조용).',
                        'Les noms d\'algorithmes et les textes longs ne sont pas traduits, pour rester conformes aux specs.',
                        'Algorithmennamen und Langtexte bleiben unübersetzt, damit sie zu den Specs passen.',
                        'Имена алгоритмов и длинные описания не переводятся, чтобы совпадать со спецификациями.'],

    'toast.copied':    ['已复制到剪贴板', '已複製到剪貼簿', 'Copied to clipboard', 'クリップボードにコピーしました', '클립보드에 복사됨', 'Copié', 'Kopiert', 'Скопировано'],
    'toast.copyfail':  ['复制失败，请手动选中复制', '複製失敗，請手動選取複製', 'Copy failed — select manually', 'コピー失敗。手動で選択してください', '복사 실패, 직접 선택하세요', 'Échec de la copie', 'Kopieren fehlgeschlagen', 'Ошибка копирования'],
    'toast.cleared':   ['已清空', '已清空', 'Cleared', 'クリアしました', '지웠습니다', 'Effacé', 'Geleert', 'Очищено'],
    'toast.noncecleared':['nonce 记录已清空', 'nonce 記錄已清空', 'nonce log cleared', 'nonce 記録を消去しました', 'nonce 기록 삭제됨', 'Journal nonce effacé', 'Nonce-Log geleert', 'Журнал nonce очищен'],
    'toast.langset':   ['语言已切换', '語言已切換', 'Language changed', '言語を変更しました', '언어 변경됨', 'Langue changée', 'Sprache geändert', 'Язык изменён'],
    'toast.needalgo':  ['请先选择算法', '請先選擇演算法', 'Select an algorithm first', '先にアルゴリズムを選択', '알고리즘을 먼저 선택', 'Choisissez un algorithme', 'Algorithmus wählen', 'Выберите алгоритм'],
    'toast.emptyout':  ['没有可复制的内容', '沒有可複製的內容', 'Nothing to copy', 'コピーする内容がありません', '복사할 내용 없음', 'Rien à copier', 'Nichts zu kopieren', 'Нечего копировать'],

    'tip.algo':        ['点开可选择全部算法，支持模糊搜索（如 aes2 / sm2 / 哈希）',
                        '點開可選擇全部演算法，支援模糊搜尋',
                        'Open to pick any algorithm; fuzzy search works (e.g. aes2, sm2)',
                        'クリックで全アルゴリズムから選択。あいまい検索可',
                        '클릭하여 알고리즘 선택, 부분 검색 지원',
                        'Ouvrez pour choisir un algorithme ; recherche approximative',
                        'Öffnen zum Auswählen; unscharfe Suche',
                        'Откройте для выбора алгоритма; поддерживается поиск'],
    'tip.key':         ['密钥长度必须符合算法要求；口令模式会走下方 KDF 派生',
                        '金鑰長度必須符合演算法要求；口令模式會走下方 KDF 派生',
                        'Key length must match the algorithm; password mode runs through the KDF below',
                        '鍵長はアルゴリズム要件に一致させること。パスワードは KDF で派生',
                        '키 길이는 알고리즘 요구사항과 일치해야 함',
                        'La longueur doit correspondre à l\'algorithme',
                        'Schlüssellänge muss zum Algorithmus passen',
                        'Длина ключа должна соответствовать алгоритму'],
    'tip.mode':        ['AEAD 模式（GCM/CCM/OCB…）自带认证，不需要再选 EtM',
                        'AEAD 模式自帶認證，不需要再選 EtM',
                        'AEAD modes authenticate on their own — no need for extra EtM',
                        'AEAD モードは認証付き。EtM は不要',
                        'AEAD 모드는 자체 인증 포함',
                        'Les modes AEAD authentifient déjà',
                        'AEAD-Modi authentifizieren selbst',
                        'Режимы AEAD уже аутентифицируют'],
    'tip.iv':          ['留空会自动生成并回写；手动填过的 IV 才会被真正采用',
                        '留空會自動產生並回寫；手動填過的 IV 才會被採用',
                        'Left empty: generated and written back. Only a hand-edited IV is actually reused.',
                        '空なら自動生成して書き戻し。手入力した IV のみ採用',
                        '비우면 자동 생성, 직접 입력한 IV만 사용됨',
                        'Vide : généré automatiquement',
                        'Leer: wird automatisch erzeugt',
                        'Пусто: генерируется автоматически'],
    'tip.nonce':       ['同一密钥 + 同一 nonce 加密两段明文会泄露明文异或，务必开启',
                        '同一金鑰 + 同一 nonce 加密兩段明文會洩漏明文 XOR，務必開啟',
                        'Same key + same nonce leaks the XOR of both plaintexts — keep this on',
                        '同一鍵＋同一 nonce は平文の XOR が漏れるため有効推奨',
                        '같은 키+nonce 재사용은 평문 XOR 유출',
                        'Même clé + même nonce : fuite du XOR des clairs',
                        'Gleicher Schlüssel + Nonce verrät XOR der Klartexte',
                        'Один ключ + nonce раскрывает XOR открытых текстов'],
    'tip.fmt':         ['加密与解密必须选同一种格式，否则解析会出错',
                        '加密與解密必須選同一種格式',
                        'Encrypt and decrypt must use the same format',
                        '暗号化と復号は同じ形式を選ぶこと',
                        '암호화/복호화는 같은 형식 사용',
                        'Chiffrement et déchiffrement doivent utiliser le même format',
                        'Ver- und Entschlüsseln müssen dasselbe Format nutzen',
                        'Шифрование и дешифрование должны использовать один формат'],
    'tip.output':      ['结果为只读；可复制或下载',
                        '結果為唯讀；可複製或下載',
                        'Read-only result; copy or download it',
                        '結果は読み取り専用。コピーか保存を',
                        '결과는 읽기 전용',
                        'Résultat en lecture seule',
                        'Nur-Lese-Ausgabe',
                        'Только чтение'],

    'misc.choose':     ['请选择算法', '請選擇演算法', 'Select an algorithm', 'アルゴリズムを選択', '알고리즘 선택', 'Choisir un algorithme', 'Algorithmus wählen', 'Выберите алгоритм'],
    'misc.searchph':   ['搜索算法…', '搜尋演算法…', 'Search algorithms…', 'アルゴリズム検索…', '알고리즘 검색…', 'Rechercher…', 'Algorithmen suchen…', 'Поиск алгоритмов…'],

    /* ---- opt ---- */
    'opt.cont.ivct':     ['IV‖密文（前缀拼接）', 'IV‖密文（前綴拼接）', 'IV‖ciphertext (prefix)', 'IV‖暗号文（前置連結）', 'IV‖암호문(접두사 연결)', 'IV‖chiffré (préfixe)', 'IV‖Chiffretext (Präfix)', 'IV‖шифртекст (префикс)'],
    'opt.cont.json':     ['JSON 全参数（ct/iv/salt）', 'JSON 全參數（ct/iv/salt）', 'JSON (full params: ct/iv/salt)', 'JSON 全パラメータ（ct/iv/salt）', 'JSON 전체 매개변수(ct/iv/salt)', 'JSON (tous paramètres)', 'JSON (alle Parameter)', 'JSON (все параметры)'],
    'opt.cont.jwe':      ['JWE（紧凑序列化）', 'JWE（緊湊序列化）', 'JWE (compact serialization)', 'JWE（コンパクト直列化）', 'JWE(컴팩트 직렬화)', 'JWE (sérialisation compacte)', 'JWE (kompakte Serialisierung)', 'JWE (компактная сериализация)'],
    'opt.cont.none':     ['无（裸密文）', '無（裸密文）', 'None (raw ciphertext)', 'なし（生暗号文）', '없음(원시 암호문)', 'Aucun (chiffré brut)', 'Keine (roher Chiffretext)', 'Нет (чистый шифртекст)'],
    'opt.cont.openssl':  ['OpenSSL 兼容（Salted__）', 'OpenSSL 相容（Salted__）', 'OpenSSL compatible (Salted__)', 'OpenSSL 互換（Salted__）', 'OpenSSL 호환(Salted__)', 'Compatible OpenSSL (Salted__)', 'OpenSSL-kompatibel (Salted__)', 'Совместимый OpenSSL (Salted__)'],
    'opt.cont.opensslns': ['OpenSSL 无盐（-nosalt）', 'OpenSSL 無鹽（-nosalt）', 'OpenSSL no salt (-nosalt)', 'OpenSSL ソルトなし（-nosalt）', 'OpenSSL 무솔트(-nosalt)', 'OpenSSL sans sel (-nosalt)', 'OpenSSL ohne Salt (-nosalt)', 'OpenSSL без соли (-nosalt)'],
    'opt.cont.pem':      ['PEM 装甲（BEGIN CIPHER）', 'PEM 裝甲（BEGIN CIPHER）', 'PEM armor (BEGIN CIPHER)', 'PEM アーマー（BEGIN CIPHER）', 'PEM 아머(BEGIN CIPHER)', 'Armure PEM (BEGIN CIPHER)', 'PEM-Armor (BEGIN CIPHER)', 'PEM-броня (BEGIN CIPHER)'],
    'opt.etm.none':      ['无（不附加认证）', '無（不附加認證）', 'None (no extra auth)', 'なし（追加認証なし）', '없음(추가 인증 없음)', 'Aucun (sans auth.)', 'Keine (ohne Auth.)', 'Нет (без аутентификации)'],
    'opt.fmt.hex':       ['十六进制', '十六進位', 'Hexadecimal', '16 進数', '16진수', 'Hexadécimal', 'Hexadezimal', 'Шестнадцатеричный'],
    'opt.hash.sha1':     ['SHA-1（兼容旧系统，已弱化）', 'SHA-1（相容舊系統，已弱化）', 'SHA-1 (legacy, weakened)', 'SHA-1（レガシー互換、弱体化）', 'SHA-1(레거시 호환, 약화됨)', 'SHA-1 (héritage, affaibli)', 'SHA-1 (Alt, geschwächt)', 'SHA-1 (устаревший, ослаблен)'],
    'opt.hash.sha256':   ['SHA-256（推荐）', 'SHA-256（建議）', 'SHA-256 (recommended)', 'SHA-256（推奨）', 'SHA-256(권장)', 'SHA-256 (recommandé)', 'SHA-256 (empfohlen)', 'SHA-256 (рекомендуется)'],
    'opt.hash.sm3':      ['SM3（国密）', 'SM3（國密）', 'SM3 (Chinese national)', 'SM3（中国国家暗号）', 'SM3(중국 국가암호)', 'SM3 (norme chinoise)', 'SM3 (chinesischer Standard)', 'SM3 (китайский стандарт)'],
    'opt.kdf.argon2d':   ['Argon2d（抗 GPU，最快）', 'Argon2d（抗 GPU，最快）', 'Argon2d (GPU resistant, fastest)', 'Argon2d（GPU 耐性、最速）', 'Argon2d(GPU 저항, 최고속)', 'Argon2d (résistant GPU, le plus rapide)', 'Argon2d (GPU-resistent, am schnellsten)', 'Argon2d (защита от GPU, быстрый)'],
    'opt.kdf.argon2i':   ['Argon2i（抗侧信道）', 'Argon2i（抗側通道）', 'Argon2i (side-channel resistant)', 'Argon2i（サイドチャネル耐性）', 'Argon2i(부채널 저항)', 'Argon2i (résistant aux canaux auxil.)', 'Argon2i (seitenkanalresistent)', 'Argon2i (защита от side-channel)'],
    'opt.kdf.argon2id':  ['Argon2id（推荐，抗 GPU/ASIC）', 'Argon2id（建議，抗 GPU/ASIC）', 'Argon2id (recommended, GPU/ASIC resistant)', 'Argon2id（推奨、GPU/ASIC 耐性）', 'Argon2id(권장, GPU/ASIC 저항)', 'Argon2id (recommandé, résistant GPU/ASIC)', 'Argon2id (empfohlen, GPU/ASIC-resistent)', 'Argon2id (реком., защита от GPU/ASIC)'],
    'opt.kdf.bcrypt':    ['bcrypt（经典口令哈希）', 'bcrypt（經典口令雜湊）', 'bcrypt (classic password hash)', 'bcrypt（古典的パスワードハッシュ）', 'bcrypt(고전적 비밀번호 해시)', 'bcrypt (hash classique)', 'bcrypt (klassischer Passwort-Hash)', 'bcrypt (классический хеш)'],
    'opt.kdf.bcryptpbkdf': ['bcrypt-pbkdf（OpenSSH 新版格式）', 'bcrypt-pbkdf（OpenSSH 新版格式）', 'bcrypt-pbkdf (OpenSSH new format)', 'bcrypt-pbkdf（OpenSSH 新形式）', 'bcrypt-pbkdf(OpenSSH 새 형식)', 'bcrypt-pbkdf (nouveau format OpenSSH)', 'bcrypt-pbkdf (neues OpenSSH-Format)', 'bcrypt-pbkdf (новый формат OpenSSH)'],
    'opt.kdf.kdf2':      ['PBKDF2（可选摘要算法）', 'PBKDF2（可選摘要演算法）', 'PBKDF2 (selectable digest)', 'PBKDF2（ダイジェスト選択可）', 'PBKDF2(다이제스트 선택 가능)', 'PBKDF2 (digest au choix)', 'PBKDF2 (Digest wählbar)', 'PBKDF2 (выбор хэша)'],
    'opt.kdf.legacy':    ['旧版单次 SHA-256（仅解历史数据）', '舊版單次 SHA-256（僅解歷史資料）', 'Legacy single SHA-256 (old data only)', '旧版単一 SHA-256（過去データ専用）', '레거시 단일 SHA-256(과거 데이터 전용)', 'SHA-256 unique hérité (anciennes données)', 'Altes einfaches SHA-256 (nur Altdaten)', 'Устаревшее SHA-256 (только старые данные)'],
    'opt.kdf.pbkdf1':    ['PBKDF1（SHA-1，≤20 字节，仅兼容旧系统）', 'PBKDF1（SHA-1，≤20 位元組，僅相容舊系統）', 'PBKDF1 (SHA-1, ≤20 bytes, legacy only)', 'PBKDF1（SHA-1、≤20 バイト、レガシーのみ）', 'PBKDF1(SHA-1, ≤20바이트, 레거시 전용)', 'PBKDF1 (SHA-1, ≤20 octets, héritage)', 'PBKDF1 (SHA-1, ≤20 Bytes, nur Alt)', 'PBKDF1 (SHA-1, ≤20 байт, только старое)'],
    'opt.kdf.scrypt':    ['scrypt（抗 ASIC）', 'scrypt（抗 ASIC）', 'scrypt (ASIC resistant)', 'scrypt（ASIC 耐性）', 'scrypt(ASIC 저항)', 'scrypt (résistant ASIC)', 'scrypt (ASIC-resistent)', 'scrypt (защита от ASIC)'],
    'opt.kdf.sp56a':     ['SP 800-56A 单步 KDF（HMAC 变体）', 'SP 800-56A 單步 KDF（HMAC 變體）', 'SP 800-56A one-step KDF (HMAC)', 'SP 800-56A 1 段 KDF（HMAC 変種）', 'SP 800-56A 단일 단계 KDF(HMAC)', 'SP 800-56A KDF une étape (HMAC)', 'SP 800-56A Ein-Schritt-KDF (HMAC)', 'SP 800-56A одношаговая KDF (HMAC)'],
    'opt.kdf.sp56c':     ['SP 800-56C 两步 KDF（HMAC 变体）', 'SP 800-56C 兩步 KDF（HMAC 變體）', 'SP 800-56C two-step KDF (HMAC)', 'SP 800-56C 2 段 KDF（HMAC 変種）', 'SP 800-56C 2단계 KDF(HMAC)', 'SP 800-56C KDF deux étapes (HMAC)', 'SP 800-56C Zwei-Schritt-KDF (HMAC)', 'SP 800-56C двухшаговая KDF (HMAC)'],
    'opt.kdf.x942':      ['ANSI X9.42 PRF（CMS 老式）', 'ANSI X9.42 PRF（CMS 老式）', 'ANSI X9.42 PRF (legacy CMS)', 'ANSI X9.42 PRF（レガシー CMS）', 'ANSI X9.42 PRF(레거시 CMS)', 'ANSI X9.42 PRF (CMS hérité)', 'ANSI X9.42 PRF (altes CMS)', 'ANSI X9.42 PRF (старый CMS)'],
    'opt.keyin.pw':      ['口令（走 KDF 派生）', '口令（走 KDF 派生）', 'Password (via KDF)', 'パスワード（KDF 派生）', '비밀번호(KDF 파생)', 'Mot de passe (via KDF)', 'Passwort (via KDF)', 'Пароль (через KDF)'],
    'opt.keyin.rand':    ['随机生成（自动填回密钥框）', '隨機產生（自動填回金鑰欄）', 'Random (auto-fill key box)', 'ランダム生成（鍵欄に自動入力）', '무작위 생성(키 칸 자동 입력)', 'Aléatoire (remplissage auto)', 'Zufällig (auto ausfüllen)', 'Случайный (автозаполнение)'],
    'opt.keyin.raw':     ['原始密钥 · Hex（不经 KDF）', '原始金鑰 · Hex（不經 KDF）', 'Raw key · Hex (no KDF)', '生鍵 · Hex（KDF なし）', '원시 키 · Hex(KDF 없음)', 'Clé brute · Hex (sans KDF)', 'Rohtschlüssel · Hex (ohne KDF)', 'Сырой ключ · Hex (без KDF)'],
    'opt.keyin.rawb64':  ['原始密钥 · Base64（不经 KDF）', '原始金鑰 · Base64（不經 KDF）', 'Raw key · Base64 (no KDF)', '生鍵 · Base64（KDF なし）', '원시 키 · Base64(KDF 없음)', 'Clé brute · Base64 (sans KDF)', 'Rohtschlüssel · Base64 (ohne KDF)', 'Сырой ключ · Base64 (без KDF)'],
    'opt.keyin.rawdec':  ['原始密钥 · 十进制数组（不经 KDF）', '原始金鑰 · 十進位陣列（不經 KDF）', 'Raw key · decimal array (no KDF)', '生鍵 · 10 進配列（KDF なし）', '원시 키 · 10진 배열(KDF 없음)', 'Clé brute · tableau décimal (sans KDF)', 'Rohtschlüssel · Dezimalarray (ohne KDF)', 'Сырой ключ · десятичный массив (без KDF)'],
    'opt.keyin.rawtext': ['原始密钥 · 文本 UTF-8（不经 KDF）', '原始金鑰 · 文字 UTF-8（不經 KDF）', 'Raw key · UTF-8 text (no KDF)', '生鍵 · UTF-8 テキスト（KDF なし）', '원시 키 · UTF-8 텍스트(KDF 없음)', 'Clé brute · texte UTF-8 (sans KDF)', 'Rohtschlüssel · UTF-8-Text (ohne KDF)', 'Сырой ключ · текст UTF-8 (без KDF)'],
    'opt.mode.biige':    ['biIGE（双向 IGE，错误双向传播）', 'biIGE（雙向 IGE，錯誤雙向傳播）', 'biIGE (bidirectional IGE)', 'biIGE（双方向 IGE、誤り双方向伝播）', 'biIGE(양방향 IGE)', 'biIGE (IGE bidirectionnel)', 'biIGE (bidirektionales IGE)', 'biIGE (двунаправл. IGE)'],
    'opt.mode.ccm':      ['CCM（认证加密）', 'CCM（認證加密）', 'CCM (AEAD)', 'CCM（認証付き暗号）', 'CCM(인증 암호화)', 'CCM (AEAD)', 'CCM (AEAD)', 'CCM (AEAD)'],
    'opt.mode.cfb1':     ['CFB1（1 位 CFB）', 'CFB1（1 位元 CFB）', 'CFB1 (1-bit CFB)', 'CFB1（1 ビット CFB）', 'CFB1(1비트 CFB)', 'CFB1 (CFB 1 bit)', 'CFB1 (1-Bit-CFB)', 'CFB1 (1-бит CFB)'],
    'opt.mode.cfb8':     ['CFB8（8 位 CFB）', 'CFB8（8 位元 CFB）', 'CFB8 (8-bit CFB)', 'CFB8（8 ビット CFB）', 'CFB8(8비트 CFB)', 'CFB8 (CFB 8 bits)', 'CFB8 (8-Bit-CFB)', 'CFB8 (8-бит CFB)'],
    'opt.mode.cs1':      ['CTS-CS1（密文窃取 NIST）', 'CTS-CS1（密文竊取 NIST）', 'CTS-CS1 (ciphertext stealing, NIST)', 'CTS-CS1（暗号文盗用、NIST）', 'CTS-CS1(암호문 탈취, NIST)', 'CTS-CS1 (vol de chiffré, NIST)', 'CTS-CS1 (Ciphertext Stealing, NIST)', 'CTS-CS1 (CTS, NIST)'],
    'opt.mode.cs2':      ['CTS-CS2（密文窃取）', 'CTS-CS2（密文竊取）', 'CTS-CS2 (ciphertext stealing)', 'CTS-CS2（暗号文盗用）', 'CTS-CS2(암호문 탈취)', 'CTS-CS2 (vol de chiffré)', 'CTS-CS2 (Ciphertext Stealing)', 'CTS-CS2 (CTS)'],
    'opt.mode.eax':      ['EAX（认证加密）', 'EAX（認證加密）', 'EAX (AEAD)', 'EAX（認証付き暗号）', 'EAX(인증 암호화)', 'EAX (AEAD)', 'EAX (AEAD)', 'EAX (AEAD)'],
    'opt.mode.gcm':      ['GCM（认证加密）', 'GCM（認證加密）', 'GCM (AEAD)', 'GCM（認証付き暗号）', 'GCM(인증 암호화)', 'GCM (AEAD)', 'GCM (AEAD)', 'GCM (AEAD)'],
    'opt.mode.gcmsiv':   ['GCM-SIV（抗 nonce 误用，RFC 8452）', 'GCM-SIV（抗 nonce 誤用，RFC 8452）', 'GCM-SIV (nonce-misuse resistant, RFC 8452)', 'GCM-SIV（nonce 誤用耐性、RFC 8452）', 'GCM-SIV(nonce 오용 저항, RFC 8452)', 'GCM-SIV (résistant nonce, RFC 8452)', 'GCM-SIV (Nonce-resistent, RFC 8452)', 'GCM-SIV (устойч. к nonce, RFC 8452)'],
    'opt.mode.ige':      ['IGE（无限混淆扩展，OpenSSL）', 'IGE（無限混淆擴充，OpenSSL）', 'IGE (Infinite Garble Extension, OpenSSL)', 'IGE（Infinite Garble Extension、OpenSSL）', 'IGE(무한 가블 확장, OpenSSL)', 'IGE (Infinite Garble Extension, OpenSSL)', 'IGE (Infinite Garble Extension, OpenSSL)', 'IGE (Infinite Garble Extension, OpenSSL)'],
    'opt.mode.kw':       ['KW（密钥包装，RFC 3394 / SP 800-38F）', 'KW（金鑰包裝，RFC 3394 / SP 800-38F）', 'KW (key wrap, RFC 3394 / SP 800-38F)', 'KW（鍵ラップ、RFC 3394 / SP 800-38F）', 'KW(키 래핑, RFC 3394 / SP 800-38F)', 'KW (encapsulation de clé, RFC 3394 / SP 800-38F)', 'KW (Key Wrap, RFC 3394 / SP 800-38F)', 'KW (упаковка ключа, RFC 3394 / SP 800-38F)'],
    'opt.mode.kwp':      ['KWP（带填充密钥包装，RFC 5649）', 'KWP（含填充金鑰包裝，RFC 5649）', 'KWP (padded key wrap, RFC 5649)', 'KWP（パディング付き鍵ラップ、RFC 5649）', 'KWP(패딩 키 래핑, RFC 5649)', 'KWP (encapsulation avec rembourrage, RFC 5649)', 'KWP (Key Wrap mit Padding, RFC 5649)', 'KWP (упаковка с дополнением, RFC 5649)'],
    'opt.mode.lrw':      ['LRW（可调分组，XTS 前身）', 'LRW（可調分組，XTS 前身）', 'LRW (tweakable, XTS predecessor)', 'LRW（ tweakable、XTS の前身）', 'LRW(조정 가능, XTS前身)', 'LRW (tweakable, prédécesseur XTS)', 'LRW (tweakbar, XTS-Vorgänger)', 'LRW (настраиваемый, предшеств. XTS)'],
    'opt.mode.ocb':      ['OCB（认证加密）', 'OCB（認證加密）', 'OCB (AEAD)', 'OCB（認証付き暗号）', 'OCB(인증 암호화)', 'OCB (AEAD)', 'OCB (AEAD)', 'OCB (AEAD)'],
    'opt.mode.pcbc':     ['PCBC（错误传播 CBC）', 'PCBC（錯誤傳播 CBC）', 'PCBC (error-propagating CBC)', 'PCBC（誤り伝播 CBC）', 'PCBC(오류 전파 CBC)', 'PCBC (CBC à propagation)', 'PCBC (fehlerfortpflanzend)', 'PCBC (распростр. ошибок)'],
    'opt.mode.siv':      ['SIV（确定性认证加密）', 'SIV（確定性認證加密）', 'SIV (deterministic AEAD)', 'SIV（決定性認証暗号）', 'SIV(결정적 인증 암호)', 'SIV (AEAD déterministe)', 'SIV (deterministisch AEAD)', 'SIV (детерминир. AEAD)'],
    'opt.mode.xts':      ['XTS（磁盘加密）', 'XTS（磁碟加密）', 'XTS (disk encryption)', 'XTS（ディスク暗号）', 'XTS(디스크 암호화)', 'XTS (chiffrement disque)', 'XTS (Festplattenverschl.)', 'XTS (шифрование диска)'],
    'opt.nonce.block':   ['阻止（发现复用即中止）', '阻止（發現重複使用即中止）', 'Block (abort on reuse)', 'ブロック（再利用検出で中止）', '차단(재사용 시 중단)', 'Bloquer (arrêt si réutilisation)', 'Blockieren (Abbruch bei Wiederverw.)', 'Блокировать (прерывать при повторе)'],
    'opt.nonce.off':     ['关闭', '關閉', 'Off', 'オフ', '끄기', 'Désactivé', 'Aus', 'Выключено'],
    'opt.nonce.warn':    ['仅警告', '僅警告', 'Warn only', '警告のみ', '경고만', 'Avertir seulement', 'Nur warnen', 'Только предупредить'],
    'opt.pad.iso10126':  ['ISO 10126（随机填充）', 'ISO 10126（隨機填充）', 'ISO 10126 (random padding)', 'ISO 10126（ランダムパディング）', 'ISO 10126(무작위 패딩)', 'ISO 10126 (rembourrage aléatoire)', 'ISO 10126 (zufälliges Padding)', 'ISO 10126 (случайное)'],
    'opt.pad.none':      ['无填充', '無填充', 'No padding', 'パディングなし', '패딩 없음', 'Sans rembourrage', 'Kein Padding', 'Без дополнения'],
    'opt.pad.pkcs5':     ['PKCS5（8 字节块）', 'PKCS5（8 位元組塊）', 'PKCS5 (8-byte block)', 'PKCS5（8 バイトブロック）', 'PKCS5(8바이트 블록)', 'PKCS5 (bloc 8 octets)', 'PKCS5 (8-Byte-Block)', 'PKCS5 (8-байт блок)'],
    'opt.pad.tbc':       ['TBC（尾位补码）', 'TBC（尾位補碼）', 'TBC (trailing bit complement)', 'TBC（末尾ビット補数）', 'TBC(후미 비트 보수)', 'TBC (complément bit final)', 'TBC (Endbit-Komplement)', 'TBC (доп. код конца)'],
    'opt.pad.zero':      ['Zero 填充', 'Zero 填充', 'Zero padding', 'ゼロパディング', 'Zero 패딩', 'Rembourrage zéro', 'Null-Padding', 'Нулевое дополнение'],
    'opt.padstrict.loose': ['宽松（仅排查旧数据）', '寬鬆（僅排查舊資料）', 'Loose (legacy data only)', '緩い（過去データ調査のみ）', '완화(과거 데이터 조사 전용)', 'Souple (anciennes données)', 'Locker (nur Altdaten)', 'Слабый (только старые данные)'],
    'opt.padstrict.strict': ['严格（防 Padding Oracle）', '嚴格（防 Padding Oracle）', 'Strict (padding-oracle safe)', '厳格（Padding Oracle 対策）', '엄격(Padding Oracle 방지)', 'Strict (anti padding oracle)', 'Streng (Padding-Oracle-Schutz)', 'Строгий (защита от padding oracle)'],
    'opt.tag.12':        ['12 字节（96 位）', '12 位元組（96 位元）', '12 bytes (96-bit)', '12 バイト（96 ビット）', '12바이트(96비트)', '12 octets (96 bits)', '12 Bytes (96 Bit)', '12 байт (96 бит)'],
    'opt.tag.13':        ['13 字节（104 位）', '13 位元組（104 位元）', '13 bytes (104-bit)', '13 バイト（104 ビット）', '13바이트(104비트)', '13 octets (104 bits)', '13 Bytes (104 Bit)', '13 байт (104 бит)'],
    'opt.tag.14':        ['14 字节（112 位）', '14 位元組（112 位元）', '14 bytes (112-bit)', '14 バイト（112 ビット）', '14바이트(112비트)', '14 octets (112 bits)', '14 Bytes (112 Bit)', '14 байт (112 бит)'],
    'opt.tag.15':        ['15 字节（120 位）', '15 位元組（120 位元）', '15 bytes (120-bit)', '15 バイト（120 ビット）', '15바이트(120비트)', '15 octets (120 bits)', '15 Bytes (120 Bit)', '15 байт (120 бит)'],
    'opt.tag.16':        ['16 字节（128 位，推荐）', '16 位元組（128 位元，建議）', '16 bytes (128-bit, recommended)', '16 バイト（128 ビット、推奨）', '16바이트(128비트, 권장)', '16 octets (128 bits, recommandé)', '16 Bytes (128 Bit, empfohlen)', '16 байт (128 бит, реком.)'],
    'opt.tag.32':        ['32 字节（256 位，仅 AEGIS 系列）', '32 位元組（256 位元，僅 AEGIS 系列）', '32 bytes (256-bit, AEGIS only)', '32 バイト（256 ビット、AEGIS のみ）', '32바이트(256비트, AEGIS 전용)', '32 octets (256 bits, AEGIS uniquement)', '32 Bytes (256 Bit, nur AEGIS)', '32 байта (256 бит, только AEGIS)'],
    'opt.tag.4':         ['4 字节（32 位，仅测试）', '4 位元組（32 位元，僅測試）', '4 bytes (32-bit, testing only)', '4 バイト（32 ビット、テスト専用）', '4바이트(32비트, 테스트 전용)', '4 octets (32 bits, test uniquement)', '4 Bytes (32 Bit, nur Test)', '4 байта (32 бита, только тест)'],
    'opt.tag.8':         ['8 字节（64 位，较弱）', '8 位元組（64 位元，較弱）', '8 bytes (64-bit, weak)', '8 バイト（64 ビット、弱い）', '8바이트(64비트, 약함)', '8 octets (64 bits, faible)', '8 Bytes (64 Bit, schwach)', '8 байт (64 бита, слабый)'],
    /* ---- ph ---- */
    'ph.aad':            ['AEAD 模式下参与认证但不加密的数据', 'AEAD 模式下參與認證但不加密的資料', 'Authenticated but unencrypted data (AEAD)', 'AEAD で認証のみされるデータ', 'AEAD에서 인증만 되는 데이터', 'Données authentifiées non chiffrées (AEAD)', 'Authentifizierte, nicht verschl. Daten (AEAD)', 'Аутентифицируемые, но не шифруемые данные (AEAD)'],
    'ph.algoSearch':     ['搜索算法（支持模糊，如 aes2 / sm2 / 哈希 / 门限）', '搜尋演算法（支援模糊，如 aes2 / sm2 / 雜湊 / 門檻）', 'Search algorithms (fuzzy: aes2 / sm2 / hash / threshold)', 'アルゴリズム検索（あいまい：aes2 / sm2 / ハッシュ / 閾値）', '알고리즘 검색(유사: aes2 / sm2 / 해시 / 임계)', 'Rechercher algorithmes (flou : aes2 / sm2 / hash / seuil)', 'Algorithmen suchen (unscharf: aes2 / sm2 / Hash / Schwellwert)', 'Поиск алгоритмов (нечёткий: aes2 / sm2 / хеш / порог)'],
    'ph.input':          ['在此输入文本，或拖拽文件到下方', '在此輸入文字，或拖曳檔案到下方', 'Enter text here, or drop a file below', 'ここにテキスト入力、または下にファイルをドロップ', '여기에 텍스트 입력 또는 아래에 파일 드롭', 'Saisir du texte ou déposer un fichier', 'Text eingeben oder Datei unten ablegen', 'Введите текст или перетащите файл ниже'],
    'ph.iv':             ['Hex 格式；留空则加密时自动生成并填回此处', 'Hex 格式；留空則加密時自動產生並填回此處', 'Hex format; auto-generated and written back if empty', 'Hex 形式；空なら暗号化時に自動生成して記入', 'Hex 형식; 비우면 암호화 시 자동 생성 후 기입', 'Format Hex; auto-généré si vide', 'Hex-Format; leer = automatisch erzeugt', 'Hex-формат; пусто = автогенерация'],
    'ph.kdfIter':        ['建议 ≥ 210000', '建議 ≥ 210000', 'Recommended ≥ 210000', '推奨 ≥ 210000', '권장 ≥ 210000', 'Recommandé ≥ 210000', 'Empfohlen ≥ 210000', 'Рекомендуется ≥ 210000'],
    'ph.key':            ['请输入密钥', '請輸入金鑰', 'Enter key', '鍵を入力', '키 입력', 'Saisir la clé', 'Schlüssel eingeben', 'Введите ключ'],
    'ph.salt':           ['参与密钥派生；可与对端约定固定值', '參與金鑰派生；可與對端約定固定值', 'Used in key derivation; can be fixed with peer', '鍵派生に使用；固定値も可', '키 파생에 사용; 고정값 가능', 'Utilisé pour la dérivation; peut être fixe', 'Für Schlüsselableitung; mit Gegenstelle fixierbar', 'Используется в KDF; можно зафиксировать'],
    /* ---- lbl ---- */
    'lbl.drop':          ['拖拽文件到此处，或点击选择文件', '拖曳檔案到此處，或點擊選擇檔案', 'Drop a file here, or click to choose', 'ファイルをここにドロップ、またはクリックで選択', '파일을 여기에 드롭 또는 클릭하여 선택', 'Déposer un fichier ici ou cliquer', 'Datei hier ablegen oder klicken', 'Перетащите файл сюда или нажмите'],
    'lbl.iter':          ['PBKDF2 迭代次数', 'PBKDF2 迭代次數', 'PBKDF2 iterations', 'PBKDF2 反復回数', 'PBKDF2 반복 횟수', 'Itérations PBKDF2', 'PBKDF2-Iterationen', 'Итерации PBKDF2'],
    /* ---- aria ---- */
    'aria.file':         ['选择文件', '選擇檔案', 'Choose file', 'ファイル選択', '파일 선택', 'Choisir un fichier', 'Datei auswählen', 'Выбрать файл'],
    /* ---- title ---- */
    'title.ver':         ['点击查看版本信息', '點擊檢視版本資訊', 'Click for version info', 'クリックでバージョン情報', '클릭하여 버전 정보', 'Cliquez pour les infos version', 'Für Versionsinfo klicken', 'Нажмите для информации о версии'],
    /* ---- sum ---- */
    'sum.fmt':           ['输出格式与模式说明（23 种编码 / XTS / IGE / Argon2）', '輸出格式與模式說明（23 種編碼 / XTS / IGE / Argon2）', 'Output formats and modes (23 encodings / XTS / IGE / Argon2)', '出力形式とモードの説明（23 種類 / XTS / IGE / Argon2）', '출력 형식 및 모드 설명(23종 인코딩 / XTS / IGE / Argon2)', 'Formats et modes (23 encodages / XTS / IGE / Argon2)', 'Ausgabeformate und Modi (23 Kodierungen / XTS / IGE / Argon2)', 'Форматы вывода и режимы (23 кодировки / XTS / IGE / Argon2)'],
    'sum.selftest':      ['自检结果', '自檢結果', 'Self-test results', '自己診断結果', '자체 점검 결과', 'Résultats auto-test', 'Selbsttest-Ergebnisse', 'Результаты самопроверки'],
    'sum.usage':         ['填充 / 模式 / 容器 / 密钥导出 使用说明', '填充 / 模式 / 容器 / 金鑰匯出 使用說明', 'Padding / mode / container / key export usage', 'パディング・モード・コンテナ・鍵エクスポートの使い方', '패딩 / 모드 / 컨테이너 / 키 내보내기 사용법', 'Rembourrage / mode / conteneur / export clé', 'Padding / Modus / Container / Schlüsselexport', 'Дополнение / режим / контейнер / экспорт ключей'],
    /* ---- ver ---- */
    'ver.algocnt':       ['算法总数', '演算法總數', 'Algorithms', 'アルゴリズム数', '알고리즘 수', 'Algorithmes', 'Algorithmen', 'Алгоритмы'],
    'ver.err':           ['控制台报错', '主控台報錯', 'Console errors', 'コンソールエラー', '콘솔 오류', 'Erreurs console', 'Konsolenfehler', 'Ошибки консоли'],
    'ver.fullname':       ['正式名称', '正式名稱', 'Full name', '正式名称', '정식 명칭', 'Nom complet', 'Vollständiger Name', 'Полное название'],
    /* ---- ver（卡片整段，含内联 <b>，走 data-i18n-html） ---- */
    'ver.line':        ['版本号遵循 <b>SemVer</b>（主版本.次版本.修订号），规则见随包的 <b>版本规则.md</b>：删条目或改语义升主版本，新增算法升次版本，修 bug 与优化升修订号；版本号不含任何代号。这个工具的两个坚持是：<b id="verAlgo2">全部算法</b>均经权威向量或参考实现交叉验证，以及<b>零外部依赖</b>——不引任何 CDN 或 npm 包，断网可用。',
                        '版本號遵循 <b>SemVer</b>（主版本.次版本.修訂號），規則見隨包的 <b>版本規則.md</b>：刪條目或改語義升主版本，新增演算法升次版本，修 bug 與最佳化升修訂號；版本號不含任何代號。這個工具的兩個堅持是：<b id="verAlgo2">全部演算法</b>均經權威向量或參考實作交叉驗證，以及<b>零外部依賴</b>——不引任何 CDN 或 npm 包，離線可用。',
                        'Versioning follows <b>SemVer</b> (major.minor.patch); see the bundled <b>版本规则.md</b>: removing entries or changing semantics bumps major, adding algorithms bumps minor, fixes and optimizations bump patch. No codenames. Two commitments: <b id="verAlgo2">all algorithms</b> are cross-verified against authoritative vectors or reference implementations, and <b>zero external dependencies</b> — no CDN, no npm, works offline.',
                        'バージョンは <b>SemVer</b>（メジャー.マイナー.パッチ）に準拠。詳細は同梱の <b>版本规则.md</b>：条目削除や意味変更はメジャー、アルゴリズム追加はマイナー、修正・最適化はパッチ。コードネームなし。二つの方針：<b id="verAlgo2">全アルゴリズム</b>は権威あるベクトル又は参照実装と相互検証済み、そして<b>外部依存ゼロ</b>——CDN も npm も使わずオフライン動作。',
                        '버전은 <b>SemVer</b>(주.부.수정)을 따릅니다. 규칙은 동봉된 <b>版本规则.md</b> 참조: 항목 삭제나 의미 변경은 주 버전, 알고리즘 추가는 부 버전, 수정·최적화는 수정 버전. 코드네임 없음. 두 가지 원칙: <b id="verAlgo2">모든 알고리즘</b>은 권위 있는 벡터 또는 참조 구현과 교차 검증, 그리고 <b>외부 의존성 제로</b>——CDN·npm 없이 오프라인 동작.',
                        'Le versionnage suit <b>SemVer</b> (majeur.mineur.correctif); voir le fichier <b>版本规则.md</b> : supprimer ou modifier la sémantique = majeur, ajouter un algo = mineur, correctifs = patch. Aucun nom de code. Deux engagements : <b id="verAlgo2">tous les algorithmes</b> sont vérifiés croisés contre des vecteurs ou implémentations de référence, et <b>zéro dépendance externe</b> — pas de CDN ni npm, fonctionne hors ligne.',
                        'Die Versionierung folgt <b>SemVer</b> (Major.Minor.Patch); siehe <b>版本规则.md</b>: Entfernen oder semantische Änderungen = Major, neue Algorithmen = Minor, Fixes/Optimierungen = Patch. Keine Codenamen. Zwei Zusagen: <b id="verAlgo2">alle Algorithmen</b> sind gegen autoritative Vektoren oder Referenzimplementierungen kreuzvalidiert, und <b>keine externen Abhängigkeiten</b> — kein CDN, kein npm, offline nutzbar.',
                        'Версионирование следует <b>SemVer</b> (мажор.минор.патч); см. <b>版本规则.md</b>: удаление или смена семантики = мажор, новые алгоритмы = минор, исправления и оптимизации = патч. Без кодовых имён. Два принципа: <b id="verAlgo2">все алгоритмы</b> кросс-проверены по авторитетным векторам или эталонным реализациям, и <b>ноль внешних зависимостей</b> — без CDN и npm, работает офлайн.'],
    'ver.note':        ['全部算法均以权威实现为参照逐条比对：Twofish 对 C 参考实现、Camellia 对 OpenSSL、SEED 对 RFC 4269 官方向量与 OpenSSL 随机向量、ARIA 对 RFC 5794 三组 KAT、SM2 与 GmSSL 双向互通、bcrypt 与 bcryptjs 逐字节一致。',
                        '全部演算法均以權威實作為參照逐條比對：Twofish 對 C 參考實作、Camellia 對 OpenSSL、SEED 對 RFC 4269 官方向量與 OpenSSL 隨機向量、ARIA 對 RFC 5794 三組 KAT、SM2 與 GmSSL 雙向互通、bcrypt 與 bcryptjs 逐位元組一致。',
                        'Every algorithm is cross-checked against an authoritative implementation: Twofish vs. the C reference, Camellia vs. OpenSSL, SEED vs. RFC 4269 official vectors and OpenSSL random vectors, ARIA vs. three RFC 5794 KATs, SM2 interoperating bidirectionally with GmSSL, bcrypt byte-identical with bcryptjs.',
                        '全アルゴリズムは権威ある実装を参照に逐条照合：Twofish は C 参照実装、Camellia は OpenSSL、SEED は RFC 4269 公式ベクトルと OpenSSL ランダムベクトル、ARIA は RFC 5794 の 3 組 KAT、SM2 は GmSSL と双方向相互運用、bcrypt は bcryptjs とバイト一致。',
                        '모든 알고리즘은 권위 있는 구현과 대조 검증: Twofish는 C 참조 구현, Camellia는 OpenSSL, SEED는 RFC 4269 공식 벡터 및 OpenSSL 랜덤 벡터, ARIA는 RFC 5794 KAT 3세트, SM2는 GmSSL과 양방향 호환, bcrypt는 bcryptjs와 바이트 단위 일치.',
                        'Chaque algorithme est comparé à une implémentation de référence : Twofish vs. la référence C, Camellia vs. OpenSSL, SEED vs. les vecteurs officiels RFC 4269 et les vecteurs aléatoires OpenSSL, ARIA vs. trois KAT RFC 5794, SM2 interopérable bidirectionnellement avec GmSSL, bcrypt identique octet par octet à bcryptjs.',
                        'Jeder Algorithmus ist gegen eine maßgebliche Implementierung geprüft: Twofish vs. C-Referenz, Camellia vs. OpenSSL, SEED vs. offizielle RFC-4269-Vektoren und OpenSSL-Zufallsvektoren, ARIA vs. drei RFC-5794-KATs, SM2 bidirektional interoperabel mit GmSSL, bcrypt byte-identisch mit bcryptjs.',
                        'Каждый алгоритм сверен с авторитетной реализацией: Twofish с эталонным C, Camellia с OpenSSL, SEED с официальными векторами RFC 4269 и случайными векторами OpenSSL, ARIA с тремя KAT RFC 5794, SM2 двусторонне совместим с GmSSL, bcrypt побайтово совпадает с bcryptjs.'],
    'ver.allalgo':     ['全部算法', '全部演算法', 'all algorithms', '全アルゴリズム', '모든 알고리즘', 'tous les algorithmes', 'alle Algorithmen', 'все алгоритмы'],
    'ver.algoN':       ['%n 个算法', '%n 個演算法', '%n algorithms', '%n アルゴリズム', '%n개 알고리즘', '%n algorithmes', '%n Algorithmen', '%n алгоритмов'],

    /* ---- grp（算法下拉框的分组标题，界面可见，翻译） ---- */
    'grp.sym':           ['对称加密', '對稱加密', 'Symmetric', '共通鍵暗号', '대칭 암호', 'Symétrique', 'Symmetrisch', 'Симметричное'],
    'grp.asym':          ['非对称加密', '非對稱加密', 'Asymmetric', '公開鍵暗号', '비대칭 암호', 'Asymétrique', 'Asymmetrisch', 'Асимметричное'],
    'grp.hash':          ['单向哈希', '單向雜湊', 'Hash', 'ハッシュ', '해시', 'Hachage', 'Hash', 'Хеширование'],
    'grp.enc':           ['编码', '編碼', 'Encoding', 'エンコード', '인코딩', 'Encodage', 'Kodierung', 'Кодирование'],
    /* ---- err（运行时错误提示，逻辑层用 _t(key, 中文兜底) 调用） ---- */
    'err.nowebcrypto':   ['当前环境不支持 Web Crypto', '當前環境不支援 Web Crypto', 'Web Crypto unavailable in this environment', 'この環境は Web Crypto 非対応', '이 환경은 Web Crypto 미지원', 'Web Crypto indisponible', 'Web Crypto nicht verfügbar', 'Web Crypto недоступен'],
    'err.badpad':        ['填充无效，密钥或数据可能不正确', '填充無效，金鑰或資料可能不正確', 'Invalid padding — wrong key or corrupted data', 'パディング不正。鍵またはデータが不正確', '패딩 무효 — 키 또는 데이터 오류', 'Rembourrage invalide — clé ou données incorrectes', 'Ungültiges Padding — falscher Schlüssel oder Daten', 'Неверное дополнение — неверный ключ или данные'],
    'err.ctlen':         ['密文长度不是块大小整数倍', '密文長度不是區塊大小整數倍', 'Ciphertext length is not a multiple of the block size', '暗号文長がブロック長の整数倍でない', '암호문 길이가 블록 크기의 배수가 아님', 'Longueur du chiffré non multiple de la taille de bloc', 'Chiffretextlänge kein Vielfaches der Blockgröße', 'Длина шифртекста не кратна размеру блока'],
    'err.unkmode':       ['未知模式: ', '未知模式: ', 'Unknown mode: ', '未知モード: ', '알 수 없는 모드: ', 'Mode inconnu : ', 'Unbekannter Modus: ', 'Неизвестный режим: '],
    'err.unkpad':        ['未知填充: ', '未知填充: ', 'Unknown padding: ', '未知パディング: ', '알 수 없는 패딩: ', 'Rembourrage inconnu : ', 'Unbekanntes Padding: ', 'Неизвестное дополнение: '],
    'err.needpub':       ['请输入公钥 PEM', '請輸入公鑰 PEM', 'Enter the public key PEM', '公開鍵 PEM を入力', '공개키 PEM 입력', 'Saisir la clé publique PEM', 'Öffentlichen Schlüssel (PEM) eingeben', 'Введите открытый ключ PEM'],
    'err.needpriv':      ['请输入私钥 PEM', '請輸入私鑰 PEM', 'Enter the private key PEM', '秘密鍵 PEM を入力', '개인키 PEM 입력', 'Saisir la clé privée PEM', 'Privaten Schlüssel (PEM) eingeben', 'Введите закрытый ключ PEM'],
    'err.needsig':       ['请填签名', '請填簽名', 'Signature required', '署名を入力', '서명 입력 필요', 'Signature requise', 'Signatur erforderlich', 'Требуется подпись'],
    'err.nopadlen':      ['无填充模式下，数据长度必须是块大小 ', '無填充模式下，資料長度必須是區塊大小 ', 'With no padding, data length must be a multiple of block size ', 'パディングなしでは、データ長はブロック長 ', '패딩 없음 모드에서 데이터 길이는 블록 크기 ', 'Sans rembourrage, la longueur doit être multiple de ', 'Ohne Padding muss die Länge ein Vielfaches von ', 'Без дополнения длина должна быть кратна '],
    'err.scripterr':     ['脚本错误：', '腳本錯誤：', 'Script error: ', 'スクリプトエラー：', '스크립트 오류: ', 'Erreur de script : ', 'Skriptfehler: ', 'Ошибка скрипта: '],
    'err.asynerr':       ['异步错误：', '非同步錯誤：', 'Async error: ', '非同期エラー：', '비동기 오류: ', 'Erreur asynchrone : ', 'Asynchroner Fehler: ', 'Асинхронная ошибка: '],
    'err.nonce.len':        ['{mode} 的 nonce 必须为 {n} 字节（{h} 位 Hex）', '{mode} 的 nonce 必須為 {n} 位元組（{h} 位 Hex）', '{mode} nonce must be {n} bytes ({h} hex digits)', '{mode} の nonce は {n} バイト（{h} 桁の Hex）でなければなりません', '{mode} nonce는 {n}바이트({h}자리 Hex)여야 합니다', 'Le nonce {mode} doit faire {n} octets ({h} chiffres hex)', '{mode}-Nonce muss {n} Bytes ({h} Hex-Zeichen) lang sein', 'Nonce для {mode} должен быть {n} байт ({h} hex-символов)'],
    'err.iv.len':        ['{mode} 的 IV 必须为 {n} 字节（{h} 位 Hex）', '{mode} 的 IV 必須為 {n} 位元組（{h} 位 Hex）', '{mode} IV must be {n} bytes ({h} hex digits)', '{mode} の IV は {n} バイト（{h} 桁の Hex）でなければなりません', '{mode} IV는 {n}바이트({h}자리 Hex)여야 합니다', 'L\'IV {mode} doit faire {n} octets ({h} chiffres hex)', '{mode}-IV muss {n} Bytes ({h} Hex-Zeichen) lang sein', 'IV для {mode} должен быть {n} байт ({h} hex-символов)'],
    'err.iv.lenb':        ['{mode} 的 IV 必须为 {n} 字节', '{mode} 的 IV 必須為 {n} 位元組', '{mode} IV must be {n} bytes', '{mode} の IV は {n} バイトでなければなりません', '{mode} IV는 {n}바이트여야 합니다', 'L\'IV {mode} doit faire {n} octets', '{mode}-IV muss {n} Bytes lang sein', 'IV для {mode} должен быть {n} байт'],
    'err.ct.short':        ['{mode} 密文长度不足（需 nonce + 密文 + {t} 字节标签）', '{mode} 密文長度不足（需 nonce + 密文 + {t} 位元組標籤）', '{mode} ciphertext too short (needs nonce + ciphertext + {t}-byte tag)', '{mode} の暗号文が短すぎます（nonce + 暗号文 + {t} バイトのタグが必要）', '{mode} 암호문이 너무 짧습니다(nonce + 암호문 + {t}바이트 태그 필요)', 'Chiffré {mode} trop court (nonce + chiffré + étiquette de {t} octets requis)', '{mode}-Chiffretext zu kurz (Nonce + Chiffretext + {t}-Byte-Tag nötig)', 'Шифртекст {mode} слишком короткий (нужны nonce + шифртекст + тег {t} байт)'],
    'err.need.iv':        ['{mode} 解密必须提供 IV', '{mode} 解密必須提供 IV', '{mode} decryption requires an IV', '{mode} の復号には IV が必要です', '{mode} 복호화에는 IV가 필요합니다', 'Le déchiffrement {mode} exige un IV', '{mode}-Entschlüsselung benötigt einen IV', 'Для расшифрования {mode} требуется IV'],
    'err.need.tweak':        ['{mode} 解密必须提供 tweak（填在 IV 框）', '{mode} 解密必須提供 tweak（填在 IV 欄）', '{mode} decryption requires a tweak (enter it in the IV field)', '{mode} の復号には tweak が必要です（IV 欄に入力）', '{mode} 복호화에는 tweak가 필요합니다(IV 필드 입력)', 'Le déchiffrement {mode} exige un tweak (à saisir dans le champ IV)', '{mode}-Entschlüsselung benötigt einen Tweak (im IV-Feld eintragen)', 'Для расшифрования {mode} требуется tweak (укажите в поле IV)'],
    'err.need.ivn':        ['{mode} 解密必须提供 IV（{n} 字节，填在 IV 框）', '{mode} 解密必須提供 IV（{n} 位元組，填在 IV 欄）', '{mode} decryption requires an IV ({n} bytes, enter it in the IV field)', '{mode} の復号には IV（{n} バイト）が必要です（IV 欄に入力）', '{mode} 복호화에는 IV({n}바이트)가 필요합니다(IV 필드 입력)', 'Le déchiffrement {mode} exige un IV ({n} octets, à saisir dans le champ IV)', '{mode}-Entschlüsselung benötigt einen IV ({n} Bytes, im IV-Feld eintragen)', 'Для расшифрования {mode} требуется IV ({n} байт, укажите в поле IV)'],
    'err.ct.min':        ['{mode} 密文至少需要 {n} 字节', '{mode} 密文至少需要 {n} 位元組', '{mode} ciphertext needs at least {n} bytes', '{mode} の暗号文は少なくとも {n} バイト必要です', '{mode} 암호문은 최소 {n}바이트 필요합니다', 'Le chiffré {mode} nécessite au moins {n} octets', '{mode}-Chiffretext benötigt mindestens {n} Bytes', 'Шифртекст {mode} требует минимум {n} байт'],
    'err.pt.min':        ['{mode} 明文至少需要 {n} 字节', '{mode} 明文至少需要 {n} 位元組', '{mode} plaintext needs at least {n} bytes', '{mode} の平文は少なくとも {n} バイト必要です', '{mode} 평문은 최소 {n}바이트 필요합니다', 'Le clair {mode} nécessite au moins {n} octets', '{mode}-Klartext benötigt mindestens {n} Bytes', 'Открытый текст {mode} требует минимум {n} байт'],
    'err.ct.blockmul':        ['{mode} 密文长度必须是块大小 {n} 的整数倍', '{mode} 密文長度必須是區塊大小 {n} 的整數倍', '{mode} ciphertext length must be a multiple of block size {n}', '{mode} の暗号文長はブロック長 {n} の整数倍でなければなりません', '{mode} 암호문 길이는 블록 크기 {n}의 배수여야 합니다', 'La longueur du chiffré {mode} doit être un multiple de la taille de bloc {n}', '{mode}-Chiffretextlänge muss ein Vielfaches der Blockgröße {n} sein', 'Длина шифртекста {mode} должна быть кратна размеру блока {n}'],
    'err.pt.blockmul':        ['无填充模式下，数据长度必须是块大小 {n} 的整数倍', '無填充模式下，資料長度必須是區塊大小 {n} 的整數倍', 'With no padding, data length must be a multiple of block size {n}', 'パディングなしでは、データ長はブロック長 {n} の整数倍でなければなりません', '패딩 없음 모드에서 데이터 길이는 블록 크기 {n}의 배수여야 합니다', 'Sans rembourrage, la longueur doit être un multiple de la taille de bloc {n}', 'Ohne Padding muss die Länge ein Vielfaches der Blockgröße {n} sein', 'Без дополнения длина должна быть кратна размеру блока {n}'],
    'err.aesonly':        ['{mode} 模式仅支持 AES 系算法，{algo} 不适用', '{mode} 模式僅支援 AES 系演算法，{algo} 不適用', '{mode} mode supports the AES family only; {algo} is not applicable', '{mode} モードは AES 系のみ対応で、{algo} は対象外です', '{mode} 모드는 AES 계열만 지원하며 {algo}는 적용되지 않습니다', 'Le mode {mode} ne gère que la famille AES ; {algo} n\'est pas applicable', 'Modus {mode} unterstützt nur die AES-Familie; {algo} ist nicht anwendbar', 'Режим {mode} поддерживает только семейство AES; {algo} не применим'],
    'err.block128':        ['{mode} 仅支持 128 位（16 字节）块，{algo} 的块大小是 {n} 字节', '{mode} 僅支援 128 位元（16 位元組）區塊，{algo} 的區塊大小是 {n} 位元組', '{mode} supports 128-bit (16-byte) blocks only; {algo} has a block size of {n} bytes', '{mode} は 128 ビット（16 バイト）ブロックのみ対応で、{algo} のブロック長は {n} バイトです', '{mode}는 128비트(16바이트) 블록만 지원하며 {algo}의 블록 크기는 {n}바이트입니다', '{mode} ne gère que les blocs de 128 bits (16 octets) ; {algo} a une taille de bloc de {n} octets', '{mode} unterstützt nur 128-Bit-Blöcke (16 Bytes); {algo} hat eine Blockgröße von {n} Bytes', '{mode} поддерживает только 128-битные блоки (16 байт); размер блока {algo} — {n} байт'],
    'err.block128b':        ['{mode} 仅支持 128 位块', '{mode} 僅支援 128 位元區塊', '{mode} supports 128-bit blocks only', '{mode} は 128 ビットブロックのみ対応です', '{mode}는 128비트 블록만 지원합니다', '{mode} ne gère que les blocs de 128 bits', '{mode} unterstützt nur 128-Bit-Blöcke', '{mode} поддерживает только 128-битные блоки'],
    'err.ige.iv':        ['{mode} 的 IV 必须为 {n} 字节（{h} 位 Hex）：前 {a} 字节是明文反馈初值，后 {b} 字节是密文反馈初值', '{mode} 的 IV 必須為 {n} 位元組（{h} 位 Hex）：前 {a} 位元組是明文回饋初值，後 {b} 位元組是密文回饋初值', '{mode} IV must be {n} bytes ({h} hex digits): first {a} bytes for plaintext feedback, last {b} for ciphertext feedback', '{mode} の IV は {n} バイト（{h} 桁の Hex）：先頭 {a} バイトが平文フィードバック初期値、末尾 {b} バイトが暗号文フィードバック初期値', '{mode} IV는 {n}바이트({h}자리 Hex): 앞 {a}바이트는 평문 피드백 초기값, 뒤 {b}바이트는 암호문 피드백 초기값', 'L\'IV {mode} doit faire {n} octets ({h} chiffres hex) : les {a} premiers pour le retour en clair, les {b} derniers pour le retour chiffré', '{mode}-IV muss {n} Bytes ({h} Hex-Zeichen) sein: erste {a} Bytes Klartext-Rückführung, letzte {b} Chiffretext-Rückführung', 'IV для {mode} должен быть {n} байт ({h} hex-символов): первые {a} байт — начальное значение обратной связи по открытому тексту, последние {b} — по шифртексту'],
    'err.biige.iv':        ['{mode} 的 IV 必须为 {n} 字节（{h} 位 Hex）：前 {a} 字节是 ivec1，后 {b} 字节是 ivec2', '{mode} 的 IV 必須為 {n} 位元組（{h} 位 Hex）：前 {a} 位元組是 ivec1，後 {b} 位元組是 ivec2', '{mode} IV must be {n} bytes ({h} hex digits): first {a} bytes are ivec1, last {b} are ivec2', '{mode} の IV は {n} バイト（{h} 桁の Hex）：先頭 {a} バイトが ivec1、末尾 {b} バイトが ivec2', '{mode} IV는 {n}바이트({h}자리 Hex): 앞 {a}바이트는 ivec1, 뒤 {b}바이트는 ivec2', 'L\'IV {mode} doit faire {n} octets ({h} chiffres hex) : les {a} premiers sont ivec1, les {b} derniers ivec2', '{mode}-IV muss {n} Bytes ({h} Hex-Zeichen) sein: erste {a} Bytes ivec1, letzte {b} ivec2', 'IV для {mode} должен быть {n} байт ({h} hex-символов): первые {a} байт — ivec1, последние {b} — ivec2'],
    'err.hexonly':        ['{what}必须是 Hex（0-9a-f），当前含非十六进制字符', '{what}必須是 Hex（0-9a-f），目前含非十六進位字元', '{what} must be hex (0-9a-f); non-hex characters found', '{what}は Hex（0-9a-f）でなければなりません（16 進以外の文字が含まれています）', '{what}는 Hex(0-9a-f)여야 합니다(16진수가 아닌 문자 포함)', '{what} doit être en hexadécimal (0-9a-f) ; caractères non hexadécimaux trouvés', '{what} muss hexadezimal sein (0-9a-f); es wurden Nicht-Hex-Zeichen gefunden', '{what} должен быть в hex (0-9a-f); обнаружены не-hex символы'],
    'err.lenneed':        ['{what}需 {n} 字节（{h} 位 Hex），当前 {cur} 字节', '{what}需 {n} 位元組（{h} 位 Hex），目前 {cur} 位元組', '{what} needs {n} bytes ({h} hex digits); got {cur}', '{what}は {n} バイト（{h} 桁の Hex）必要です（現在 {cur} バイト）', '{what}는 {n}바이트({h}자리 Hex) 필요(현재 {cur}바이트)', '{what} nécessite {n} octets ({h} chiffres hex) ; reçu {cur}', '{what} benötigt {n} Bytes ({h} Hex-Zeichen); erhalten: {cur}', '{what} требует {n} байт ({h} hex-символов); получено {cur}'],
    'err.badchar':        ['非法的 {codec} 字符: {c}', '非法的 {codec} 字元: {c}', 'Invalid {codec} character: {c}', '不正な {codec} 文字: {c}', '잘못된 {codec} 문자: {c}', 'Caractère {codec} invalide : {c}', 'Ungültiges {codec}-Zeichen: {c}', 'Недопустимый символ {codec}: {c}'],
    'err.ccm.tag':        ['CCM 的标签长度只能是 4/6/8/10/12/14/16 字节（RFC 3610 规定偶数），当前是 {n} 字节', 'CCM 的標籤長度只能是 4/6/8/10/12/14/16 位元組（RFC 3610 規定偶數），目前是 {n} 位元組', 'CCM tag length must be 4/6/8/10/12/14/16 bytes (RFC 3610 requires even values); got {n}', 'CCM のタグ長は 4/6/8/10/12/14/16 バイトのみ（RFC 3610 は偶数を規定）、現在 {n} バイト', 'CCM 태그 길이는 4/6/8/10/12/14/16바이트만 가능(RFC 3610은 짝수 규정), 현재 {n}바이트', 'La longueur d\'étiquette CCM doit être 4/6/8/10/12/14/16 octets (RFC 3610 exige des valeurs paires) ; reçu {n}', 'CCM-Taglänge muss 4/6/8/10/12/14/16 Bytes sein (RFC 3610 verlangt gerade Werte); erhalten: {n}', 'Длина тега CCM должна быть 4/6/8/10/12/14/16 байт (RFC 3610 требует чётных значений); получено {n}'],
    'err.ccm.empty':        ['CCM 明文不能为空', 'CCM 明文不能為空', 'CCM plaintext cannot be empty', 'CCM の平文は空にできません', 'CCM 평문은 비울 수 없습니다', 'Le clair CCM ne peut pas être vide', 'CCM-Klartext darf nicht leer sein', 'Открытый текст CCM не может быть пустым'],
    'err.gcmsiv.key':        ['GCM-SIV 只支持 AES-128 / AES-256（16 或 32 字节密钥），当前密钥 {n} 字节', 'GCM-SIV 只支援 AES-128 / AES-256（16 或 32 位元組金鑰），目前金鑰 {n} 位元組', 'GCM-SIV supports AES-128 / AES-256 only (16 or 32-byte key); got {n} bytes', 'GCM-SIV は AES-128 / AES-256（16 または 32 バイト鍵）のみ対応、現在 {n} バイト', 'GCM-SIV는 AES-128/AES-256(16 또는 32바이트 키)만 지원, 현재 {n}바이트', 'GCM-SIV ne gère que AES-128 / AES-256 (clé de 16 ou 32 octets) ; reçu {n} octets', 'GCM-SIV unterstützt nur AES-128 / AES-256 (16 oder 32 Byte Schlüssel); erhalten: {n} Bytes', 'GCM-SIV поддерживает только AES-128 / AES-256 (ключ 16 или 32 байт); получено {n} байт'],
    'err.siv.short':        ['SIV 密文长度不足（需 16 字节 V + 密文）', 'SIV 密文長度不足（需 16 位元組 V + 密文）', 'SIV ciphertext too short (needs 16-byte V + ciphertext)', 'SIV の暗号文が短すぎます（16 バイトの V + 暗号文が必要）', 'SIV 암호문이 너무 짧습니다(16바이트 V + 암호문 필요)', 'Chiffré SIV trop court (V de 16 octets + chiffré requis)', 'SIV-Chiffretext zu kurz (16-Byte V + Chiffretext nötig)', 'Шифртекст SIV слишком короткий (нужны 16-байтовый V + шифртекст)'],
    'err.tweak16':        ['{mode} 的 tweak 必须为 16 字节（32 位 Hex）', '{mode} 的 tweak 必須為 16 位元組（32 位 Hex）', '{mode} tweak must be 16 bytes (32 hex digits)', '{mode} の tweak は 16 バイト（32 桁の Hex）でなければなりません', '{mode} tweak는 16바이트(32자리 Hex)여야 합니다', 'Le tweak {mode} doit faire 16 octets (32 chiffres hex)', '{mode}-Tweak muss 16 Bytes (32 Hex-Zeichen) lang sein', 'Tweak для {mode} должен быть 16 байт (32 hex-символа)'],
    'err.enconly':        ['「{algo}」只有加密操作，请点「加密」按钮', '「{algo}」只有加密操作，請點「加密」按鈕', '"{algo}" supports encryption only — click the Encrypt button', '「{algo}」は暗号化のみ対応です。「暗号化」ボタンを押してください', '「{algo}」는 암호화만 지원합니다. 「암호화」버튼을 누르세요', '"{algo}" ne gère que le chiffrement — cliquez sur le bouton Chiffrer', '"{algo}" unterstützt nur Verschlüsselung — klicken Sie auf Verschlüsseln', '«{algo}» поддерживает только шифрование — нажмите кнопку «Зашифровать»'],
    'err.deconly':        ['「{algo}」只有解密操作，请点「解密」按钮', '「{algo}」只有解密操作，請點「解密」按鈕', '"{algo}" supports decryption only — click the Decrypt button', '「{algo}」は復号のみ対応です。「復号」ボタンを押してください', '「{algo}」는 복호화만 지원합니다. 「복호화」버튼을 누르세요', '"{algo}" ne gère que le déchiffrement — cliquez sur le bouton Déchiffrer', '"{algo}" unterstützt nur Entschlüsselung — klicken Sie auf Entschlüsseln', '«{algo}» поддерживает только расшифрование — нажмите кнопку «Расшифровать»'],
    'err.nodec.hash':        ['单向哈希不支持解密', '單向雜湊不支援解密', 'Hash functions do not support decryption', '一方向ハッシュは復号に対応していません', '단방향 해시는 복호화를 지원하지 않습니다', 'Les fonctions de hachage ne supportent pas le déchiffrement', 'Hashfunktionen unterstützen keine Entschlüsselung', 'Хеш-функции не поддерживают расшифрование'],
    'err.kernel.miss':        ['「{algo}」分组密码内核缺失（makeBlockFn 不是函数）', '「{algo}」區塊密碼核心缺失（makeBlockFn 不是函式）', '"{algo}" block cipher kernel is missing (makeBlockFn is not a function)', '「{algo}」のブロック暗号カーネルがありません（makeBlockFn が関数でない）', '「{algo}」블록 암호 커널이 없습니다(makeBlockFn이 함수가 아님)', 'Le noyau de chiffrement par blocs "{algo}" est manquant (makeBlockFn n\'est pas une fonction)', 'Blockchiffre-Kernel für "{algo}" fehlt (makeBlockFn ist keine Funktion)', 'Отсутствует ядро блочного шифра «{algo}» (makeBlockFn не является функцией)'],
    'err.json.noct':        ['JSON 容器缺少 ct 字段', 'JSON 容器缺少 ct 欄位', 'JSON container is missing the ct field', 'JSON コンテナに ct フィールドがありません', 'JSON 컨테이너에 ct 필드가 없습니다', 'Le conteneur JSON n\'a pas de champ ct', 'JSON-Container hat kein ct-Feld', 'В JSON-контейнере отсутствует поле ct'],
    'err.ct.keymismatch':        ['密文长度与密钥不匹配', '密文長度與金鑰不匹配', 'Ciphertext length does not match the key', '暗号文長が鍵と一致しません', '암호문 길이가 키와 일치하지 않습니다', 'La longueur du chiffré ne correspond pas à la clé', 'Chiffretextlänge passt nicht zum Schlüssel', 'Длина шифртекста не соответствует ключу'],
    'err.rsa.short':        ['RSA 密钥长度不足', 'RSA 金鑰長度不足', 'RSA key length is insufficient', 'RSA 鍵の長さが不足しています', 'RSA 키 길이가 부족합니다', 'La longueur de la clé RSA est insuffisante', 'RSA-Schlüssellänge ist unzureichend', 'Длина ключа RSA недостаточна'],
    'err.shift.num':        ['请输入有效的移位数', '請輸入有效的移位數', 'Enter a valid shift value', '有効なシフト数を入力してください', '유효한 시프트 값을 입력하세요', 'Saisir une valeur de décalage valide', 'Gültigen Verschiebungswert eingeben', 'Введите корректное значение сдвига'],
    'err.pem.armor':        ['PEM 装甲格式不正确：应有 -----BEGIN CIPHER----- / -----END CIPHER----- 两行', 'PEM 裝甲格式不正確：應有 -----BEGIN CIPHER----- / -----END CIPHER----- 兩行', 'Invalid PEM armor: expected -----BEGIN CIPHER----- / -----END CIPHER----- lines', 'PEM 装甲形式が不正です：-----BEGIN CIPHER----- / -----END CIPHER----- の 2 行が必要です', 'PEM 아머 형식이 잘못되었습니다: -----BEGIN CIPHER----- / -----END CIPHER----- 두 줄 필요', 'Armure PEM invalide : attendu les lignes -----BEGIN CIPHER----- / -----END CIPHER-----', 'Ungültige PEM-Armierung: erwartet -----BEGIN CIPHER----- / -----END CIPHER-----', 'Неверная PEM-обёртка: ожидаются строки -----BEGIN CIPHER----- / -----END CIPHER-----'],
    'err.noiv.head':        ['未提供 IV：当前密文不含 IV 头（长度不足），请把加密时生成的 IV 填入 IV 框', '未提供 IV：目前密文不含 IV 標頭（長度不足），請把加密時產生的 IV 填入 IV 欄', 'No IV provided: the ciphertext has no IV header (too short). Enter the IV generated during encryption into the IV field', 'IV がありません：この暗号文には IV ヘッダがありません（長さ不足）。暗号化時に生成された IV を IV 欄に入力してください', 'IV가 없습니다: 이 암호문에는 IV 헤더가 없습니다(길이 부족). 암호화 시 생성된 IV를 IV 필드에 입력하세요', 'Aucun IV fourni : le chiffré n\'a pas d\'en-tête IV (trop court). Saisissez l\'IV généré lors du chiffrement dans le champ IV', 'Kein IV angegeben: der Chiffretext hat keine IV-Kopfzeile (zu kurz). Tragen Sie den bei der Verschlüsselung erzeugten IV ins IV-Feld ein', 'IV не указан: в шифртексте нет IV-заголовка (слишком короткий). Введите IV, созданный при шифровании, в поле IV'],
    'err.ivcipher.short':        ['IV‖密文 容器的数据过短（至少要 IV + 1 个块）', 'IV‖密文 容器的資料過短（至少要 IV + 1 個區塊）', 'IV‖ciphertext container data too short (needs at least IV + 1 block)', 'IV‖暗号文 コンテナのデータが短すぎます（少なくとも IV + 1 ブロック必要）', 'IV‖암호문 컨테이너 데이터가 너무 짧습니다(최소 IV + 1블록 필요)', 'Données du conteneur IV‖chiffré trop courtes (au moins IV + 1 bloc requis)', 'IV‖Chiffretext-Container-Daten zu kurz (mindestens IV + 1 Block nötig)', 'Данные контейнера IV‖шифртекст слишком короткие (нужно минимум IV + 1 блок)'],
    'err.ivcipher.noecb':        ['IV‖密文 容器需要 IV，ECB 模式不适用', 'IV‖密文 容器需要 IV，ECB 模式不適用', 'IV‖ciphertext container requires an IV; ECB mode is not applicable', 'IV‖暗号文 コンテナには IV が必要で、ECB モードは対象外です', 'IV‖암호문 컨테이너에는 IV가 필요하며 ECB 모드는 적용되지 않습니다', 'Le conteneur IV‖chiffré exige un IV ; le mode ECB n\'est pas applicable', 'IV‖Chiffretext-Container benötigt einen IV; ECB-Modus ist nicht anwendbar', 'Контейнеру IV‖шифртекст требуется IV; режим ECB не применим'],
    'err.gcm.noncepre':        ['密文需含 12 字节 nonce 前缀，或在 Nonce 框里指定', '密文需含 12 位元組 nonce 前綴，或在 Nonce 欄裡指定', 'Ciphertext must contain a 12-byte nonce prefix, or specify one in the Nonce field', '暗号文には 12 バイトの nonce プレフィックスが必要です。または Nonce 欄に指定してください', '암호문에는 12바이트 nonce 접두사가 필요합니다. 또는 Nonce 필드에 지정하세요', 'Le chiffré doit contenir un préfixe nonce de 12 octets, ou en spécifier un dans le champ Nonce', 'Chiffretext muss ein 12-Byte-Nonce-Präfix enthalten, oder im Nonce-Feld angeben', 'Шифртекст должен содержать 12-байтовый префикс nonce, либо укажите его в поле Nonce'],
    'err.need.key':        ['请填写密钥', '請填寫金鑰', 'Enter a key', '鍵を入力してください', '키를 입력하세요', 'Saisir une clé', 'Schlüssel eingeben', 'Введите ключ'],
    'err.need.param':        ['请填写：', '請填寫：', 'Please fill in: ', '入力してください：', '입력하세요: ', 'Veuillez remplir : ', 'Bitte ausfüllen: ', 'Пожалуйста, заполните: '],
    'err.need.sigparam':        ['请在参数栏填入签名', '請在參數欄填入簽章', 'Enter the signature in the parameter field', 'パラメータ欄に署名を入力してください', '파라미터 필드에 서명을 입력하세요', 'Saisir la signature dans le champ de paramètre', 'Signatur im Parameterfeld eintragen', 'Введите подпись в поле параметров'],
    'desc.chacha20.nonce': ['ChaCha20 的 Nonce', 'ChaCha20 的 Nonce', 'ChaCha20 nonce', 'ChaCha20 の Nonce', 'ChaCha20 nonce', 'Nonce ChaCha20', 'ChaCha20-Nonce', 'Nonce ChaCha20'],
    'err.key2':            ['第二密钥', '第二金鑰', 'Second key', '第二鍵', '두 번째 키', 'Seconde clé', 'Zweiter Schlüssel', 'Второй ключ'],
    'err.need.content':        ['请输入要解密的内容', '請輸入要解密的內容', 'Enter the content to decrypt', '復号する内容を入力してください', '복호화할 내용을 입력하세요', 'Saisir le contenu à déchiffrer', 'Zu entschlüsselnden Inhalt eingeben', 'Введите содержимое для расшифрования'],
    'err.need.keypair':        ['需要己方私钥与对方公钥', '需要己方私鑰與對方公鑰', 'Requires your private key and the peer\'s public key', '自身の秘密鍵と相手の公開鍵が必要です', '자신의 개인키와 상대의 공개키가 필요합니다', 'Nécessite votre clé privée et la clé publique du pair', 'Erfordert Ihren privaten und den öffentlichen Schlüssel des Gegenübers', 'Требуется ваш закрытый ключ и открытый ключ собеседника'],
    'err.need.paramlabel':        ['请填写参数：', '請填寫參數：', 'Please fill in the parameter: ', 'パラメータを入力してください：', '파라미터를 입력하세요: ', 'Veuillez remplir le paramètre : ', 'Bitte Parameter ausfüllen: ', 'Пожалуйста, заполните параметр: '],
    'err.badbin':        ['非法二进制:{c}', '非法二進位:{c}', 'Invalid binary: {c}', '不正な 2 進数: {c}', '잘못된 2진수: {c}', 'Binaire invalide : {c}', 'Ungültige Binärzahl: {c}', 'Недопустимое двоичное значение: {c}'],
    'err.badoct':        ['非法八进制:{c}', '非法八進位:{c}', 'Invalid octal: {c}', '不正な 8 進数: {c}', '잘못된 8진수: {c}', 'Octal invalide : {c}', 'Ungültige Oktalzahl: {c}', 'Недопустимое восьмеричное значение: {c}'],
    'err.noiv.append':        ['。当前 IV 框为空：新加密的密文不含 IV，请把加密时自动生成的 IV 填回 IV 框', '。目前 IV 欄為空：新加密的密文不含 IV，請把加密時自動產生的 IV 填回 IV 欄', '. The IV field is empty: freshly encrypted ciphertext carries no IV — paste the auto-generated IV back into the IV field', '。IV 欄が空です：新しく暗号化した暗号文には IV が含まれません。自動生成された IV を IV 欄に戻してください', '. IV 필드가 비어 있습니다: 새로 암호화한 암호문에는 IV가 없습니다. 자동 생성된 IV를 IV 필드에 다시 입력하세요', '. Le champ IV est vide : un chiffré fraîchement produit ne contient pas d\'IV — recollez l\'IV généré automatiquement dans le champ IV', '. Das IV-Feld ist leer: frisch verschlüsselter Chiffretext enthält keinen IV — fügen Sie den automatisch erzeugten IV wieder ins IV-Feld ein', '. Поле IV пусто: свежезашифрованный текст не содержит IV — верните автоматически созданный IV в поле IV'],
    /* ---- kdfcost（KDF 成本参数标签，随所选 KDF 动态切换） ---- */
    'kdfcost.kdf2':      ['PBKDF2 迭代次数（建议 ≥ 210000）', 'PBKDF2 迭代次數（建議 ≥ 210000）', 'PBKDF2 iterations (recommend ≥ 210000)', 'PBKDF2 反復回数（推奨 ≥ 210000）', 'PBKDF2 반복 횟수(권장 ≥ 210000)', 'Itérations PBKDF2 (recommandé ≥ 210000)', 'PBKDF2-Iterationen (empfohlen ≥ 210000)', 'Итерации PBKDF2 (рекомендуется ≥ 210000)'],
    'kdfcost.argon2id':  ['Argon2id 轮数 t（1~10，默认 2）', 'Argon2id 輪數 t（1~10，預設 2）', 'Argon2id rounds t (1–10, default 2)', 'Argon2id ラウンド t（1~10、既定 2）', 'Argon2id 라운드 t(1~10, 기본 2)', 'Tours Argon2id t (1–10, défaut 2)', 'Argon2id Runden t (1–10, Standard 2)', 'Раунды Argon2id t (1–10, по умолч. 2)'],
    'kdfcost.argon2i':   ['Argon2i 轮数 t（1~10，默认 2）', 'Argon2i 輪數 t（1~10，預設 2）', 'Argon2i rounds t (1–10, default 2)', 'Argon2i ラウンド t（1~10、既定 2）', 'Argon2i 라운드 t(1~10, 기본 2)', 'Tours Argon2i t (1–10, défaut 2)', 'Argon2i Runden t (1–10, Standard 2)', 'Раунды Argon2i t (1–10, по умолч. 2)'],
    'kdfcost.argon2d':   ['Argon2d 轮数 t（1~10，默认 2）', 'Argon2d 輪數 t（1~10，預設 2）', 'Argon2d rounds t (1–10, default 2)', 'Argon2d ラウンド t（1~10、既定 2）', 'Argon2d 라운드 t(1~10, 기본 2)', 'Tours Argon2d t (1–10, défaut 2)', 'Argon2d Runden t (1–10, Standard 2)', 'Раунды Argon2d t (1–10, по умолч. 2)'],
    'kdfcost.scrypt':    ['scrypt 的 N 指数（10~20，默认 14）', 'scrypt 的 N 指數（10~20，預設 14）', 'scrypt N exponent (10–20, default 14)', 'scrypt の N 指数（10~20、既定 14）', 'scrypt N 지수(10~20, 기본 14)', 'Exposant N scrypt (10–20, défaut 14)', 'scrypt N-Exponent (10–20, Standard 14)', 'Показатель N scrypt (10–20, по умолч. 14)'],
    'kdfcost.bcrypt':    ['bcrypt cost（4~18，默认 10）', 'bcrypt cost（4~18，預設 10）', 'bcrypt cost (4–18, default 10)', 'bcrypt cost（4~18、既定 10）', 'bcrypt cost(4~18, 기본 10)', 'Coût bcrypt (4–18, défaut 10)', 'bcrypt cost (4–18, Standard 10)', 'bcrypt cost (4–18, по умолч. 10)'],
    'kdfcost.pbkdf1':    ['PBKDF1 迭代次数（1~1000000，默认 1000；最多派生 20 字节）', 'PBKDF1 迭代次數（1~1000000，預設 1000；最多派生 20 位元組）', 'PBKDF1 iterations (1–1000000, default 1000; max 20 bytes derived)', 'PBKDF1 反復回数（1~1000000、既定 1000；派生は最大 20 バイト）', 'PBKDF1 반복(1~1000000, 기본 1000; 최대 20바이트 파생)', 'Itérations PBKDF1 (1–1000000, défaut 1000 ; max 20 octets)', 'PBKDF1-Iterationen (1–1000000, Standard 1000; max 20 Bytes)', 'Итерации PBKDF1 (1–1000000, по умолч. 1000; макс. 20 байт)'],
    'kdfcost.bcryptpbkdf':['bcrypt-pbkdf 轮数（1~64，默认 16）', 'bcrypt-pbkdf 輪數（1~64，預設 16）', 'bcrypt-pbkdf rounds (1–64, default 16)', 'bcrypt-pbkdf ラウンド（1~64、既定 16）', 'bcrypt-pbkdf 라운드(1~64, 기본 16)', 'Tours bcrypt-pbkdf (1–64, défaut 16)', 'bcrypt-pbkdf Runden (1–64, Standard 16)', 'Раунды bcrypt-pbkdf (1–64, по умолч. 16)'],
    'ver.pick':          ['请选择算法', '請選擇演算法', 'Select an algorithm', 'アルゴリズムを選択', '알고리즘 선택', 'Choisir un algorithme', 'Algorithmus wählen', 'Выберите алгоритм'],
    'ver.rule':          ['删条目或改语义升主版本，新增算法升次版本，修 bug 与优化升修订号；版本号不含任何代号。', '刪條目或改語義升主版本，新增演算法升次版本，修 bug 與最佳化升修訂號；版本號不含任何代號。', 'Removing entries or changing semantics bumps major; adding algorithms bumps minor; bug fixes and optimizations bump patch. No codenames.', '条目削除や意味変更はメジャー、アルゴリズム追加はマイナー、バグ修正・最適化はパッチ。コードネームなし。', '항목 삭제/의미 변경은 주 버전, 알고리즘 추가는 부 버전, 버그 수정/최적화는 수정 버전. 코드네임 없음.', 'Supprimer ou modifier la sémantique = majeur; ajouter un algo = mineur; correctifs = patch. Aucun nom de code.', 'Entfernen/Ändern = Major; neue Algorithmen = Minor; Bugfixes = Patch. Keine Codenamen.', 'Удаление или смена семантики = мажор; новые алгоритмы = минор; исправления = патч. Без кодовых имён.'],
    'ver.self':          ['内置自检', '內建自檢', 'Self-tests', '自己診断', '자체 점검', 'Auto-tests', 'Selbsttests', 'Самопроверки'],
    'ver.semver':        ['版本号遵循 SemVer（主版本.次版本.修订号），规则见随包的 版本规则.md：', '版本號遵循 SemVer（主版本.次版本.修訂號），規則見隨包的 版本規則.md：', 'Version follows SemVer (major.minor.patch); see 版本规则.md:', 'バージョンは SemVer 準拠（メジャー.マイナー.パッチ）、詳細は同梱の 版本規則.md：', '버전은 SemVer 준수(주.부.수정), 규칙은 동봉된 版本规则.md 참조:', 'La version suit SemVer (majeur.mineur.correctif); voir 版本规则.md :', 'Version folgt SemVer (Major.Minor.Patch); siehe 版本规则.md:', 'Версия следует SemVer (мажор.минор.патч); см. 版本规则.md:'],
    'ver.stress':        ['压力测试', '壓力測試', 'Stress tests', 'ストレステスト', '스트레스 테스트', 'Tests de résistance', 'Stresstests', 'Стресс-тесты']
  };

  var STORE_KEY = 'CRYPTO_TOOLBOX_LANG';
  var DEFAULT = 'zh-CN';
  var cur = DEFAULT;
  var listeners = [];

  function valid(c) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === c) return true;
    return false;
  }

  function read() {
    try {
      var v = localStorage.getItem(STORE_KEY);
      return valid(v) ? v : DEFAULT;
    } catch (e) { return DEFAULT; }
  }

  function persist(c) {
    try { localStorage.setItem(STORE_KEY, c); } catch (e) { /* 隐私模式下忽略 */ }
  }

  function t(key) {
    var row = T[key];
    if (!row) return key;                       /* 未收录的键：原样返回，不渲染 undefined */
    var idx = indexOf(cur);
    if (idx < 0) idx = 0;
    var v = row[idx];
    if (v === undefined || v === null || v === '') v = row[0];   /* 缺译回退中文 */
    return v;
  }

  function indexOf(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return i;
    return -1;
  }

  /* 应用到 DOM：只处理标了 data-i18n / data-i18n-ph / data-i18n-title 的元素 */
  function apply(root) {
    var scope = root || document;
    each(scope, '[data-i18n]', function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (el.tagName === 'OPTION' || el.tagName === 'INPUT') { /* value 不动 */ }
      el.textContent = v;
    });
    each(scope, '[data-i18n-ph]', function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    each(scope, '[data-i18n-title]', function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    /* data-i18n-html：整段含内联标签（<b>/<code>）的静态文案。
       值全部来自本文件内置常量，不含任何用户输入，故可安全写入 innerHTML。
       注意：它替换后，段内带 id 的动态元素会被重建——页面须在 onChange 里重新填充。 */
    each(scope, '[data-i18n-html]', function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    each(scope, '[data-i18n-aria]', function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    /* 侧边栏里的 tip 文本也要跟着换 */
    each(scope, '[data-i18n-tip]', function (el) {
      el.setAttribute('data-tip', t(el.getAttribute('data-i18n-tip')));
    });
    var html = document.documentElement;
    if (html) {
      html.lang = cur;
      var d = html.getAttribute('data-lang');
      if (d !== cur) html.setAttribute('data-lang', cur);
    }
  }

  function each(scope, sel, fn) {
    var list = scope.querySelectorAll ? scope.querySelectorAll(sel) : [];
    for (var i = 0; i < list.length; i++) {
      /* data-i18n-off="1"：该元素已被「算法专属文案」接管（如 AES-256 的
         「密钥（任意字符串，SHA-256 派生 32 字节）」），通用翻译不得覆盖它，
         否则会把算法专属提示冲成泛泛的「密钥」（第 125 批踩过）。 */
      var el = list[i];
      if (el && el.getAttribute && el.getAttribute('data-i18n-off') === '1') continue;
      fn(el);
    }
  }

  function set(code) {
    if (!valid(code)) return false;
    var changed = (code !== cur);
    cur = code;
    persist(code);
    apply(document);
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](code, changed); } catch (e) { /* 单个监听失败不影响其余 */ }
    }
    return true;
  }

  function init() {
    cur = read();
    apply(document);
  }

  window.I18N = {
    LANGS: LANGS,
    t: t,
    set: set,
    get: function () { return cur; },
    apply: apply,
    init: init,
    /* 【第 154 批】安全提示（securityAudit）的多语言查询。
     * 增量表：查不到就返回中文原文 fallback，绝不渲染成 undefined。
     * 表在 Multilingual/i18n_sec.js（window.__I18N_SEC），未加载时静默回退。 */
    sec: function (key, field, fallback) {
      try {
        var T2 = (typeof window !== 'undefined') ? window.__I18N_SEC : null;
        if (!T2 || !T2[key]) return fallback;
        var row = T2[key][field];
        if (!row) return fallback;
        var idx = indexOf(cur);
        if (idx < 0) idx = 0;
        var v = row[idx];
        if (v === undefined || v === null || v === '') v = row[0];
        if (v === undefined || v === null || v === '') return fallback;
        return v;
      } catch (e) { return fallback; }
    },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); }
  };
})();
