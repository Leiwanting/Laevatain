--[[
    LaevatainSky
    作者: Laevatain (Leiwanting)
    仓库: https://github.com/Leiwanting/Laevatain
    许可: 自由使用、修改、分发

    一行加载:
    loadstring(game:HttpGet("https://raw.githubusercontent.com/Leiwanting/Laevatain/main/LaevatainSky.lua"))()
]]

local LIB_NAME    = "LaevatainSky"
local LIB_VERSION = "1.3.0"
local LIB_REPO    = "https://github.com/Leiwanting/Laevatain"
local VER_URL     = "https://raw.githubusercontent.com/Leiwanting/Laevatain/main/version.txt"

-- ============ 依赖源配置 ============
-- 加速域名（部署 AT13xe/gh 后填写，留空则直连 GitHub）
-- 例: local PROXY = "https://gh.example.com"
local PROXY = ""

local WINDUI_PATHS = {
    "https://raw.githubusercontent.com/KingScriptAE/No-sirve-nada./refs/heads/main/main.lua",
}

local function buildSources(path)
    local list = {}
    if PROXY ~= "" then
        -- gh.域名/用户名/仓库/分支/文件 形式
        table.insert(list, PROXY .. "/KingScriptAE/No-sirve-nada./main/main.lua")
        table.insert(list, PROXY .. "/https://raw.githubusercontent.com/KingScriptAE/No-sirve-nada./refs/heads/main/main.lua")
    end
    table.insert(list, path)
    return list
end

local function tryLoad(urls)
    for _, u in ipairs(urls) do
        local ok, res = pcall(function() return game:HttpGet(u) end)
        if ok and res and #res > 500 then
            local fn, err = loadstring(res)
            if fn then return fn() end
            warn("[LaevatainSky] 依赖解析失败: " .. tostring(err) .. " <- " .. u)
        end
    end
    return nil
end

local WindUI = nil
for _, base in ipairs(WINDUI_PATHS) do
    WindUI = tryLoad(buildSources(base))
    if WindUI then break end
end

if not WindUI then
    warn("[LaevatainSky] WindUI 加载失败，请检查网络或加速域名")
    return
end

WindUI:Localization({
    Enabled = true,
    Prefix = "loc:",
    DefaultLanguage = "zh-cn",
    Translations = {
        --[[["ru"] = {
            ["WINDUI_EXAMPLE"] = "WindUI ÃƒÂÃ…Â¸Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â¼ÃƒÂÃ‚ÂµÃƒâ€˜Ã¢â€šÂ¬",
            ["WELCOME"] = "ÃƒÂÃ¢â‚¬ÂÃƒÂÃ‚Â¾ÃƒÂÃ‚Â±Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â¾ ÃƒÂÃ‚Â¿ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â¶ÃƒÂÃ‚Â°ÃƒÂÃ‚Â»ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â²ÃƒÂÃ‚Â°Ãƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã…â€™ ÃƒÂÃ‚Â² WindUI!",
            ["LIB_DESC"] = "ÃƒÂÃ¢â‚¬ËœÃƒÂÃ‚Â¸ÃƒÂÃ‚Â±ÃƒÂÃ‚Â»ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â¾Ãƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚ÂµÃƒÂÃ‚ÂºÃƒÂÃ‚Â° ÃƒÂÃ‚Â´ÃƒÂÃ‚Â»Ãƒâ€˜Ã‚Â Ãƒâ€˜Ã‚ÂÃƒÂÃ‚Â¾ÃƒÂÃ‚Â·ÃƒÂÃ‚Â´ÃƒÂÃ‚Â°ÃƒÂÃ‚Â½ÃƒÂÃ‚Â¸Ãƒâ€˜Ã‚Â ÃƒÂÃ‚ÂºÃƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â°Ãƒâ€˜Ã‚ÂÃƒÂÃ‚Â¸ÃƒÂÃ‚Â²Ãƒâ€˜Ã¢â‚¬Â¹Ãƒâ€˜Ã¢â‚¬Â¦ ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â½Ãƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚ÂµÃƒâ€˜Ã¢â€šÂ¬Ãƒâ€˜Ã¢â‚¬Å¾ÃƒÂÃ‚ÂµÃƒÂÃ‚Â¹Ãƒâ€˜Ã‚ÂÃƒÂÃ‚Â¾ÃƒÂÃ‚Â²",
            ["SETTINGS"] = "ÃƒÂÃ‚ÂÃƒÂÃ‚Â°Ãƒâ€˜Ã‚ÂÃƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â¹ÃƒÂÃ‚ÂºÃƒÂÃ‚Â¸",
            ["APPEARANCE"] = "ÃƒÂÃ¢â‚¬â„¢ÃƒÂÃ‚Â½ÃƒÂÃ‚ÂµÃƒâ€˜Ã‹â€ ÃƒÂÃ‚Â½ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â¹ ÃƒÂÃ‚Â²ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â´",
            ["FEATURES"] = "ÃƒÂÃ‚Â¤Ãƒâ€˜Ã†â€™ÃƒÂÃ‚Â½ÃƒÂÃ‚ÂºÃƒâ€˜Ã¢â‚¬Â ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â½ÃƒÂÃ‚Â°ÃƒÂÃ‚Â»",
            ["UTILITIES"] = "ÃƒÂÃ‹Å“ÃƒÂÃ‚Â½Ãƒâ€˜Ã‚ÂÃƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã¢â€šÂ¬Ãƒâ€˜Ã†â€™ÃƒÂÃ‚Â¼ÃƒÂÃ‚ÂµÃƒÂÃ‚Â½Ãƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã¢â‚¬Â¹",
            ["UI_ELEMENTS"] = "UI ÃƒÂÃ‚Â­ÃƒÂÃ‚Â»ÃƒÂÃ‚ÂµÃƒÂÃ‚Â¼ÃƒÂÃ‚ÂµÃƒÂÃ‚Â½Ãƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã¢â‚¬Â¹",
            ["CONFIGURATION"] = "ÃƒÂÃ…Â¡ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â½Ãƒâ€˜Ã¢â‚¬Å¾ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â³Ãƒâ€˜Ã†â€™Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â°Ãƒâ€˜Ã¢â‚¬Â ÃƒÂÃ‚Â¸Ãƒâ€˜Ã‚Â",
            ["SAVE_CONFIG"] = "ÃƒÂÃ‚Â¡ÃƒÂÃ‚Â¾Ãƒâ€˜Ã¢â‚¬Â¦Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â°ÃƒÂÃ‚Â½ÃƒÂÃ‚Â¸Ãƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã…â€™ ÃƒÂÃ‚ÂºÃƒÂÃ‚Â¾ÃƒÂÃ‚Â½Ãƒâ€˜Ã¢â‚¬Å¾ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â³Ãƒâ€˜Ã†â€™Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â°Ãƒâ€˜Ã¢â‚¬Â ÃƒÂÃ‚Â¸Ãƒâ€˜Ã…Â½",
            ["LOAD_CONFIG"] = "ÃƒÂÃ¢â‚¬â€ÃƒÂÃ‚Â°ÃƒÂÃ‚Â³Ãƒâ€˜Ã¢â€šÂ¬Ãƒâ€˜Ã†â€™ÃƒÂÃ‚Â·ÃƒÂÃ‚Â¸Ãƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã…â€™ ÃƒÂÃ‚ÂºÃƒÂÃ‚Â¾ÃƒÂÃ‚Â½Ãƒâ€˜Ã¢â‚¬Å¾ÃƒÂÃ‚Â¸ÃƒÂÃ‚Â³Ãƒâ€˜Ã†â€™Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â°Ãƒâ€˜Ã¢â‚¬Â ÃƒÂÃ‚Â¸Ãƒâ€˜Ã…Â½",
            ["THEME_SELECT"] = "ÃƒÂÃ¢â‚¬â„¢Ãƒâ€˜Ã¢â‚¬Â¹ÃƒÂÃ‚Â±ÃƒÂÃ‚ÂµÃƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â¸Ãƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚Âµ Ãƒâ€˜Ã¢â‚¬Å¡ÃƒÂÃ‚ÂµÃƒÂÃ‚Â¼Ãƒâ€˜Ã†â€™",
            ["TRANSPARENCY"] = "ÃƒÂÃ…Â¸Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â¾ÃƒÂÃ‚Â·Ãƒâ€˜Ã¢â€šÂ¬ÃƒÂÃ‚Â°Ãƒâ€˜Ã¢â‚¬Â¡ÃƒÂÃ‚Â½ÃƒÂÃ‚Â¾Ãƒâ€˜Ã‚ÂÃƒâ€˜Ã¢â‚¬Å¡Ãƒâ€˜Ã…â€™ ÃƒÂÃ‚Â¾ÃƒÂÃ‚ÂºÃƒÂÃ‚Â½ÃƒÂÃ‚Â°"
        },--]]
        ["en"] = {
            ["WINDUI_EXAMPLE"] = "WindUI Example",
            ["WELCOME"] = "Welcome to WindUI!",
            ["LIB_DESC"] = "Beautiful UI library for Roblox",
            ["SETTINGS"] = "Settings",
            ["APPEARANCE"] = "Appearance",
            ["FEATURES"] = "Features",
            ["UTILITIES"] = "Utilities",
            ["UI_ELEMENTS"] = "UI Elements",
            ["CONFIGURATION"] = "Configuration",
            ["SAVE_CONFIG"] = "Save Configuration",
            ["LOAD_CONFIG"] = "Load Configuration",
            ["THEME_SELECT"] = "Select Theme",
            ["TRANSPARENCY"] = "Window Transparency"
},
    ["zh-cn"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "欢迎使用 LaevatainSky",
        ["LIB_DESC"] = "LaevatainSky 内部测试版",
        ["SETTINGS"] = "设置",
        ["APPEARANCE"] = "外观",
        ["FEATURES"] = "功能",
        ["UTILITIES"] = "工具",
        ["UI_ELEMENTS"] = "界面元素",
        ["CONFIGURATION"] = "配置",
        ["SAVE_CONFIG"] = "保存配置",
        ["LOAD_CONFIG"] = "读取配置",
        ["THEME_SELECT"] = "选择主题",
        ["TRANSPARENCY"] = "窗口透明度",
    },
    ["zh-tw"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "歡迎使用 LaevatainSky",
        ["LIB_DESC"] = "LaevatainSky 內部測試版",
        ["SETTINGS"] = "設定",
        ["APPEARANCE"] = "外觀",
        ["FEATURES"] = "功能",
        ["UTILITIES"] = "工具",
        ["UI_ELEMENTS"] = "介面元素",
        ["CONFIGURATION"] = "設定檔",
        ["SAVE_CONFIG"] = "儲存設定",
        ["LOAD_CONFIG"] = "讀取設定",
        ["THEME_SELECT"] = "選擇主題",
        ["TRANSPARENCY"] = "視窗透明度",
    },
    ["ja"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "LaevatainSky へようこそ",
        ["LIB_DESC"] = "LaevatainSky 内部テスト版",
        ["SETTINGS"] = "設定",
        ["APPEARANCE"] = "外観",
        ["FEATURES"] = "機能",
        ["UTILITIES"] = "ユーティリティ",
        ["UI_ELEMENTS"] = "UI要素",
        ["CONFIGURATION"] = "設定管理",
        ["SAVE_CONFIG"] = "設定を保存",
        ["LOAD_CONFIG"] = "設定を読み込む",
        ["THEME_SELECT"] = "テーマ選択",
        ["TRANSPARENCY"] = "ウィンドウの透明度",
    },
    ["ko"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "LaevatainSky에 오신 것을 환영합니다",
        ["LIB_DESC"] = "LaevatainSky 내부 테스트 버전",
        ["SETTINGS"] = "설정",
        ["APPEARANCE"] = "외형",
        ["FEATURES"] = "기능",
        ["UTILITIES"] = "도구",
        ["UI_ELEMENTS"] = "UI 요소",
        ["CONFIGURATION"] = "구성",
        ["SAVE_CONFIG"] = "설정 저장",
        ["LOAD_CONFIG"] = "설정 불러오기",
        ["THEME_SELECT"] = "테마 선택",
        ["TRANSPARENCY"] = "창 투명도",
    },
    ["ru"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "Добро пожаловать в LaevatainSky!",
        ["LIB_DESC"] = "Внутренняя тестовая версия LaevatainSky",
        ["SETTINGS"] = "Настройки",
        ["APPEARANCE"] = "Внешний вид",
        ["FEATURES"] = "Функции",
        ["UTILITIES"] = "Инструменты",
        ["UI_ELEMENTS"] = "UI Элементы",
        ["CONFIGURATION"] = "Конфигурация",
        ["SAVE_CONFIG"] = "Сохранить конфигурацию",
        ["LOAD_CONFIG"] = "Загрузить конфигурацию",
        ["THEME_SELECT"] = "Выберите тему",
        ["TRANSPARENCY"] = "Прозрачность окна",
    },
    ["es"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "¡Bienvenido a LaevatainSky!",
        ["LIB_DESC"] = "Versión de prueba interna de LaevatainSky",
        ["SETTINGS"] = "Ajustes",
        ["APPEARANCE"] = "Apariencia",
        ["FEATURES"] = "Funciones",
        ["UTILITIES"] = "Utilidades",
        ["UI_ELEMENTS"] = "Elementos de UI",
        ["CONFIGURATION"] = "Configuración",
        ["SAVE_CONFIG"] = "Guardar configuración",
        ["LOAD_CONFIG"] = "Cargar configuración",
        ["THEME_SELECT"] = "Seleccionar tema",
        ["TRANSPARENCY"] = "Transparencia de la ventana",
    },
    ["fr"] = {
        ["WINDUI_EXAMPLE"] = "LaevatainSky",
        ["WELCOME"] = "Bienvenue sur LaevatainSky !",
        ["LIB_DESC"] = "Version de test interne de LaevatainSky",
        ["SETTINGS"] = "Paramètres",
        ["APPEARANCE"] = "Apparence",
        ["FEATURES"] = "Fonctionnalités",
        ["UTILITIES"] = "Utilitaires",
        ["UI_ELEMENTS"] = "Éléments d'interface",
        ["CONFIGURATION"] = "Configuration",
        ["SAVE_CONFIG"] = "Enregistrer la configuration",
        ["LOAD_CONFIG"] = "Charger la configuration",
        ["THEME_SELECT"] = "Choisir un thème",
        ["TRANSPARENCY"] = "Transparence de la fenêtre",
    },
}
})

WindUI:SetLanguage("zh-cn")


-- ===================== 常用服务（提前定义） =====================
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local Camera = workspace.CurrentCamera

-- ===================== 多语言支持（8 种语言） =====================
local LANG_ORDER = { "简体中文", "繁體中文", "English", "日本語", "한국어", "Русский", "Español", "Français" }
local LANG_TABLE = {
    ["zh-cn"] = {
        ["PROFILE_TAB"] = "介绍",
        ["PROFILE_DESC"] = "脚本说明与服务器状态",
        ["PROFILE_BASIC"] = "基本信息",
        ["PROFILE_USERNAME"] = "用户名",
        ["PROFILE_DISPLAYNAME"] = "显示名",
        ["PROFILE_UID"] = "用户 ID",
        ["PROFILE_ACCOUNTAGE"] = "账号年龄",
        ["PROFILE_SERVER"] = "服务器信息",
        ["PROFILE_PLACEID"] = "场所 ID",
        ["PROFILE_JOBID"] = "服务器 ID",
        ["PROFILE_PLAYERS"] = "在线人数",
        ["PROFILE_PING"] = "网络延迟",
        ["PROFILE_FPS"] = "当前帧率",
        ["PROFILE_REFRESH"] = "刷新信息",
        ["PROFILE_VIEW"] = "查看完整档案",
        ["PROFILE_COPYUID"] = "复制用户 ID",
        ["PROFILE_COPIED"] = "已复制到剪贴板",
        ["PROFILE_DAYS"] = "天",
        ["PROFILE_UNKNOWN"] = "未知",
        ["PROFILE_GREET"] = "个人资料",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP 视觉功能",
        ["ESP_DESC"] = "方框 / 名字 / 距离 / 血量 / 追踪线",
        ["ESP_ENABLE"] = "启用 ESP",
        ["ESP_ENABLE_DESC"] = "总开关，关闭后所有绘制立即消失",
        ["ESP_DRAW"] = "绘制项",
        ["ESP_BOX"] = "人物方框",
        ["ESP_NAME"] = "玩家名字",
        ["ESP_DISTANCE"] = "距离显示",
        ["ESP_HEALTH"] = "血量条",
        ["ESP_TRACER"] = "追踪线",
        ["ESP_NAMESEC"] = "名字显示",
        ["ESP_NAMESRC"] = "名字来源",
        ["ESP_NAMESRC_DESC"] = "中文显示名乱码时改用「用户名」",
        ["ESP_FONT"] = "文字字体",
        ["ESP_FONT_DESC"] = "想显示中文可逐个试 System / Plex / Monospace",
        ["ESP_ASCII"] = "中文自动回退",
        ["ESP_ASCII_DESC"] = "显示名含中文且字体不支持时，自动改用用户名",
        ["ESP_FILTER"] = "过滤与样式",
        ["ESP_TEAM"] = "显示队伍",
        ["ESP_TEAM_DESC"] = "开启后不绘制同队玩家",
        ["ESP_LOS"] = "仅显示可见目标",
        ["ESP_LOS_DESC"] = "开启后被墙挡住的不显示",
        ["ESP_MAXDIST"] = "最大距离",
        ["ESP_MAXDIST_DESC"] = "超出该距离不绘制",
        ["ESP_THICK"] = "线条粗细",
        ["ESP_TEXTSIZE"] = "文字大小",
        ["ESP_COLOR"] = "ESP 颜色",
        ["ESP_CLEAR"] = "清理残留绘制",
        ["ESP_CLEAR_DESC"] = "画面有卡住的框时点一下",
        ["ESP_NOTSUP_TITLE"] = "ESP 不可用",
        ["ESP_NOTSUP_MSG"] = "当前执行环境不支持 Drawing API",
        ["ESP_CLEARED"] = "已清理全部绘制对象",
        ["AIM_TAB"] = "自瞄",
        ["AIM_TITLE"] = "自瞄 Aimbot",
        ["AIM_DESC"] = "FOV 锁定 · 平滑跟随 · 支持墙体/队友过滤",
        ["AIM_ENABLE"] = "启用自瞄",
        ["AIM_ENABLE_DESC"] = "默认常开模式，无需按键即可锁定",
        ["AIM_BASIC"] = "基础设置",
        ["AIM_MODE"] = "瞄准方式",
        ["AIM_MODE_DESC"] = "CFrame 稳定；Mouse 模拟真人移动",
        ["AIM_TRIGGER"] = "触发按键",
        ["AIM_PART"] = "瞄准部位",
        ["AIM_SMOOTH"] = "平滑度",
        ["AIM_SMOOTH_DESC"] = "数值越小转向越慢越自然",
        ["AIM_FILTER"] = "范围与过滤",
        ["AIM_FOV"] = "FOV 半径",
        ["AIM_FOV_DESC"] = "准星周围多少像素内才会锁定",
        ["AIM_MAXDIST"] = "最远锁定距离",
        ["AIM_TEAM"] = "跳过队友",
        ["AIM_VIS"] = "只锁可见目标",
        ["AIM_VIS_DESC"] = "开启后被墙挡住的不会被锁定",
        ["AIM_SHOWFOV"] = "显示 FOV 圈",
        ["AIM_FOVCOLOR"] = "FOV 圈颜色",
        ["AIM_RESET"] = "重置为默认",
        ["AIM_RESET_MSG"] = "已恢复默认设置",
        ["LANG_TAB"] = "切换语言",
        ["LANG_TITLE"] = "语言切换",
        ["LANG_DESC"] = "选择界面显示语言",
        ["LANG_SELECT"] = "选择语言",
        ["LANG_CURRENT"] = "当前语言",
        ["LANG_APPLIED"] = "语言已切换",
        ["LANG_TIP"] = "若部分文字未变化，重新执行一次脚本即可",
        ["PROFILE_COPYJOBID"] = "复制该服务器 ID",
        ["PROFILE_YEARS"] = "年",
        ["PROFILE_ABOUT"] = "约",
        ["APPEARANCE_TITLE"] = "自定义界面",
        ["APPEARANCE_DESC"] = "个性化你的使用体验",
        ["THEME_APPLIED"] = "主题已应用",
        ["DARKMODE"] = "深色模式",
        ["DARKMODE_DESC"] = "使用深色配色方案",
        ["CREATE_THEME"] = "新建主题",
        ["CREATE_THEME_DLG"] = "创建主题",
        ["COMING_SOON"] = "该功能即将推出！",
        ["OK"] = "确定",
        ["CONFIG_SEC"] = "配置管理",
        ["CONFIG_TITLE"] = "保存与读取设置",
        ["CONFIG_NAME"] = "配置名称",
        ["CONFIG_NAME_PLACEHOLDER"] = "输入配置名称",
        ["CONFIG_SAVE"] = "保存配置",
        ["CONFIG_SAVED"] = "配置已保存",
        ["CONFIG_SAVE_FAIL"] = "保存失败",
        ["CONFIG_LOAD"] = "读取配置",
        ["CONFIG_LOADED"] = "配置已读取",
        ["CONFIG_LOAD_FAIL"] = "读取失败",
        ["CONFIG_EMPTY"] = "配置为空或不存在",
        ["CONFIG_LOADED_KEYS"] = "已读取以下设置",
        ["CONFIG_NOTSUP"] = "当前环境不支持配置管理",
        ["CONFIG_AUTOSAVE"] = "设置已自动保存",
        ["BULLET_TAB"] = "子追",
        ["BULLET_DESC"] = "子弹追踪 / 命中修正",
        ["BULLET_TITLE"] = "子弹追踪",
        ["BULLET_HEAD_DESC"] = "开火时把弹道修正到目标身上",
        ["BULLET_ENABLE"] = "启用子追",
        ["BULLET_ENABLE_DESC"] = "视角不动，子弹自动飞向目标",
        ["BULLET_BASIC"] = "基础设置",
        ["BULLET_METHOD"] = "追踪方式",
        ["BULLET_METHOD_DESC"] = "射线重定向最通用；命中点覆盖适配用 mouse.Hit 的武器",
        ["BULLET_PART"] = "追踪部位",
        ["BULLET_HITCHANCE"] = "命中率",
        ["BULLET_HITCHANCE_DESC"] = "低于 100 会随机漏掉，看起来更像真人",
        ["BULLET_FOLLOW"] = "跟随自瞄目标",
        ["BULLET_FOLLOW_DESC"] = "自瞄开启时优先用它锁定的目标",
        ["BULLET_FILTER"] = "范围与过滤",
        ["BULLET_FOV"] = "追踪 FOV",
        ["BULLET_FOV_DESC"] = "准星周围多少像素内才会被追踪",
        ["BULLET_MAXDIST"] = "最远追踪距离",
        ["BULLET_TEAM"] = "跳过队友",
        ["BULLET_VIS"] = "只追可见目标",
        ["BULLET_VIS_DESC"] = "开启后墙后的目标不会被追踪",
        ["BULLET_NOTSUP_TITLE"] = "子追不可用",
        ["BULLET_NOTSUP_MSG"] = "当前执行环境不支持底层 hook（getrawmetatable/newcclosure）",
        ["BULLET_READY"] = "子追已就绪",
        ["BULLET_READY_MSG"] = "已安装弹道修正，开火即可生效",
        ["BULLET_RESET"] = "重置为默认",
        ["BULLET_STATUS"] = "运行状态",
        ["BULLET_STATUS_DESC"] = "显示底层 hook 是否可用",
        ["BULLET_WALLBANG"] = "穿墙追踪",
        ["BULLET_WALLBANG_DESC"] = "开启后子弹穿过墙体命中目标，无需面对目标",
        ["BULLET_WALLBANG_NOTE"] = "已开启穿墙：射线只命中目标，忽略墙体",
        ["BULLET_WALLBANG_OFF"] = "已关闭穿墙",
        ["BULLET_SERVER_WARN"] = "若游戏在服务端复算弹道，穿墙可能只改本地表现",
        ["BULLET_IMPL"] = "实现方式",
        ["BULLET_IMPL_DESC"] = "Hook 拦截射线（功能强、需底层支持）；Mouse 开火瞬间对准目标（兼容性好）",
        ["BULLET_FIREKEY"] = "触发按键",
        ["BULLET_FIREKEY_DESC"] = "Mouse 模式下按下该键开火时自动对准目标",
        ["BULLET_MOUSE_READY"] = "Mouse 模式已就绪：按下开火键时自动对准目标",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel 不可用，将改用视角瞬移",
        ["BULLET_HOOK_ONLY"] = "该选项仅在 Hook 模式下生效",
        ["BULLET_PROJ"] = "抛射物重定向",
        ["BULLET_REMOTE"] = "Remote 包改写",
        ["BULLET_PROJ_SPEED"] = "最小弹速",
        ["BULLET_PROJ_SPEED_DESC"] = "速度低于此值的 Part 不当作子弹",
        ["BULLET_PROJ_RANGE"] = "识别范围",
        ["BULLET_PROJ_RANGE_DESC"] = "只重定向出现在自己这个范围内的弹丸",
        ["BULLET_PROJ_NOTE"] = "已开启抛射物重定向：飞行中的弹丸会转向目标",
        ["BULLET_HITBOX"] = "Hitbox 扩大",
        ["BULLET_HITBOX_DESC"] = "放大目标判定框，射线更容易命中",
        ["BULLET_HB_MULT"] = "放大倍率",
        ["BULLET_HB_MULT_DESC"] = "1 = 原始大小，数值越大越好打中",
        ["BULLET_HB_PART"] = "放大部位",
        ["BULLET_HB_NOTE"] = "已开启 Hitbox 扩大",
        ["BULLET_RM_KW"] = "名称关键词",
        ["BULLET_RM_KW_DESC"] = "只处理名称含该词的 Remote，留空处理全部",
        ["BULLET_RM_IDX"] = "参数位置",
        ["BULLET_RM_IDX_DESC"] = "把第几个参数替换成目标（从 1 开始）",
        ["BULLET_RM_TYPE"] = "替换内容",
        ["BULLET_RM_LOG"] = "查看捕获到的 Remote",
        ["BULLET_RM_LOG_DESC"] = "开火后点这里，看游戏用了哪些 Remote",
        ["BULLET_RM_EMPTY"] = "还没拦截到任何 Remote，先开火试试",
        ["BULLET_RM_CAPTURED"] = "已拦截",
        ["BULLET_RM_NOTE"] = "已开启 Remote 包改写",
        ["T_PLAYER"] = "目标玩家",
        ["T_POSITION"] = "目标坐标",
        ["ESP_DRAW_EXT"] = "扩展绘制",
        ["ESP_SKELETON"] = "骨架连线",
        ["ESP_SKELETON_DESC"] = "画出人物骨骼线条",
        ["ESP_BOX3D"] = "3D 立体框",
        ["ESP_BOX3D_DESC"] = "带透视的立方体框",
        ["ESP_HIGHLIGHT"] = "原生高亮描边",
        ["ESP_HIGHLIGHT_DESC"] = "用 Highlight 实例描边，穿墙可见",
        ["ESP_HEADDOT"] = "头顶圆圈",
        ["ESP_VIEWLINE"] = "视野朝向线",
        ["ESP_VIEWLINE_DESC"] = "从头部画一条线显示朝向",
        ["ESP_OFFSCREEN"] = "屏幕外箭头",
        ["ESP_OFFSCREEN_DESC"] = "目标不在画面内时，边缘显示指向箭头",
        ["ESP_INFO"] = "信息显示",
        ["ESP_WEAPON"] = "显示手持武器",
        ["ESP_HEALTHNUM"] = "血量数字",
        ["ESP_TARGETHL"] = "锁定目标高亮",
        ["ESP_TARGETHL_DESC"] = "自瞄/子追锁定的目标用红色单独标出",
        ["ESP_RADAR_SEC"] = "雷达",
        ["ESP_RADAR"] = "启用雷达",
        ["ESP_RADAR_DESC"] = "角落显示 2D 俯视雷达",
        ["RADAR_SIZE"] = "雷达尺寸",
        ["RADAR_RANGE"] = "雷达范围",
        ["RADAR_RANGE_DESC"] = "雷达覆盖多少米",
        ["RADAR_POS"] = "雷达位置",
        ["CAM_SEC"] = "相机诊断",
        ["CAM_CHECK"] = "检测相机是否可写",
        ["CAM_CHECK_DESC"] = "写入后读取对比，判断游戏有没有锁死相机",
        ["CAM_RESULT"] = "检测结果",
        ["CAM_WRITABLE"] = "相机可写，CFrame 自瞄可用",
        ["CAM_LOCKED"] = "相机被锁死，游戏每帧覆盖了你的写入",
        ["CAM_TYPE"] = "相机类型",
        ["CAM_SUBJECT"] = "跟随对象",
        ["CAM_MODE"] = "视角写入方式",
        ["CAM_MODE_DESC"] = "直接写可能被覆盖；Hook 拦截在游戏写入后改写，更稳",
        ["CAM_HOOK_OK"] = "已安装相机 Hook",
        ["CAM_HOOK_FAIL"] = "相机 Hook 安装失败（执行器不支持）",
        ["CAM_NOHOOK"] = "无法读取相机元表，Hook 方式不可用",
        ["TB_SEC"] = "自动开火",
        ["TB_ENABLE"] = "启用自动开火",
        ["TB_ENABLE_DESC"] = "准星压到敌人身上时自动开火",
        ["TB_METHOD"] = "开火方式",
        ["TB_METHOD_DESC"] = "不同执行器支持的函数不同，逐个试",
        ["TB_DELAY"] = "开火延迟",
        ["TB_DELAY_DESC"] = "瞄准后等多少毫秒再开火，更像真人",
        ["TB_COOLDOWN"] = "射击间隔",
        ["TB_COOLDOWN_DESC"] = "两次开火之间至少间隔多久",
        ["TB_BURST"] = "连发模式",
        ["TB_BURST_DESC"] = "按住时持续开火，而不是点一下打一发",
        ["TB_ONLYVIS"] = "只对可见目标开火",
        ["TB_HITCHK"] = "使用子追目标",
        ["TB_HITCHK_DESC"] = "子追开着时，以它锁定的目标为准",
        ["TB_TEST"] = "测试开火",
        ["TB_TEST_DESC"] = "点一下看能不能触发射击，用来确认开火方式是否可用",
        ["TB_TESTED"] = "已发送开火信号，看游戏有没有反应",
        ["TB_NOMETHOD"] = "当前执行器没有任何可用的开火函数",
        ["TB_FIRED"] = "已开火",
        ["ESP_DIAG"] = "ESP 自检",
        ["ESP_DIAG_DESC"] = "检查 Drawing 是否可用，并显示最近一次运行错误",
        ["ESP_DIAG_RESULT"] = "自检结果",
        ["ESP_DRAWING_OK"] = "Drawing 库可用",
        ["ESP_DRAWING_NO"] = "Drawing 库不可用，ESP 无法绘制",
        ["ESP_LASTERR"] = "最近错误",
        ["ESP_NOERR"] = "暂无错误",
        ["ESP_STATE"] = "运行状态",
        ["ESP_DRAWN"] = "已绘制目标数",
        ["ESP_CAMLOCKED"] = "相机已锁死，自瞄与子追的视角方案均不可用",
        ["TB_ONLY_LEFT"] = "建议改用自动开火：准星对上就打，不依赖转视角",
        ["FLY_TAB"] = "飞行",
        ["FLY_DESC"] = "自由飞行与穿墙移动",
        ["FLY_TITLE"] = "飞行",
        ["FLY_HEAD_DESC"] = "BodyGyro + BodyVelocity 驱动，支持穿墙",
        ["FLY_ENABLE"] = "启用飞行",
        ["FLY_ENABLE_DESC"] = "开启后角色升空，方向由视角控制",
        ["FLY_NOCLIP"] = "穿墙模式",
        ["FLY_NOCLIP_DESC"] = "飞行时同时启用穿墙移动",
        ["FLY_SPEED"] = "飞行速度",
        ["FLY_SPEED_DESC"] = "数值越大飞得越快",
        ["FLY_UP"] = "上升",
        ["FLY_DOWN"] = "下降",
        ["FLY_UP_DESC"] = "按住持续上升",
        ["FLY_DOWN_DESC"] = "按住持续下降",
        ["FLY_STOP"] = "停止飞行",
        ["FLY_STOPPED"] = "已停止飞行",
        ["FLY_NOCHAR"] = "角色未就绪，请等复活后重试",
        ["FLY_STARTED"] = "飞行已开启",
        ["FLY_VERTSPD"] = "升降速度",
        ["FLY_VERTSPD_DESC"] = "按住升降按钮时每次位移的距离",
        ["FLY_UNSTICK"] = "停止时自动脱困",
        ["FLY_UNSTICK_DESC"] = "检测角色是否卡在实体内并抬出来",
        ["FLY_FORCE_RESET"] = "强制重置角色",
        ["FLY_FORCE_RESET_DESC"] = "飞行后跳不起来就点这个",
        ["FLY_RESET_DONE"] = "已重置，试试能不能跳",
        ["FLY_NOCLIP_MODE"] = "穿墙方式",
        ["FLY_NOCLIP_MODE_DESC"] = "关闭碰撞最稳；位移式兼容老游戏",
        ["ESP_UNIT"] = "距离单位",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud（罗布乐思单位）",
        ["UNIT_M"] = "m（米）",
        ["UNIT_KM"] = "km（千米）",
        ["UNIT_SCALE"] = "换算比例",
        ["UNIT_SCALE_DESC"] = "1 stud 等于多少米，默认 0.28",
        ["THEME_SELECT"] = "选择主题",
        ["BULLET_REMOTE_LOG_DESC"] = "开火后点这里，看游戏用了哪些 Remote",
        ["MISC_TAB"] = "通用",
        ["MISC_DESC"] = "基础属性修改",
        ["MISC_SEC_CHAR"] = "角色属性",
        ["MISC_SEC_WORLD"] = "世界与视角",
        ["MISC_SPEED"] = "移动速度",
        ["MISC_SPEED_DESC"] = "提高角色移动速度",
        ["MISC_JUMP"] = "跳跃力",
        ["MISC_JUMP_DESC"] = "提高跳跃高度",
        ["MISC_HEALTH"] = "生命上限",
        ["MISC_HEALTH_DESC"] = "提高最大血量上限",
        ["MISC_INFJUMP"] = "无限跳跃",
        ["MISC_INFJUMP_DESC"] = "空中也能继续跳",
        ["MISC_GRAVITY"] = "重力",
        ["MISC_GRAVITY_DESC"] = "数值越小飘得越高，默认 196",
        ["MISC_NOCLIP"] = "穿墙",
        ["MISC_NOCLIP_DESC"] = "角色穿过所有物体",
        ["MISC_FOV"] = "视野 FOV",
        ["MISC_FOV_DESC"] = "调整视野范围，默认 70",
        ["MISC_BRIGHT"] = "夜视",
        ["MISC_BRIGHT_DESC"] = "提高亮度看清暗处",
        ["MISC_RESET"] = "重置全部",
        ["MISC_RESET_DESC"] = "恢复所有原始数值",
        ["MISC_RESET_DONE"] = "已恢复默认",
        ["MISC_SEC_AFK"] = "防踢与透视",
        ["MISC_ANTIAFK"] = "防 AFK 踢出",
        ["MISC_ANTIAFK_DESC"] = "挂机也不会被判定离开",
        ["MISC_AFK_STATUS"] = "防 AFK 状态",
        ["MISC_XRAY"] = "透视（透明墙）",
        ["MISC_XRAY_DESC"] = "让墙体变透明，看到墙后的人",
        ["MISC_XRAY_AMT"] = "透视程度",
        ["MISC_XRAY_AMT_DESC"] = "0 = 不透明，1 = 完全透明",
        ["MISC_SEC_TP"] = "传送到玩家",
        ["MISC_TP_SELECT"] = "选择玩家",
        ["MISC_TP_SELECT_DESC"] = "点刷新后再选目标",
        ["MISC_TP_REFRESH"] = "刷新玩家列表",
        ["MISC_TP_REFRESHED"] = "已刷新玩家列表",
        ["MISC_TP_GO"] = "传送过去",
        ["MISC_TP_BEHIND"] = "传送到其身后",
        ["MISC_TP_BEHIND_DESC"] = "出现在目标背后，适合偷袭",
        ["MISC_TP_VEH"] = "载具模式",
        ["MISC_TP_VEH_DESC"] = "传送时保留座位（有车/船时开）",
        ["MISC_TP_OK"] = "已传送",
        ["MISC_TP_NONE"] = "没有可传送的目标",
        ["MISC_TP_NOCHAR"] = "你的角色未就绪",
        ["SCRIPT_SEC"] = "脚本",
        ["SCRIPT_TAB"] = "脚本库",
        ["SCRIPT_DESC"] = "收录各服务器/游戏的第三方脚本",
        ["SCRIPT_CATEGORY"] = "分类",
        ["SCRIPT_CATEGORY_DESC"] = "先选分类，再选脚本",
        ["SCRIPT_SELECT"] = "选择脚本",
        ["SCRIPT_SELECT_DESC"] = "选中后点下方按钮加载",
        ["SCRIPT_INFO"] = "脚本信息",
        ["SCRIPT_INFO_EMPTY"] = "未选择脚本",
        ["SCRIPT_LOAD"] = "加载脚本",
        ["SCRIPT_LOAD_DESC"] = "执行选中的脚本",
        ["SCRIPT_COPY"] = "复制链接",
        ["SCRIPT_COPY_DESC"] = "把脚本网址复制到剪贴板",
        ["SCRIPT_CONFIRM_TITLE"] = "确认加载",
        ["SCRIPT_CONFIRM_BODY"] = "即将执行第三方脚本，来源不明的代码有风险，确定继续？",
        ["SCRIPT_LOADING"] = "正在加载…",
        ["SCRIPT_LOADED"] = "脚本已执行",
        ["SCRIPT_FAILED"] = "加载失败，检查链接或网络",
        ["SCRIPT_NO_URL"] = "该脚本未配置链接",
        ["SCRIPT_COPIED"] = "链接已复制",
        ["SCRIPT_CUSTOM_SEC"] = "自定义脚本",
        ["SCRIPT_CUSTOM_URL"] = "脚本链接",
        ["SCRIPT_CUSTOM_URL_DESC"] = "粘贴 raw 或 gist 直链",
        ["SCRIPT_CUSTOM_LOAD"] = "加载自定义脚本",
        ["SCRIPT_CUSTOM_EMPTY"] = "请先填写链接",
        ["SCRIPT_GUIDE"] = "添加方法",
        ["SCRIPT_GUIDE_DESC"] = "见脚本库代码顶部的 SCRIPT_LIB 数组",
        ["CANCEL"] = "取消",
    },
    ["zh-tw"] = {
        ["PROFILE_TAB"] = "介紹",
        ["PROFILE_DESC"] = "腳本說明與伺服器狀態",
        ["PROFILE_BASIC"] = "基本資訊",
        ["PROFILE_USERNAME"] = "用戶名",
        ["PROFILE_DISPLAYNAME"] = "顯示名",
        ["PROFILE_UID"] = "用戶 ID",
        ["PROFILE_ACCOUNTAGE"] = "帳號年齡",
        ["PROFILE_SERVER"] = "伺服器資訊",
        ["PROFILE_PLACEID"] = "場所 ID",
        ["PROFILE_JOBID"] = "伺服器 ID",
        ["PROFILE_PLAYERS"] = "在線人數",
        ["PROFILE_PING"] = "網路延遲",
        ["PROFILE_FPS"] = "目前幀率",
        ["PROFILE_REFRESH"] = "重新整理資訊",
        ["PROFILE_VIEW"] = "檢視完整檔案",
        ["PROFILE_COPYUID"] = "複製用戶 ID",
        ["PROFILE_COPIED"] = "已複製到剪貼簿",
        ["PROFILE_DAYS"] = "天",
        ["PROFILE_UNKNOWN"] = "未知",
        ["PROFILE_GREET"] = "個人資料",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP 視覺功能",
        ["ESP_DESC"] = "方框 / 名字 / 距離 / 血量 / 追蹤線",
        ["ESP_ENABLE"] = "啟用 ESP",
        ["ESP_ENABLE_DESC"] = "總開關，關閉後所有繪製立即消失",
        ["ESP_DRAW"] = "繪製項目",
        ["ESP_BOX"] = "人物方框",
        ["ESP_NAME"] = "玩家名字",
        ["ESP_DISTANCE"] = "距離顯示",
        ["ESP_HEALTH"] = "血量條",
        ["ESP_TRACER"] = "追蹤線",
        ["ESP_NAMESEC"] = "名字顯示",
        ["ESP_NAMESRC"] = "名字來源",
        ["ESP_NAMESRC_DESC"] = "中文顯示名亂碼時改用「用戶名」",
        ["ESP_FONT"] = "文字字體",
        ["ESP_FONT_DESC"] = "想顯示中文可逐個試 System / Plex / Monospace",
        ["ESP_ASCII"] = "中文自動回退",
        ["ESP_ASCII_DESC"] = "顯示名含中文且字體不支援時，自動改用用戶名",
        ["ESP_FILTER"] = "過濾與樣式",
        ["ESP_TEAM"] = "顯示隊伍",
        ["ESP_TEAM_DESC"] = "開啟後不繪製同隊玩家",
        ["ESP_LOS"] = "僅顯示可見目標",
        ["ESP_LOS_DESC"] = "開啟後被牆擋住的不顯示",
        ["ESP_MAXDIST"] = "最大距離",
        ["ESP_MAXDIST_DESC"] = "超出該距離不繪製",
        ["ESP_THICK"] = "線條粗細",
        ["ESP_TEXTSIZE"] = "文字大小",
        ["ESP_COLOR"] = "ESP 顏色",
        ["ESP_CLEAR"] = "清理殘留繪製",
        ["ESP_CLEAR_DESC"] = "畫面有卡住的框時點一下",
        ["ESP_NOTSUP_TITLE"] = "ESP 不可用",
        ["ESP_NOTSUP_MSG"] = "當前執行環境不支援 Drawing API",
        ["ESP_CLEARED"] = "已清理全部繪製物件",
        ["AIM_TAB"] = "自瞄",
        ["AIM_TITLE"] = "自瞄 Aimbot",
        ["AIM_DESC"] = "FOV 鎖定 · 平滑跟隨 · 支援牆體/隊友過濾",
        ["AIM_ENABLE"] = "啟用自瞄",
        ["AIM_ENABLE_DESC"] = "預設常開模式，無需按鍵即可鎖定",
        ["AIM_BASIC"] = "基礎設定",
        ["AIM_MODE"] = "瞄準方式",
        ["AIM_MODE_DESC"] = "CFrame 穩定；Mouse 模擬真人移動",
        ["AIM_TRIGGER"] = "觸發按鍵",
        ["AIM_PART"] = "瞄準部位",
        ["AIM_SMOOTH"] = "平滑度",
        ["AIM_SMOOTH_DESC"] = "數值越小轉向越慢越自然",
        ["AIM_FILTER"] = "範圍與過濾",
        ["AIM_FOV"] = "FOV 半徑",
        ["AIM_FOV_DESC"] = "準星周圍多少像素內才會鎖定",
        ["AIM_MAXDIST"] = "最遠鎖定距離",
        ["AIM_TEAM"] = "跳過隊友",
        ["AIM_VIS"] = "只鎖可見目標",
        ["AIM_VIS_DESC"] = "開啟後被牆擋住的不會被鎖定",
        ["AIM_SHOWFOV"] = "顯示 FOV 圈",
        ["AIM_FOVCOLOR"] = "FOV 圈顏色",
        ["AIM_RESET"] = "重設為預設",
        ["AIM_RESET_MSG"] = "已恢復預設設定",
        ["LANG_TAB"] = "切換語言",
        ["LANG_TITLE"] = "語言切換",
        ["LANG_DESC"] = "選擇介面顯示語言",
        ["LANG_SELECT"] = "選擇語言",
        ["LANG_CURRENT"] = "目前語言",
        ["LANG_APPLIED"] = "語言已切換",
        ["LANG_TIP"] = "若部分文字未變化，重新執行一次腳本即可",
        ["PROFILE_COPYJOBID"] = "複製該伺服器 ID",
        ["PROFILE_YEARS"] = "年",
        ["PROFILE_ABOUT"] = "約",
        ["APPEARANCE_TITLE"] = "自訂介面",
        ["APPEARANCE_DESC"] = "個人化你的使用體驗",
        ["THEME_APPLIED"] = "主題已套用",
        ["DARKMODE"] = "深色模式",
        ["DARKMODE_DESC"] = "使用深色配色配置",
        ["CREATE_THEME"] = "新增主題",
        ["CREATE_THEME_DLG"] = "建立主題",
        ["COMING_SOON"] = "該功能即將推出！",
        ["OK"] = "確定",
        ["CONFIG_SEC"] = "設定管理",
        ["CONFIG_TITLE"] = "儲存與讀取設定",
        ["CONFIG_NAME"] = "設定名稱",
        ["CONFIG_NAME_PLACEHOLDER"] = "輸入設定名稱",
        ["CONFIG_SAVE"] = "儲存設定",
        ["CONFIG_SAVED"] = "設定已儲存",
        ["CONFIG_SAVE_FAIL"] = "儲存失敗",
        ["CONFIG_LOAD"] = "讀取設定",
        ["CONFIG_LOADED"] = "設定已讀取",
        ["CONFIG_LOAD_FAIL"] = "讀取失敗",
        ["CONFIG_EMPTY"] = "設定為空或不存在",
        ["CONFIG_LOADED_KEYS"] = "已讀取以下設定",
        ["CONFIG_NOTSUP"] = "目前環境不支援設定管理",
        ["CONFIG_AUTOSAVE"] = "設定已自動儲存",
        ["BULLET_TAB"] = "子追",
        ["BULLET_DESC"] = "子彈追蹤 / 命中修正",
        ["BULLET_TITLE"] = "子彈追蹤",
        ["BULLET_HEAD_DESC"] = "開火時把彈道修正到目標身上",
        ["BULLET_ENABLE"] = "啟用子追",
        ["BULLET_ENABLE_DESC"] = "視角不動，子彈自動飛向目標",
        ["BULLET_BASIC"] = "基礎設定",
        ["BULLET_METHOD"] = "追蹤方式",
        ["BULLET_METHOD_DESC"] = "射線重定向最通用；命中點覆蓋適配用 mouse.Hit 的武器",
        ["BULLET_PART"] = "追蹤部位",
        ["BULLET_HITCHANCE"] = "命中率",
        ["BULLET_HITCHANCE_DESC"] = "低於 100 會隨機漏掉，看起來更像真人",
        ["BULLET_FOLLOW"] = "跟隨自瞄目標",
        ["BULLET_FOLLOW_DESC"] = "自瞄開啟時優先用它鎖定的目標",
        ["BULLET_FILTER"] = "範圍與過濾",
        ["BULLET_FOV"] = "追蹤 FOV",
        ["BULLET_FOV_DESC"] = "準星周圍多少像素內才會被追蹤",
        ["BULLET_MAXDIST"] = "最遠追蹤距離",
        ["BULLET_TEAM"] = "跳過隊友",
        ["BULLET_VIS"] = "只追可見目標",
        ["BULLET_VIS_DESC"] = "開啟後牆後的目標不會被追蹤",
        ["BULLET_NOTSUP_TITLE"] = "子追不可用",
        ["BULLET_NOTSUP_MSG"] = "目前執行環境不支援底層 hook（getrawmetatable/newcclosure）",
        ["BULLET_READY"] = "子追已就緒",
        ["BULLET_READY_MSG"] = "已安裝彈道修正，開火即可生效",
        ["BULLET_RESET"] = "重設為預設",
        ["BULLET_STATUS"] = "運行狀態",
        ["BULLET_STATUS_DESC"] = "顯示底層 hook 是否可用",
        ["BULLET_WALLBANG"] = "穿牆追蹤",
        ["BULLET_WALLBANG_DESC"] = "開啟後子彈穿過牆體命中目標，無需面對目標",
        ["BULLET_WALLBANG_NOTE"] = "已開啟穿牆：射線只命中目標，忽略牆體",
        ["BULLET_WALLBANG_OFF"] = "已關閉穿牆",
        ["BULLET_SERVER_WARN"] = "若遊戲在服務端複算彈道，穿牆可能只改本地表現",
        ["BULLET_IMPL"] = "實現方式",
        ["BULLET_IMPL_DESC"] = "Hook 攔截射線（功能強、需底層支援）；Mouse 開火瞬間對準目標（相容性好）",
        ["BULLET_FIREKEY"] = "觸發按鍵",
        ["BULLET_FIREKEY_DESC"] = "Mouse 模式下按下該鍵開火時自動對準目標",
        ["BULLET_MOUSE_READY"] = "Mouse 模式已就緒：按下開火鍵時自動對準目標",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel 不可用，將改用視角瞬移",
        ["BULLET_HOOK_ONLY"] = "該選項僅在 Hook 模式下生效",
        ["BULLET_PROJ"] = "拋射物重定向",
        ["BULLET_REMOTE"] = "Remote 封包改寫",
        ["BULLET_PROJ_SPEED"] = "最小彈速",
        ["BULLET_PROJ_SPEED_DESC"] = "速度低於此值的 Part 不當作子彈",
        ["BULLET_PROJ_RANGE"] = "識別範圍",
        ["BULLET_PROJ_RANGE_DESC"] = "只重定向出現在自己這個範圍內的彈丸",
        ["BULLET_PROJ_NOTE"] = "已開啟拋射物重定向：飛行中的彈丸會轉向目標",
        ["BULLET_HITBOX"] = "Hitbox 擴大",
        ["BULLET_HITBOX_DESC"] = "放大目標判定框，射線更容易命中",
        ["BULLET_HB_MULT"] = "放大倍率",
        ["BULLET_HB_MULT_DESC"] = "1 = 原始大小，數值越大越好打中",
        ["BULLET_HB_PART"] = "放大部位",
        ["BULLET_HB_NOTE"] = "已開啟 Hitbox 擴大",
        ["BULLET_RM_KW"] = "名稱關鍵詞",
        ["BULLET_RM_KW_DESC"] = "只處理名稱含該詞的 Remote，留空處理全部",
        ["BULLET_RM_IDX"] = "參數位置",
        ["BULLET_RM_IDX_DESC"] = "把第幾個參數替換成目標（從 1 開始）",
        ["BULLET_RM_TYPE"] = "替換內容",
        ["BULLET_RM_LOG"] = "查看捕獲到的 Remote",
        ["BULLET_RM_LOG_DESC"] = "開火後點這裡，看遊戲用了哪些 Remote",
        ["BULLET_RM_EMPTY"] = "還沒攔截到任何 Remote，先開火試試",
        ["BULLET_RM_CAPTURED"] = "已攔截",
        ["BULLET_RM_NOTE"] = "已開啟 Remote 封包改寫",
        ["T_PLAYER"] = "目標玩家",
        ["T_POSITION"] = "目標座標",
        ["ESP_DRAW_EXT"] = "擴展繪製",
        ["ESP_SKELETON"] = "骨架連線",
        ["ESP_SKELETON_DESC"] = "畫出人物骨骼線條",
        ["ESP_BOX3D"] = "3D 立體框",
        ["ESP_BOX3D_DESC"] = "帶透視的立方體框",
        ["ESP_HIGHLIGHT"] = "原生高亮描邊",
        ["ESP_HIGHLIGHT_DESC"] = "用 Highlight 實例描邊，穿牆可見",
        ["ESP_HEADDOT"] = "頭頂圓圈",
        ["ESP_VIEWLINE"] = "視野朝向線",
        ["ESP_VIEWLINE_DESC"] = "從頭部畫一條線顯示朝向",
        ["ESP_OFFSCREEN"] = "螢幕外箭頭",
        ["ESP_OFFSCREEN_DESC"] = "目標不在畫面內時，邊緣顯示指向箭頭",
        ["ESP_INFO"] = "資訊顯示",
        ["ESP_WEAPON"] = "顯示手持武器",
        ["ESP_HEALTHNUM"] = "血量數字",
        ["ESP_TARGETHL"] = "鎖定目標高亮",
        ["ESP_TARGETHL_DESC"] = "自瞄/子追鎖定的目標用紅色單獨標出",
        ["ESP_RADAR_SEC"] = "雷達",
        ["ESP_RADAR"] = "啟用雷達",
        ["ESP_RADAR_DESC"] = "角落顯示 2D 俯視雷達",
        ["RADAR_SIZE"] = "雷達尺寸",
        ["RADAR_RANGE"] = "雷達範圍",
        ["RADAR_RANGE_DESC"] = "雷達覆蓋多少公尺",
        ["RADAR_POS"] = "雷達位置",
        ["CAM_SEC"] = "相機診斷",
        ["CAM_CHECK"] = "檢測相機是否可寫",
        ["CAM_CHECK_DESC"] = "寫入後讀取對比，判斷遊戲有沒有鎖死相機",
        ["CAM_RESULT"] = "檢測結果",
        ["CAM_WRITABLE"] = "相機可寫，CFrame 自瞄可用",
        ["CAM_LOCKED"] = "相機被鎖死，遊戲每幀覆蓋了你的寫入",
        ["CAM_TYPE"] = "相機類型",
        ["CAM_SUBJECT"] = "跟隨對象",
        ["CAM_MODE"] = "視角寫入方式",
        ["CAM_MODE_DESC"] = "直接寫可能被覆蓋；Hook 攔截在遊戲寫入後改寫，更穩",
        ["CAM_HOOK_OK"] = "已安裝相機 Hook",
        ["CAM_HOOK_FAIL"] = "相機 Hook 安裝失敗（執行器不支援）",
        ["CAM_NOHOOK"] = "無法讀取相機元表，Hook 方式不可用",
        ["TB_SEC"] = "自動開火",
        ["TB_ENABLE"] = "啟用自動開火",
        ["TB_ENABLE_DESC"] = "準星壓到敵人身上時自動開火",
        ["TB_METHOD"] = "開火方式",
        ["TB_METHOD_DESC"] = "不同執行器支援的函數不同，逐個試",
        ["TB_DELAY"] = "開火延遲",
        ["TB_DELAY_DESC"] = "瞄準後等多少毫秒再開火，更像真人",
        ["TB_COOLDOWN"] = "射擊間隔",
        ["TB_COOLDOWN_DESC"] = "兩次開火之間至少間隔多久",
        ["TB_BURST"] = "連發模式",
        ["TB_BURST_DESC"] = "按住時持續開火，而不是點一下打一發",
        ["TB_ONLYVIS"] = "只對可見目標開火",
        ["TB_HITCHK"] = "使用子追目標",
        ["TB_HITCHK_DESC"] = "子追開著時，以它鎖定的目標為準",
        ["TB_TEST"] = "測試開火",
        ["TB_TEST_DESC"] = "點一下看能不能觸發射擊，用來確認開火方式是否可用",
        ["TB_TESTED"] = "已發送開火信號，看遊戲有沒有反應",
        ["TB_NOMETHOD"] = "目前執行器沒有任何可用的開火函數",
        ["TB_FIRED"] = "已開火",
        ["ESP_DIAG"] = "ESP 自檢",
        ["ESP_DIAG_DESC"] = "檢查 Drawing 是否可用，並顯示最近一次運行錯誤",
        ["ESP_DIAG_RESULT"] = "自檢結果",
        ["ESP_DRAWING_OK"] = "Drawing 庫可用",
        ["ESP_DRAWING_NO"] = "Drawing 庫不可用，ESP 無法繪製",
        ["ESP_LASTERR"] = "最近錯誤",
        ["ESP_NOERR"] = "暫無錯誤",
        ["ESP_STATE"] = "運行狀態",
        ["ESP_DRAWN"] = "已繪製目標數",
        ["ESP_CAMLOCKED"] = "相機已鎖死，自瞄與子追的視角方案均不可用",
        ["TB_ONLY_LEFT"] = "建議改用自動開火：準星對上就打，不依賴轉視角",
        ["FLY_TAB"] = "飛行",
        ["FLY_DESC"] = "自由飛行與穿牆移動",
        ["FLY_TITLE"] = "飛行",
        ["FLY_HEAD_DESC"] = "BodyGyro + BodyVelocity 驅動，支援穿牆",
        ["FLY_ENABLE"] = "啟用飛行",
        ["FLY_ENABLE_DESC"] = "開啟後角色升空，方向由視角控制",
        ["FLY_NOCLIP"] = "穿牆模式",
        ["FLY_NOCLIP_DESC"] = "飛行時同時啟用穿牆移動",
        ["FLY_SPEED"] = "飛行速度",
        ["FLY_SPEED_DESC"] = "數值越大飛得越快",
        ["FLY_UP"] = "上升",
        ["FLY_DOWN"] = "下降",
        ["FLY_UP_DESC"] = "按住持續上升",
        ["FLY_DOWN_DESC"] = "按住持續下降",
        ["FLY_STOP"] = "停止飛行",
        ["FLY_STOPPED"] = "已停止飛行",
        ["FLY_NOCHAR"] = "角色未就緒，請等復活後重試",
        ["FLY_STARTED"] = "飛行已開啟",
        ["FLY_VERTSPD"] = "升降速度",
        ["FLY_VERTSPD_DESC"] = "按住升降按鈕時每次位移的距離",
        ["FLY_UNSTICK"] = "停止時自動脫困",
        ["FLY_UNSTICK_DESC"] = "偵測角色是否卡在實體內並抬出來",
        ["FLY_FORCE_RESET"] = "強制重置角色",
        ["FLY_FORCE_RESET_DESC"] = "飛行後跳不起來就點這個",
        ["FLY_RESET_DONE"] = "已重置，試試能不能跳",
        ["FLY_NOCLIP_MODE"] = "穿牆方式",
        ["FLY_NOCLIP_MODE_DESC"] = "關閉碰撞最穩；位移式相容老遊戲",
        ["ESP_UNIT"] = "距離單位",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud（羅布樂思單位）",
        ["UNIT_M"] = "m（公尺）",
        ["UNIT_KM"] = "km（公里）",
        ["UNIT_SCALE"] = "換算比例",
        ["UNIT_SCALE_DESC"] = "1 stud 等於多少公尺，預設 0.28",
        ["THEME_SELECT"] = "選擇主題",
        ["BULLET_REMOTE_LOG_DESC"] = "開火後點這裡，看遊戲用了哪些 Remote",
        ["MISC_TAB"] = "通用",
        ["MISC_DESC"] = "基礎屬性修改",
        ["MISC_SEC_CHAR"] = "角色屬性",
        ["MISC_SEC_WORLD"] = "世界與視角",
        ["MISC_SPEED"] = "移動速度",
        ["MISC_SPEED_DESC"] = "提高角色移動速度",
        ["MISC_JUMP"] = "跳躍力",
        ["MISC_JUMP_DESC"] = "提高跳躍高度",
        ["MISC_HEALTH"] = "生命上限",
        ["MISC_HEALTH_DESC"] = "提高最大血量上限",
        ["MISC_INFJUMP"] = "無限跳躍",
        ["MISC_INFJUMP_DESC"] = "空中也能繼續跳",
        ["MISC_GRAVITY"] = "重力",
        ["MISC_GRAVITY_DESC"] = "數值越小飄得越高，預設 196",
        ["MISC_NOCLIP"] = "穿牆",
        ["MISC_NOCLIP_DESC"] = "角色穿過所有物體",
        ["MISC_FOV"] = "視野 FOV",
        ["MISC_FOV_DESC"] = "調整視野範圍，預設 70",
        ["MISC_BRIGHT"] = "夜視",
        ["MISC_BRIGHT_DESC"] = "提高亮度看清暗處",
        ["MISC_RESET"] = "重置全部",
        ["MISC_RESET_DESC"] = "恢復所有原始數值",
        ["MISC_RESET_DONE"] = "已恢復默認",
        ["MISC_SEC_AFK"] = "防踢與透視",
        ["MISC_ANTIAFK"] = "防 AFK 踢出",
        ["MISC_ANTIAFK_DESC"] = "掛機也不會被判定離開",
        ["MISC_AFK_STATUS"] = "防 AFK 狀態",
        ["MISC_XRAY"] = "透視（透明牆）",
        ["MISC_XRAY_DESC"] = "讓牆體變透明，看到牆後的人",
        ["MISC_XRAY_AMT"] = "透視程度",
        ["MISC_XRAY_AMT_DESC"] = "0 = 不透明，1 = 完全透明",
        ["MISC_SEC_TP"] = "傳送到玩家",
        ["MISC_TP_SELECT"] = "選擇玩家",
        ["MISC_TP_SELECT_DESC"] = "點刷新後再選目標",
        ["MISC_TP_REFRESH"] = "刷新玩家列表",
        ["MISC_TP_REFRESHED"] = "已刷新玩家列表",
        ["MISC_TP_GO"] = "傳送過去",
        ["MISC_TP_BEHIND"] = "傳送到其身後",
        ["MISC_TP_BEHIND_DESC"] = "出現在目標背後，適合偷襲",
        ["MISC_TP_VEH"] = "載具模式",
        ["MISC_TP_VEH_DESC"] = "傳送時保留座位（有車/船時開）",
        ["MISC_TP_OK"] = "已傳送",
        ["MISC_TP_NONE"] = "沒有可傳送的目標",
        ["MISC_TP_NOCHAR"] = "你的角色未就緒",
        ["SCRIPT_SEC"] = "腳本",
        ["SCRIPT_TAB"] = "腳本庫",
        ["SCRIPT_DESC"] = "收錄各伺服器/遊戲的第三方腳本",
        ["SCRIPT_CATEGORY"] = "分類",
        ["SCRIPT_CATEGORY_DESC"] = "先選分類，再選腳本",
        ["SCRIPT_SELECT"] = "選擇腳本",
        ["SCRIPT_SELECT_DESC"] = "選中後點下方按鈕加載",
        ["SCRIPT_INFO"] = "腳本資訊",
        ["SCRIPT_INFO_EMPTY"] = "未選擇腳本",
        ["SCRIPT_LOAD"] = "加載腳本",
        ["SCRIPT_LOAD_DESC"] = "執行選中的腳本",
        ["SCRIPT_COPY"] = "複製連結",
        ["SCRIPT_COPY_DESC"] = "把腳本網址複製到剪貼板",
        ["SCRIPT_CONFIRM_TITLE"] = "確認加載",
        ["SCRIPT_CONFIRM_BODY"] = "即將執行第三方腳本，來源不明的程式碼有風險，確定繼續？",
        ["SCRIPT_LOADING"] = "正在加載…",
        ["SCRIPT_LOADED"] = "腳本已執行",
        ["SCRIPT_FAILED"] = "加載失敗，檢查連結或網路",
        ["SCRIPT_NO_URL"] = "該腳本未配置連結",
        ["SCRIPT_COPIED"] = "連結已複製",
        ["SCRIPT_CUSTOM_SEC"] = "自訂腳本",
        ["SCRIPT_CUSTOM_URL"] = "腳本連結",
        ["SCRIPT_CUSTOM_URL_DESC"] = "貼上 raw 或 gist 直鏈",
        ["SCRIPT_CUSTOM_LOAD"] = "加載自訂腳本",
        ["SCRIPT_CUSTOM_EMPTY"] = "請先填寫連結",
        ["SCRIPT_GUIDE"] = "添加方法",
        ["SCRIPT_GUIDE_DESC"] = "見腳本庫程式碼頂部的 SCRIPT_LIB 陣列",
        ["CANCEL"] = "取消",
    },
    ["en"] = {
        ["PROFILE_TAB"] = "Introduction",
        ["PROFILE_DESC"] = "About this script and server status",
        ["PROFILE_BASIC"] = "Basic Info",
        ["PROFILE_USERNAME"] = "Username",
        ["PROFILE_DISPLAYNAME"] = "Display Name",
        ["PROFILE_UID"] = "User ID",
        ["PROFILE_ACCOUNTAGE"] = "Account Age",
        ["PROFILE_SERVER"] = "Server Info",
        ["PROFILE_PLACEID"] = "Place ID",
        ["PROFILE_JOBID"] = "Job ID",
        ["PROFILE_PLAYERS"] = "Players Online",
        ["PROFILE_PING"] = "Ping",
        ["PROFILE_FPS"] = "FPS",
        ["PROFILE_REFRESH"] = "Refresh",
        ["PROFILE_VIEW"] = "View Full Profile",
        ["PROFILE_COPYUID"] = "Copy User ID",
        ["PROFILE_COPIED"] = "Copied to clipboard",
        ["PROFILE_DAYS"] = "days",
        ["PROFILE_UNKNOWN"] = "Unknown",
        ["PROFILE_GREET"] = "User Profile",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP Visuals",
        ["ESP_DESC"] = "Box / Name / Distance / Health / Tracer",
        ["ESP_ENABLE"] = "Enable ESP",
        ["ESP_ENABLE_DESC"] = "Master switch; all drawings disappear when off",
        ["ESP_DRAW"] = "Drawings",
        ["ESP_BOX"] = "Player Box",
        ["ESP_NAME"] = "Player Name",
        ["ESP_DISTANCE"] = "Distance",
        ["ESP_HEALTH"] = "Health Bar",
        ["ESP_TRACER"] = "Tracer",
        ["ESP_NAMESEC"] = "Name Display",
        ["ESP_NAMESRC"] = "Name Source",
        ["ESP_NAMESRC_DESC"] = "Use Username if the display name shows as ???",
        ["ESP_FONT"] = "Text Font",
        ["ESP_FONT_DESC"] = "Try System / Plex / Monospace for CJK text",
        ["ESP_ASCII"] = "CJK Auto Fallback",
        ["ESP_ASCII_DESC"] = "Auto use Username when CJK is unsupported",
        ["ESP_FILTER"] = "Filters & Style",
        ["ESP_TEAM"] = "Show Team",
        ["ESP_TEAM_DESC"] = "Teammates will not be drawn",
        ["ESP_LOS"] = "Visible Only",
        ["ESP_LOS_DESC"] = "Hidden targets are skipped when on",
        ["ESP_MAXDIST"] = "Max Distance",
        ["ESP_MAXDIST_DESC"] = "Targets farther than this are skipped",
        ["ESP_THICK"] = "Line Thickness",
        ["ESP_TEXTSIZE"] = "Text Size",
        ["ESP_COLOR"] = "ESP Color",
        ["ESP_CLEAR"] = "Clear Drawings",
        ["ESP_CLEAR_DESC"] = "Click if boxes get stuck on screen",
        ["ESP_NOTSUP_TITLE"] = "ESP Unavailable",
        ["ESP_NOTSUP_MSG"] = "This executor does not support the Drawing API",
        ["ESP_CLEARED"] = "All drawings cleared",
        ["AIM_TAB"] = "Aimbot",
        ["AIM_TITLE"] = "Aimbot",
        ["AIM_DESC"] = "FOV lock · Smooth follow · Wall & team filters",
        ["AIM_ENABLE"] = "Enable Aimbot",
        ["AIM_ENABLE_DESC"] = "Always-on by default; no key needed",
        ["AIM_BASIC"] = "Basic",
        ["AIM_MODE"] = "Aim Method",
        ["AIM_MODE_DESC"] = "CFrame is stable; Mouse mimics human movement",
        ["AIM_TRIGGER"] = "Trigger Key",
        ["AIM_PART"] = "Aim Part",
        ["AIM_SMOOTH"] = "Smoothness",
        ["AIM_SMOOTH_DESC"] = "Lower = slower and more natural",
        ["AIM_FILTER"] = "Range & Filters",
        ["AIM_FOV"] = "FOV Radius",
        ["AIM_FOV_DESC"] = "Only targets within this pixel radius lock",
        ["AIM_MAXDIST"] = "Max Lock Distance",
        ["AIM_TEAM"] = "Skip Teammates",
        ["AIM_VIS"] = "Visible Only",
        ["AIM_VIS_DESC"] = "Targets behind walls are ignored when on",
        ["AIM_SHOWFOV"] = "Show FOV Circle",
        ["AIM_FOVCOLOR"] = "FOV Circle Color",
        ["AIM_RESET"] = "Reset to Defaults",
        ["AIM_RESET_MSG"] = "Defaults restored",
        ["LANG_TAB"] = "Language",
        ["LANG_TITLE"] = "Language Switch",
        ["LANG_DESC"] = "Choose the interface language",
        ["LANG_SELECT"] = "Select Language",
        ["LANG_CURRENT"] = "Current Language",
        ["LANG_APPLIED"] = "Language Applied",
        ["LANG_TIP"] = "Re-run the script if some text does not change",
        ["PROFILE_COPYJOBID"] = "Copy Server ID",
        ["PROFILE_YEARS"] = "years",
        ["PROFILE_ABOUT"] = "about",
        ["APPEARANCE_TITLE"] = "Customize Interface",
        ["APPEARANCE_DESC"] = "Personalize your experience",
        ["THEME_APPLIED"] = "Theme Applied",
        ["DARKMODE"] = "Dark Mode",
        ["DARKMODE_DESC"] = "Use dark color scheme",
        ["CREATE_THEME"] = "Create New Theme",
        ["CREATE_THEME_DLG"] = "Create Theme",
        ["COMING_SOON"] = "This feature is coming soon!",
        ["OK"] = "OK",
        ["CONFIG_SEC"] = "Configuration",
        ["CONFIG_TITLE"] = "Save and load your settings",
        ["CONFIG_NAME"] = "Config Name",
        ["CONFIG_NAME_PLACEHOLDER"] = "Enter config name",
        ["CONFIG_SAVE"] = "Save Configuration",
        ["CONFIG_SAVED"] = "Configuration saved",
        ["CONFIG_SAVE_FAIL"] = "Save failed",
        ["CONFIG_LOAD"] = "Load Configuration",
        ["CONFIG_LOADED"] = "Configuration loaded",
        ["CONFIG_LOAD_FAIL"] = "Load failed",
        ["CONFIG_EMPTY"] = "Config is empty or missing",
        ["CONFIG_LOADED_KEYS"] = "Loaded settings",
        ["CONFIG_NOTSUP"] = "ConfigManager is not available",
        ["CONFIG_AUTOSAVE"] = "Settings auto-saved",
        ["BULLET_TAB"] = "Bullet Track",
        ["BULLET_DESC"] = "Bullet tracking / hit correction",
        ["BULLET_TITLE"] = "Bullet Tracking",
        ["BULLET_HEAD_DESC"] = "Redirects shots onto the target when firing",
        ["BULLET_ENABLE"] = "Enable Bullet Track",
        ["BULLET_ENABLE_DESC"] = "Your view stays still; shots curve to the target",
        ["BULLET_BASIC"] = "Basic",
        ["BULLET_METHOD"] = "Track Method",
        ["BULLET_METHOD_DESC"] = "Ray Redirect is most universal; Hit Point covers mouse.Hit weapons",
        ["BULLET_PART"] = "Target Part",
        ["BULLET_HITCHANCE"] = "Hit Chance",
        ["BULLET_HITCHANCE_DESC"] = "Below 100 some shots miss on purpose, looks more human",
        ["BULLET_FOLLOW"] = "Follow Aimbot Target",
        ["BULLET_FOLLOW_DESC"] = "Prefer the target locked by Aimbot when it is on",
        ["BULLET_FILTER"] = "Range & Filters",
        ["BULLET_FOV"] = "Track FOV",
        ["BULLET_FOV_DESC"] = "Only targets within this pixel radius are tracked",
        ["BULLET_MAXDIST"] = "Max Track Distance",
        ["BULLET_TEAM"] = "Skip Teammates",
        ["BULLET_VIS"] = "Visible Only",
        ["BULLET_VIS_DESC"] = "Targets behind walls are ignored when on",
        ["BULLET_NOTSUP_TITLE"] = "Bullet Track Unavailable",
        ["BULLET_NOTSUP_MSG"] = "This executor lacks hook support (getrawmetatable/newcclosure)",
        ["BULLET_READY"] = "Bullet Track Ready",
        ["BULLET_READY_MSG"] = "Shot correction installed; fire to test",
        ["BULLET_RESET"] = "Reset to Defaults",
        ["BULLET_STATUS"] = "Status",
        ["BULLET_STATUS_DESC"] = "Shows whether the low-level hook is available",
        ["BULLET_WALLBANG"] = "Wallbang",
        ["BULLET_WALLBANG_DESC"] = "Shots pass through walls; no need to face the target",
        ["BULLET_WALLBANG_NOTE"] = "Wallbang on: rays only hit the target, ignoring walls",
        ["BULLET_WALLBANG_OFF"] = "Wallbang off",
        ["BULLET_SERVER_WARN"] = "If the game re-simulates shots server-side, this may be cosmetic only",
        ["BULLET_IMPL"] = "Implementation",
        ["BULLET_IMPL_DESC"] = "Hook intercepts rays (powerful, needs low-level access); Mouse snaps to target when firing (better compatibility)",
        ["BULLET_FIREKEY"] = "Fire Key",
        ["BULLET_FIREKEY_DESC"] = "In Mouse mode, snaps to target when this key is pressed",
        ["BULLET_MOUSE_READY"] = "Mouse mode ready: snaps to target when you fire",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel unavailable; falling back to camera snap",
        ["BULLET_HOOK_ONLY"] = "Only applies in Hook mode",
        ["BULLET_PROJ"] = "Projectile Redirect",
        ["BULLET_REMOTE"] = "Remote Rewrite",
        ["BULLET_PROJ_SPEED"] = "Min Projectile Speed",
        ["BULLET_PROJ_SPEED_DESC"] = "Parts slower than this are not treated as bullets",
        ["BULLET_PROJ_RANGE"] = "Detect Range",
        ["BULLET_PROJ_RANGE_DESC"] = "Only redirect projectiles appearing within this range",
        ["BULLET_PROJ_NOTE"] = "Projectile redirect on: flying projectiles curve toward the target",
        ["BULLET_HITBOX"] = "Hitbox Expander",
        ["BULLET_HITBOX_DESC"] = "Enlarges the target hitbox so rays hit more easily",
        ["BULLET_HB_MULT"] = "Hitbox Multiplier",
        ["BULLET_HB_MULT_DESC"] = "1 = original size; higher = easier to hit",
        ["BULLET_HB_PART"] = "Expand Part",
        ["BULLET_HB_NOTE"] = "Hitbox expander on",
        ["BULLET_RM_KW"] = "Name Keyword",
        ["BULLET_RM_KW_DESC"] = "Only handle remotes whose name contains this; empty = all",
        ["BULLET_RM_IDX"] = "Argument Index",
        ["BULLET_RM_IDX_DESC"] = "Which argument to replace with the target (starts at 1)",
        ["BULLET_RM_TYPE"] = "Replace With",
        ["BULLET_RM_LOG"] = "View Captured Remotes",
        ["BULLET_RM_LOG_DESC"] = "Fire first, then check which remotes the game uses",
        ["BULLET_RM_EMPTY"] = "No remote captured yet; try firing first",
        ["BULLET_RM_CAPTURED"] = "Intercepted",
        ["BULLET_RM_NOTE"] = "Remote rewrite on",
        ["T_PLAYER"] = "Target Player",
        ["T_POSITION"] = "Target Position",
        ["ESP_DRAW_EXT"] = "Extended Drawings",
        ["ESP_SKELETON"] = "Skeleton",
        ["ESP_SKELETON_DESC"] = "Draws bone lines",
        ["ESP_BOX3D"] = "3D Box",
        ["ESP_BOX3D_DESC"] = "Perspective cube box",
        ["ESP_HIGHLIGHT"] = "Native Highlight",
        ["ESP_HIGHLIGHT_DESC"] = "Uses Highlight instances; visible through walls",
        ["ESP_HEADDOT"] = "Head Dot",
        ["ESP_VIEWLINE"] = "View Line",
        ["ESP_VIEWLINE_DESC"] = "Draws a line from the head showing facing",
        ["ESP_OFFSCREEN"] = "Off-screen Arrow",
        ["ESP_OFFSCREEN_DESC"] = "Shows an edge arrow when the target is off-screen",
        ["ESP_INFO"] = "Info Display",
        ["ESP_WEAPON"] = "Show Weapon",
        ["ESP_HEALTHNUM"] = "Health Number",
        ["ESP_TARGETHL"] = "Highlight Locked Target",
        ["ESP_TARGETHL_DESC"] = "Marks the Aimbot/BulletTrack target in red",
        ["ESP_RADAR_SEC"] = "Radar",
        ["ESP_RADAR"] = "Enable Radar",
        ["ESP_RADAR_DESC"] = "Shows a 2D top-down radar in the corner",
        ["RADAR_SIZE"] = "Radar Size",
        ["RADAR_RANGE"] = "Radar Range",
        ["RADAR_RANGE_DESC"] = "How many meters the radar covers",
        ["RADAR_POS"] = "Radar Position",
        ["CAM_SEC"] = "Camera Diagnostics",
        ["CAM_CHECK"] = "Test Camera Writability",
        ["CAM_CHECK_DESC"] = "Write then read back to see if the game locks the camera",
        ["CAM_RESULT"] = "Test Result",
        ["CAM_WRITABLE"] = "Camera writable; CFrame aimbot works",
        ["CAM_LOCKED"] = "Camera locked; the game overwrites your write every frame",
        ["CAM_TYPE"] = "Camera Type",
        ["CAM_SUBJECT"] = "Camera Subject",
        ["CAM_MODE"] = "Camera Write Mode",
        ["CAM_MODE_DESC"] = "Direct write may be overwritten; Hook rewrites after the game writes",
        ["CAM_HOOK_OK"] = "Camera hook installed",
        ["CAM_HOOK_FAIL"] = "Camera hook failed (executor unsupported)",
        ["CAM_NOHOOK"] = "Cannot read camera metatable; hook mode unavailable",
        ["TB_SEC"] = "TriggerBot",
        ["TB_ENABLE"] = "Enable TriggerBot",
        ["TB_ENABLE_DESC"] = "Fires automatically when the crosshair is on an enemy",
        ["TB_METHOD"] = "Fire Method",
        ["TB_METHOD_DESC"] = "Executors support different functions; try each one",
        ["TB_DELAY"] = "Fire Delay",
        ["TB_DELAY_DESC"] = "Wait this many ms before firing; looks more human",
        ["TB_COOLDOWN"] = "Shot Cooldown",
        ["TB_COOLDOWN_DESC"] = "Minimum time between two shots",
        ["TB_BURST"] = "Burst Mode",
        ["TB_BURST_DESC"] = "Keeps firing while held, instead of one shot per click",
        ["TB_ONLYVIS"] = "Visible Targets Only",
        ["TB_HITCHK"] = "Use Bullet Target",
        ["TB_HITCHK_DESC"] = "When BulletTrack is on, use the target it locked",
        ["TB_TEST"] = "Test Fire",
        ["TB_TEST_DESC"] = "Click to test whether firing can be triggered",
        ["TB_TESTED"] = "Fire signal sent; check if the game reacted",
        ["TB_NOMETHOD"] = "No usable fire function on this executor",
        ["TB_FIRED"] = "Fired",
        ["ESP_DIAG"] = "ESP Diagnostics",
        ["ESP_DIAG_DESC"] = "Checks Drawing support and shows the latest runtime error",
        ["ESP_DIAG_RESULT"] = "Diagnostic Result",
        ["ESP_DRAWING_OK"] = "Drawing API available",
        ["ESP_DRAWING_NO"] = "Drawing API unavailable; ESP cannot draw",
        ["ESP_LASTERR"] = "Latest Error",
        ["ESP_NOERR"] = "No errors yet",
        ["ESP_STATE"] = "Runtime State",
        ["ESP_DRAWN"] = "Targets Drawn",
        ["ESP_CAMLOCKED"] = "Camera locked; all camera-based aim features are unusable",
        ["TB_ONLY_LEFT"] = "Use TriggerBot instead: fires when the crosshair is on target, no camera needed",
        ["FLY_TAB"] = "Fly",
        ["FLY_DESC"] = "Free flight and noclip movement",
        ["FLY_TITLE"] = "Flight",
        ["FLY_HEAD_DESC"] = "Driven by BodyGyro + BodyVelocity, noclip supported",
        ["FLY_ENABLE"] = "Enable Flight",
        ["FLY_ENABLE_DESC"] = "Lifts you up; direction follows your camera",
        ["FLY_NOCLIP"] = "Noclip",
        ["FLY_NOCLIP_DESC"] = "Enables noclip movement while flying",
        ["FLY_SPEED"] = "Fly Speed",
        ["FLY_SPEED_DESC"] = "Higher = faster",
        ["FLY_UP"] = "Ascend",
        ["FLY_DOWN"] = "Descend",
        ["FLY_UP_DESC"] = "Hold to keep ascending",
        ["FLY_DOWN_DESC"] = "Hold to keep descending",
        ["FLY_STOP"] = "Stop Flying",
        ["FLY_STOPPED"] = "Flight stopped",
        ["FLY_NOCHAR"] = "Character not ready; retry after respawn",
        ["FLY_STARTED"] = "Flight enabled",
        ["FLY_VERTSPD"] = "Vertical Speed",
        ["FLY_VERTSPD_DESC"] = "Distance moved per tick while holding",
        ["FLY_UNSTICK"] = "Auto Unstick on Stop",
        ["FLY_UNSTICK_DESC"] = "Detects if you are stuck in geometry and lifts you out",
        ["FLY_FORCE_RESET"] = "Force Reset Character",
        ["FLY_FORCE_RESET_DESC"] = "Click this if you cannot jump after flying",
        ["FLY_RESET_DONE"] = "Reset done; try jumping now",
        ["FLY_NOCLIP_MODE"] = "Noclip Method",
        ["FLY_NOCLIP_MODE_DESC"] = "Disable collision is most stable; Translate suits older games",
        ["ESP_UNIT"] = "Distance Unit",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud (Roblox unit)",
        ["UNIT_M"] = "m (meters)",
        ["UNIT_KM"] = "km (kilometers)",
        ["UNIT_SCALE"] = "Scale Factor",
        ["UNIT_SCALE_DESC"] = "How many meters per stud, default 0.28",
        ["THEME_SELECT"] = "Select Theme",
        ["BULLET_REMOTE_LOG_DESC"] = "Fire first, then check which remotes the game uses",
        ["MISC_TAB"] = "Utility",
        ["MISC_DESC"] = "Basic tweaks",
        ["MISC_SEC_CHAR"] = "Character",
        ["MISC_SEC_WORLD"] = "World & View",
        ["MISC_SPEED"] = "Walk Speed",
        ["MISC_SPEED_DESC"] = "Increase movement speed",
        ["MISC_JUMP"] = "Jump Power",
        ["MISC_JUMP_DESC"] = "Increase jump height",
        ["MISC_HEALTH"] = "Max Health",
        ["MISC_HEALTH_DESC"] = "Raise max health",
        ["MISC_INFJUMP"] = "Infinite Jump",
        ["MISC_INFJUMP_DESC"] = "Jump again mid-air",
        ["MISC_GRAVITY"] = "Gravity",
        ["MISC_GRAVITY_DESC"] = "Lower floats higher, default 196",
        ["MISC_NOCLIP"] = "Noclip",
        ["MISC_NOCLIP_DESC"] = "Walk through all objects",
        ["MISC_FOV"] = "Field of View",
        ["MISC_FOV_DESC"] = "Adjust view range, default 70",
        ["MISC_BRIGHT"] = "Full Bright",
        ["MISC_BRIGHT_DESC"] = "Brighten the scene",
        ["MISC_RESET"] = "Reset All",
        ["MISC_RESET_DESC"] = "Restore all original values",
        ["MISC_RESET_DONE"] = "Restored to defaults",
        ["MISC_SEC_AFK"] = "Anti-AFK & X-Ray",
        ["MISC_ANTIAFK"] = "Anti-AFK Kick",
        ["MISC_ANTIAFK_DESC"] = "Won't be kicked for idling",
        ["MISC_AFK_STATUS"] = "Anti-AFK Status",
        ["MISC_XRAY"] = "X-Ray (See Through Walls)",
        ["MISC_XRAY_DESC"] = "Makes walls transparent to see behind them",
        ["MISC_XRAY_AMT"] = "X-Ray Amount",
        ["MISC_XRAY_AMT_DESC"] = "0 = opaque, 1 = fully transparent",
        ["MISC_SEC_TP"] = "Teleport to Player",
        ["MISC_TP_SELECT"] = "Select Player",
        ["MISC_TP_SELECT_DESC"] = "Click refresh first, then pick",
        ["MISC_TP_REFRESH"] = "Refresh List",
        ["MISC_TP_REFRESHED"] = "Player list refreshed",
        ["MISC_TP_GO"] = "Teleport",
        ["MISC_TP_BEHIND"] = "Teleport Behind",
        ["MISC_TP_BEHIND_DESC"] = "Appear behind the target",
        ["MISC_TP_VEH"] = "Vehicle Mode",
        ["MISC_TP_VEH_DESC"] = "Keep seat when teleporting (use in vehicles)",
        ["MISC_TP_OK"] = "Teleported",
        ["MISC_TP_NONE"] = "No target available",
        ["MISC_TP_NOCHAR"] = "Your character is not ready",
        ["SCRIPT_SEC"] = "Scripts",
        ["SCRIPT_TAB"] = "Script Hub",
        ["SCRIPT_DESC"] = "Third-party scripts for various games",
        ["SCRIPT_CATEGORY"] = "Category",
        ["SCRIPT_CATEGORY_DESC"] = "Pick a category first",
        ["SCRIPT_SELECT"] = "Select Script",
        ["SCRIPT_SELECT_DESC"] = "Then click load below",
        ["SCRIPT_INFO"] = "Script Info",
        ["SCRIPT_INFO_EMPTY"] = "No script selected",
        ["SCRIPT_LOAD"] = "Load Script",
        ["SCRIPT_LOAD_DESC"] = "Runs the selected script",
        ["SCRIPT_COPY"] = "Copy URL",
        ["SCRIPT_COPY_DESC"] = "Copy the script URL to clipboard",
        ["SCRIPT_CONFIRM_TITLE"] = "Confirm Load",
        ["SCRIPT_CONFIRM_BODY"] = "About to run a third-party script. Untrusted code is risky. Continue?",
        ["SCRIPT_LOADING"] = "Loading…",
        ["SCRIPT_LOADED"] = "Script executed",
        ["SCRIPT_FAILED"] = "Failed; check URL or network",
        ["SCRIPT_NO_URL"] = "This script has no URL",
        ["SCRIPT_COPIED"] = "URL copied",
        ["SCRIPT_CUSTOM_SEC"] = "Custom Script",
        ["SCRIPT_CUSTOM_URL"] = "Script URL",
        ["SCRIPT_CUSTOM_URL_DESC"] = "Paste a raw or gist direct link",
        ["SCRIPT_CUSTOM_LOAD"] = "Load Custom",
        ["SCRIPT_CUSTOM_EMPTY"] = "Enter a URL first",
        ["SCRIPT_GUIDE"] = "How to Add",
        ["SCRIPT_GUIDE_DESC"] = "See the SCRIPT_LIB array at the top of the hub code",
        ["CANCEL"] = "Cancel",
    },
    ["ja"] = {
        ["PROFILE_TAB"] = "紹介",
        ["PROFILE_DESC"] = "スクリプト説明とサーバー状態",
        ["PROFILE_BASIC"] = "基本情報",
        ["PROFILE_USERNAME"] = "ユーザー名",
        ["PROFILE_DISPLAYNAME"] = "表示名",
        ["PROFILE_UID"] = "ユーザー ID",
        ["PROFILE_ACCOUNTAGE"] = "アカウント年数",
        ["PROFILE_SERVER"] = "サーバー情報",
        ["PROFILE_PLACEID"] = "プレイス ID",
        ["PROFILE_JOBID"] = "ジョブ ID",
        ["PROFILE_PLAYERS"] = "オンライン人数",
        ["PROFILE_PING"] = "遅延",
        ["PROFILE_FPS"] = "FPS",
        ["PROFILE_REFRESH"] = "情報を更新",
        ["PROFILE_VIEW"] = "完全なプロフィールを表示",
        ["PROFILE_COPYUID"] = "ユーザー ID をコピー",
        ["PROFILE_COPIED"] = "クリップボードにコピー済み",
        ["PROFILE_DAYS"] = "日",
        ["PROFILE_UNKNOWN"] = "不明",
        ["PROFILE_GREET"] = "ユーザー资料",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP 視覚機能",
        ["ESP_DESC"] = "ボックス / 名前 / 距離 / 体力 / トレーサー",
        ["ESP_ENABLE"] = "ESP を有効化",
        ["ESP_ENABLE_DESC"] = "マスタースイッチ。オフで全描画が消えます",
        ["ESP_DRAW"] = "描画項目",
        ["ESP_BOX"] = "プレイヤーボックス",
        ["ESP_NAME"] = "プレイヤー名",
        ["ESP_DISTANCE"] = "距離",
        ["ESP_HEALTH"] = "体力バー",
        ["ESP_TRACER"] = "トレーサー",
        ["ESP_NAMESEC"] = "名前表示",
        ["ESP_NAMESRC"] = "名前の来源",
        ["ESP_NAMESRC_DESC"] = "表示名が文字化けする場合はユーザー名を使用",
        ["ESP_FONT"] = "フォント",
        ["ESP_FONT_DESC"] = "中国語を表示するには System / Plex / Monospace を試してください",
        ["ESP_ASCII"] = "中国語自動フォールバック",
        ["ESP_ASCII_DESC"] = "中国語が未対応の場合は自動的にユーザー名",
        ["ESP_FILTER"] = "フィルターとスタイル",
        ["ESP_TEAM"] = "チームを表示",
        ["ESP_TEAM_DESC"] = "オンのとき同チームは描画しません",
        ["ESP_LOS"] = "可視のみ",
        ["ESP_LOS_DESC"] = "オンのとき壁の裏は非表示",
        ["ESP_MAXDIST"] = "最大距離",
        ["ESP_MAXDIST_DESC"] = "この距離を超えると描画しません",
        ["ESP_THICK"] = "線の太さ",
        ["ESP_TEXTSIZE"] = "文字サイズ",
        ["ESP_COLOR"] = "ESP の色",
        ["ESP_CLEAR"] = "描画をクリア",
        ["ESP_CLEAR_DESC"] = "枠が残ったらクリック",
        ["ESP_NOTSUP_TITLE"] = "ESP 利用不可",
        ["ESP_NOTSUP_MSG"] = "この実行環境は Drawing API に非対応です",
        ["ESP_CLEARED"] = "全描画をクリアしました",
        ["AIM_TAB"] = "エイムボット",
        ["AIM_TITLE"] = "エイムボット",
        ["AIM_DESC"] = "FOV ロック · スムーズ追従 · 壁/チーム判定",
        ["AIM_ENABLE"] = "エイムボットを有効化",
        ["AIM_ENABLE_DESC"] = "既定は常時オン。キー不要",
        ["AIM_BASIC"] = "基本設定",
        ["AIM_MODE"] = "エイム方式",
        ["AIM_MODE_DESC"] = "CFrame は安定、Mouse は人間の動きを模倣",
        ["AIM_TRIGGER"] = "トリガーキー",
        ["AIM_PART"] = "エイム部位",
        ["AIM_SMOOTH"] = "スムーズ度",
        ["AIM_SMOOTH_DESC"] = "低いほど遅く自然",
        ["AIM_FILTER"] = "範囲とフィルター",
        ["AIM_FOV"] = "FOV 半径",
        ["AIM_FOV_DESC"] = "このピクセル半径内のみロック",
        ["AIM_MAXDIST"] = "最大ロック距離",
        ["AIM_TEAM"] = "チームメイトを除外",
        ["AIM_VIS"] = "可視のみ",
        ["AIM_VIS_DESC"] = "オンのとき壁の裏はロックしません",
        ["AIM_SHOWFOV"] = "FOV サークルを表示",
        ["AIM_FOVCOLOR"] = "FOV サークルの色",
        ["AIM_RESET"] = "既定値にリセット",
        ["AIM_RESET_MSG"] = "既定値に戻しました",
        ["LANG_TAB"] = "言語",
        ["LANG_TITLE"] = "言語切り替え",
        ["LANG_DESC"] = "表示言語を選択",
        ["LANG_SELECT"] = "言語を選択",
        ["LANG_CURRENT"] = "現在の言語",
        ["LANG_APPLIED"] = "言語を切り替えました",
        ["LANG_TIP"] = "一部の文字が変わらない場合は再実行してください",
        ["PROFILE_COPYJOBID"] = "サーバー ID をコピー",
        ["PROFILE_YEARS"] = "年",
        ["PROFILE_ABOUT"] = "約",
        ["APPEARANCE_TITLE"] = "インターフェースのカスタマイズ",
        ["APPEARANCE_DESC"] = "あなたの体験をカスタマイズ",
        ["THEME_APPLIED"] = "テーマを適用しました",
        ["DARKMODE"] = "ダークモード",
        ["DARKMODE_DESC"] = "暗い配色を使用",
        ["CREATE_THEME"] = "新しいテーマを作成",
        ["CREATE_THEME_DLG"] = "テーマを作成",
        ["COMING_SOON"] = "この機能は近日公開予定です！",
        ["OK"] = "OK",
        ["CONFIG_SEC"] = "設定管理",
        ["CONFIG_TITLE"] = "設定の保存と読み込み",
        ["CONFIG_NAME"] = "設定名",
        ["CONFIG_NAME_PLACEHOLDER"] = "設定名を入力",
        ["CONFIG_SAVE"] = "設定を保存",
        ["CONFIG_SAVED"] = "設定を保存しました",
        ["CONFIG_SAVE_FAIL"] = "保存に失敗",
        ["CONFIG_LOAD"] = "設定を読み込む",
        ["CONFIG_LOADED"] = "設定を読み込みました",
        ["CONFIG_LOAD_FAIL"] = "読み込みに失敗",
        ["CONFIG_EMPTY"] = "設定が空または存在しません",
        ["CONFIG_LOADED_KEYS"] = "読み込んだ設定",
        ["CONFIG_NOTSUP"] = "ConfigManager を利用できません",
        ["CONFIG_AUTOSAVE"] = "設定を自動保存しました",
        ["BULLET_TAB"] = "バレット追跡",
        ["BULLET_DESC"] = "弾道追跡 / 命中補正",
        ["BULLET_TITLE"] = "バレット追跡",
        ["BULLET_HEAD_DESC"] = "発射時に弾道を対象へ補正",
        ["BULLET_ENABLE"] = "バレット追跡を有効化",
        ["BULLET_ENABLE_DESC"] = "視点は動かず、弾が対象へ飛ぶ",
        ["BULLET_BASIC"] = "基本設定",
        ["BULLET_METHOD"] = "追跡方式",
        ["BULLET_METHOD_DESC"] = "レイ重定向が最も汎用。命中点は mouse.Hit 武器向け",
        ["BULLET_PART"] = "追跡部位",
        ["BULLET_HITCHANCE"] = "命中率",
        ["BULLET_HITCHANCE_DESC"] = "100 未満は意図的に外れ、人間らしく見えます",
        ["BULLET_FOLLOW"] = "エイムボットの対象に追従",
        ["BULLET_FOLLOW_DESC"] = "エイムボットがオンならその対象を優先",
        ["BULLET_FILTER"] = "範囲とフィルター",
        ["BULLET_FOV"] = "追跡 FOV",
        ["BULLET_FOV_DESC"] = "このピクセル半径内の対象のみ追跡",
        ["BULLET_MAXDIST"] = "最大追跡距離",
        ["BULLET_TEAM"] = "チームメイトを除外",
        ["BULLET_VIS"] = "可視のみ",
        ["BULLET_VIS_DESC"] = "オンのとき壁の裏は追跡しません",
        ["BULLET_NOTSUP_TITLE"] = "バレット追跡利用不可",
        ["BULLET_NOTSUP_MSG"] = "この実行環境は hook に非対応です",
        ["BULLET_READY"] = "バレット追跡の準備完了",
        ["BULLET_READY_MSG"] = "弾道補正を導入しました。発射で確認できます",
        ["BULLET_RESET"] = "既定値にリセット",
        ["BULLET_STATUS"] = "動作状態",
        ["BULLET_STATUS_DESC"] = "低レベル hook が使えるか表示",
        ["BULLET_WALLBANG"] = "壁抜き",
        ["BULLET_WALLBANG_DESC"] = "壁を貫通して命中。対象に向く必要なし",
        ["BULLET_WALLBANG_NOTE"] = "壁抜きオン：レイは対象のみ命中、壁は無視",
        ["BULLET_WALLBANG_OFF"] = "壁抜きオフ",
        ["BULLET_SERVER_WARN"] = "サーバー側で再計算される場合、見た目のみの可能性",
        ["BULLET_IMPL"] = "実装方式",
        ["BULLET_IMPL_DESC"] = "Hook はレイを傍受（高機能・低レベル権限が必要）、Mouse は発射時に照準を合わせる（互換性が高い）",
        ["BULLET_FIREKEY"] = "発射キー",
        ["BULLET_FIREKEY_DESC"] = "Mouse モードではこのキーで発射時に照準を合わせる",
        ["BULLET_MOUSE_READY"] = "Mouse モード準備完了：発射時に自動照準",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel 利用不可。カメラ瞬間移動に切替",
        ["BULLET_HOOK_ONLY"] = "この項目は Hook モードのみ有効",
        ["BULLET_PROJ"] = "投射物重定向",
        ["BULLET_REMOTE"] = "Remote 書き換え",
        ["BULLET_PROJ_SPEED"] = "最小弾速",
        ["BULLET_PROJ_SPEED_DESC"] = "この速度未満の Part は弾とみなさない",
        ["BULLET_PROJ_RANGE"] = "検出範囲",
        ["BULLET_PROJ_RANGE_DESC"] = "この範囲内に現れた弾のみ重定向",
        ["BULLET_PROJ_NOTE"] = "投射物重定向オン：飛行中の弾が対象へ曲がる",
        ["BULLET_HITBOX"] = "Hitbox 拡大",
        ["BULLET_HITBOX_DESC"] = "対象のヒットボックスを拡大し、射線が当たりやすくなる",
        ["BULLET_HB_MULT"] = "拡大倍率",
        ["BULLET_HB_MULT_DESC"] = "1 = 元のサイズ。大きいほど当たりやすい",
        ["BULLET_HB_PART"] = "拡大部位",
        ["BULLET_HB_NOTE"] = "Hitbox 拡大オン",
        ["BULLET_RM_KW"] = "名前キーワード",
        ["BULLET_RM_KW_DESC"] = "この語を含む Remote のみ処理。空欄なら全て",
        ["BULLET_RM_IDX"] = "引数の位置",
        ["BULLET_RM_IDX_DESC"] = "何番目の引数を対象に置換するか（1 から）",
        ["BULLET_RM_TYPE"] = "置換内容",
        ["BULLET_RM_LOG"] = "捕捉した Remote を表示",
        ["BULLET_RM_LOG_DESC"] = "発射してから押すと使用 Remote が分かります",
        ["BULLET_RM_EMPTY"] = "まだ Remote を捕捉していません。先に発射",
        ["BULLET_RM_CAPTURED"] = "捕捉済み",
        ["BULLET_RM_NOTE"] = "Remote 書き換えオン",
        ["T_PLAYER"] = "対象プレイヤー",
        ["T_POSITION"] = "対象座標",
        ["ESP_DRAW_EXT"] = "拡張描画",
        ["ESP_SKELETON"] = "スケルトン",
        ["ESP_SKELETON_DESC"] = "骨の線を描画",
        ["ESP_BOX3D"] = "3D ボックス",
        ["ESP_BOX3D_DESC"] = "透視のある立方体",
        ["ESP_HIGHLIGHT"] = "ネイティブハイライト",
        ["ESP_HIGHLIGHT_DESC"] = "Highlight インスタンスで壁越しに表示",
        ["ESP_HEADDOT"] = "頭上ドット",
        ["ESP_VIEWLINE"] = "視線ライン",
        ["ESP_VIEWLINE_DESC"] = "頭から向きを示す線を描画",
        ["ESP_OFFSCREEN"] = "画面外矢印",
        ["ESP_OFFSCREEN_DESC"] = "対象が画面外のとき矢印を表示",
        ["ESP_INFO"] = "情報表示",
        ["ESP_WEAPON"] = "所持武器を表示",
        ["ESP_HEALTHNUM"] = "体力数値",
        ["ESP_TARGETHL"] = "ロック対象を強調",
        ["ESP_TARGETHL_DESC"] = "エイム/子追の対象を赤で強調",
        ["ESP_RADAR_SEC"] = "レーダー",
        ["ESP_RADAR"] = "レーダーを有効化",
        ["ESP_RADAR_DESC"] = "隅に 2D レーダーを表示",
        ["RADAR_SIZE"] = "レーダーサイズ",
        ["RADAR_RANGE"] = "レーダー範囲",
        ["RADAR_RANGE_DESC"] = "レーダーが何メートルを覆うか",
        ["RADAR_POS"] = "レーダー位置",
        ["CAM_SEC"] = "カメラ診断",
        ["CAM_CHECK"] = "カメラ書き込みを検証",
        ["CAM_CHECK_DESC"] = "書き込んで読み戻し、ロック状態を判定",
        ["CAM_RESULT"] = "検証結果",
        ["CAM_WRITABLE"] = "カメラ書き込み可。CFrame エイム可",
        ["CAM_LOCKED"] = "カメラはロック。毎フレーム上書きされます",
        ["CAM_TYPE"] = "カメラタイプ",
        ["CAM_SUBJECT"] = "カメラ対象",
        ["CAM_MODE"] = "カメラ書き込み方式",
        ["CAM_MODE_DESC"] = "直接書きは上書きされる可能性。Hook は後に書き換え",
        ["CAM_HOOK_OK"] = "カメラ Hook 導入済み",
        ["CAM_HOOK_FAIL"] = "カメラ Hook 失敗（非対応）",
        ["CAM_NOHOOK"] = "カメラのメタテーブルを読めません",
        ["TB_SEC"] = "自動射擊",
        ["TB_ENABLE"] = "自動射擊を有効化",
        ["TB_ENABLE_DESC"] = "照準が敵に合うと自動発射",
        ["TB_METHOD"] = "発射方式",
        ["TB_METHOD_DESC"] = "実行環境により対応関数が異なります",
        ["TB_DELAY"] = "発射遅延",
        ["TB_DELAY_DESC"] = "照準後このミリ秒待ってから発射",
        ["TB_COOLDOWN"] = "発射間隔",
        ["TB_COOLDOWN_DESC"] = "2 発の最小間隔",
        ["TB_BURST"] = "バーストモード",
        ["TB_BURST_DESC"] = "押している間連続発射",
        ["TB_ONLYVIS"] = "可視目標のみ",
        ["TB_HITCHK"] = "子追対象を使用",
        ["TB_HITCHK_DESC"] = "子追オンならその対象を優先",
        ["TB_TEST"] = "発射テスト",
        ["TB_TEST_DESC"] = "押して発射できるか確認",
        ["TB_TESTED"] = "発射シグナル送信。反応を確認",
        ["TB_NOMETHOD"] = "利用可能な発射関数がありません",
        ["TB_FIRED"] = "発射しました",
        ["ESP_DIAG"] = "ESP 診断",
        ["ESP_DIAG_DESC"] = "Drawing 利用可否と直近のエラーを表示",
        ["ESP_DIAG_RESULT"] = "診断結果",
        ["ESP_DRAWING_OK"] = "Drawing API 利用可",
        ["ESP_DRAWING_NO"] = "Drawing API 利用不可。ESP 描画不可",
        ["ESP_LASTERR"] = "直近のエラー",
        ["ESP_NOERR"] = "エラーなし",
        ["ESP_STATE"] = "実行状態",
        ["ESP_DRAWN"] = "描画中の対象数",
        ["ESP_CAMLOCKED"] = "カメラがロック。視点系機能は利用不可",
        ["TB_ONLY_LEFT"] = "代わりに自動射撃を使用。視点不要",
        ["FLY_TAB"] = "飛行",
        ["FLY_DESC"] = "自由飛行と壁抜き移動",
        ["FLY_TITLE"] = "飛行",
        ["FLY_HEAD_DESC"] = "BodyGyro + BodyVelocity 駆動、壁抜き対応",
        ["FLY_ENABLE"] = "飛行を有効化",
        ["FLY_ENABLE_DESC"] = "オンで上昇。向きはカメラ追従",
        ["FLY_NOCLIP"] = "壁抜き",
        ["FLY_NOCLIP_DESC"] = "飛行中に壁抜きも有効",
        ["FLY_SPEED"] = "飛行速度",
        ["FLY_SPEED_DESC"] = "大きいほど速い",
        ["FLY_UP"] = "上昇",
        ["FLY_DOWN"] = "下降",
        ["FLY_UP_DESC"] = "押している間上昇",
        ["FLY_DOWN_DESC"] = "押している間下降",
        ["FLY_STOP"] = "飛行停止",
        ["FLY_STOPPED"] = "飛行を停止しました",
        ["FLY_NOCHAR"] = "キャラ未準備。復活後に再試行",
        ["FLY_STARTED"] = "飛行を開始しました",
        ["FLY_VERTSPD"] = "昇降速度",
        ["FLY_VERTSPD_DESC"] = "昇降ボタン押下時の1回の移動距離",
        ["FLY_UNSTICK"] = "停止時に自動脱出",
        ["FLY_UNSTICK_DESC"] = "実体に埋まっているか判定して引き上げ",
        ["FLY_FORCE_RESET"] = "強制リセット",
        ["FLY_FORCE_RESET_DESC"] = "飛行後にジャンプできない時はこれ",
        ["FLY_RESET_DONE"] = "リセット完了。ジャンプを試して",
        ["FLY_NOCLIP_MODE"] = "壁抜き方式",
        ["FLY_NOCLIP_MODE_DESC"] = "衝突オフが最も安定。Translate は古いゲーム向け",
        ["ESP_UNIT"] = "距離単位",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud（Roblox 単位）",
        ["UNIT_M"] = "m（メートル）",
        ["UNIT_KM"] = "km（キロメートル）",
        ["UNIT_SCALE"] = "換算比率",
        ["UNIT_SCALE_DESC"] = "1 stud は何メートルか、既定 0.28",
        ["THEME_SELECT"] = "テーマ選択",
        ["BULLET_REMOTE_LOG_DESC"] = "発射してから押すと使用 Remote が分かります",
        ["MISC_TAB"] = "ユーティリティ",
        ["MISC_DESC"] = "基本パラメータ変更",
        ["MISC_SEC_CHAR"] = "キャラクター",
        ["MISC_SEC_WORLD"] = "世界と視野",
        ["MISC_SPEED"] = "移動速度",
        ["MISC_SPEED_DESC"] = "移動速度を上げる",
        ["MISC_JUMP"] = "ジャンプ力",
        ["MISC_JUMP_DESC"] = "ジャンプの高さを上げる",
        ["MISC_HEALTH"] = "最大体力",
        ["MISC_HEALTH_DESC"] = "最大体力を上げる",
        ["MISC_INFJUMP"] = "無限ジャンプ",
        ["MISC_INFJUMP_DESC"] = "空中でもジャンプ可能",
        ["MISC_GRAVITY"] = "重力",
        ["MISC_GRAVITY_DESC"] = "小さいほど高く浮く、既定 196",
        ["MISC_NOCLIP"] = "壁抜き",
        ["MISC_NOCLIP_DESC"] = "すべてをすり抜ける",
        ["MISC_FOV"] = "視野 FOV",
        ["MISC_FOV_DESC"] = "視野範囲を調整、既定 70",
        ["MISC_BRIGHT"] = "明るさ最大化",
        ["MISC_BRIGHT_DESC"] = "画面を明るくする",
        ["MISC_RESET"] = "すべてリセット",
        ["MISC_RESET_DESC"] = "すべての値を元に戻す",
        ["MISC_RESET_DONE"] = "既定値に戻しました",
        ["MISC_SEC_AFK"] = "AFK対策と透視",
        ["MISC_ANTIAFK"] = "AFK キック回避",
        ["MISC_ANTIAFK_DESC"] = "放置してもキックされない",
        ["MISC_AFK_STATUS"] = "AFK 対策状況",
        ["MISC_XRAY"] = "透視（壁を透明化）",
        ["MISC_XRAY_DESC"] = "壁を透明にして裏側が見える",
        ["MISC_XRAY_AMT"] = "透視の度合い",
        ["MISC_XRAY_AMT_DESC"] = "0 = 不透明、1 = 完全透明",
        ["MISC_SEC_TP"] = "プレイヤーへテレポート",
        ["MISC_TP_SELECT"] = "プレイヤー選択",
        ["MISC_TP_SELECT_DESC"] = "更新してから選択",
        ["MISC_TP_REFRESH"] = "リスト更新",
        ["MISC_TP_REFRESHED"] = "リストを更新しました",
        ["MISC_TP_GO"] = "テレポート",
        ["MISC_TP_BEHIND"] = "背後へテレポート",
        ["MISC_TP_BEHIND_DESC"] = "相手の背後に出現",
        ["MISC_TP_VEH"] = "ビークルモード",
        ["MISC_TP_VEH_DESC"] = "テレポート時に座席を維持",
        ["MISC_TP_OK"] = "テレポートしました",
        ["MISC_TP_NONE"] = "対象がいません",
        ["MISC_TP_NOCHAR"] = "自分のキャラが未準備",
        ["SCRIPT_SEC"] = "スクリプト",
        ["SCRIPT_TAB"] = "スクリプト集",
        ["SCRIPT_DESC"] = "各ゲームのサードパーティ製スクリプト",
        ["SCRIPT_CATEGORY"] = "カテゴリ",
        ["SCRIPT_CATEGORY_DESC"] = "先にカテゴリを選択",
        ["SCRIPT_SELECT"] = "スクリプト選択",
        ["SCRIPT_SELECT_DESC"] = "選択して読み込む",
        ["SCRIPT_INFO"] = "スクリプト情報",
        ["SCRIPT_INFO_EMPTY"] = "未選択",
        ["SCRIPT_LOAD"] = "スクリプト読込",
        ["SCRIPT_LOAD_DESC"] = "選択したスクリプトを実行",
        ["SCRIPT_COPY"] = "リンクをコピー",
        ["SCRIPT_COPY_DESC"] = "URL をクリップボードにコピー",
        ["SCRIPT_CONFIRM_TITLE"] = "読込確認",
        ["SCRIPT_CONFIRM_BODY"] = "サードパーティ製を実行します。続けますか？",
        ["SCRIPT_LOADING"] = "読込中…",
        ["SCRIPT_LOADED"] = "スクリプト実行完了",
        ["SCRIPT_FAILED"] = "失敗。URL/通信を確認",
        ["SCRIPT_NO_URL"] = "このスクリプトは URL 未設定",
        ["SCRIPT_COPIED"] = "リンクをコピーしました",
        ["SCRIPT_CUSTOM_SEC"] = "カスタムスクリプト",
        ["SCRIPT_CUSTOM_URL"] = "スクリプト URL",
        ["SCRIPT_CUSTOM_URL_DESC"] = "raw / gist の直リンクを貼付",
        ["SCRIPT_CUSTOM_LOAD"] = "カスタムを読込",
        ["SCRIPT_CUSTOM_EMPTY"] = "先に URL を入力",
        ["SCRIPT_GUIDE"] = "追加方法",
        ["SCRIPT_GUIDE_DESC"] = "ハブ上部の SCRIPT_LIB を参照",
        ["CANCEL"] = "キャンセル",
    },
    ["ko"] = {
        ["PROFILE_TAB"] = "소개",
        ["PROFILE_DESC"] = "스크립트説明 및 서버 상태",
        ["PROFILE_BASIC"] = "기본 정보",
        ["PROFILE_USERNAME"] = "사용자명",
        ["PROFILE_DISPLAYNAME"] = "표시 이름",
        ["PROFILE_UID"] = "사용자 ID",
        ["PROFILE_ACCOUNTAGE"] = "계정 나이",
        ["PROFILE_SERVER"] = "서버 정보",
        ["PROFILE_PLACEID"] = "장소 ID",
        ["PROFILE_JOBID"] = "서버 ID",
        ["PROFILE_PLAYERS"] = "접속자 수",
        ["PROFILE_PING"] = "핑",
        ["PROFILE_FPS"] = "FPS",
        ["PROFILE_REFRESH"] = "새로고침",
        ["PROFILE_VIEW"] = "전체 프로필 보기",
        ["PROFILE_COPYUID"] = "사용자 ID 복사",
        ["PROFILE_COPIED"] = "클립보드에 복사됨",
        ["PROFILE_DAYS"] = "일",
        ["PROFILE_UNKNOWN"] = "알 수 없음",
        ["PROFILE_GREET"] = "프로필",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP 시각 기능",
        ["ESP_DESC"] = "박스 / 이름 / 거리 / 체력 / 추적선",
        ["ESP_ENABLE"] = "ESP 활성화",
        ["ESP_ENABLE_DESC"] = "마스터 스위치, 끄면 모든 그리기가 사라집니다",
        ["ESP_DRAW"] = "그리기 항목",
        ["ESP_BOX"] = "플레이어 박스",
        ["ESP_NAME"] = "플레이어 이름",
        ["ESP_DISTANCE"] = "거리",
        ["ESP_HEALTH"] = "체력 바",
        ["ESP_TRACER"] = "추적선",
        ["ESP_NAMESEC"] = "이름 표시",
        ["ESP_NAMESRC"] = "이름 출처",
        ["ESP_NAMESRC_DESC"] = "표시 이름이 깨지면 사용자명 사용",
        ["ESP_FONT"] = "글꼴",
        ["ESP_FONT_DESC"] = "중국어 표시는 System / Plex / Monospace 시도",
        ["ESP_ASCII"] = "중국어 자동 폴백",
        ["ESP_ASCII_DESC"] = "중국어 미지원 시 자동으로 사용자명",
        ["ESP_FILTER"] = "필터 및 스타일",
        ["ESP_TEAM"] = "팀 표시",
        ["ESP_TEAM_DESC"] = "켜면 같은 팀은 그리지 않음",
        ["ESP_LOS"] = "보이는 대상만",
        ["ESP_LOS_DESC"] = "켜면 벽 뒤는 표시 안 함",
        ["ESP_MAXDIST"] = "최대 거리",
        ["ESP_MAXDIST_DESC"] = "이 거리를 넘으면 그리지 않음",
        ["ESP_THICK"] = "선 굵기",
        ["ESP_TEXTSIZE"] = "글자 크기",
        ["ESP_COLOR"] = "ESP 색상",
        ["ESP_CLEAR"] = "그리기 정리",
        ["ESP_CLEAR_DESC"] = "상자가 남으면 클릭",
        ["ESP_NOTSUP_TITLE"] = "ESP 사용 불가",
        ["ESP_NOTSUP_MSG"] = "이 실행 환경은 Drawing API를 지원하지 않습니다",
        ["ESP_CLEARED"] = "모든 그리기를 정리했습니다",
        ["AIM_TAB"] = "에임봇",
        ["AIM_TITLE"] = "에임봇",
        ["AIM_DESC"] = "FOV 고정 · 부드러운 추적 · 벽/팀 필터",
        ["AIM_ENABLE"] = "에임봇 활성화",
        ["AIM_ENABLE_DESC"] = "기본 상시 작동, 키 필요 없음",
        ["AIM_BASIC"] = "기본 설정",
        ["AIM_MODE"] = "에임 방식",
        ["AIM_MODE_DESC"] = "CFrame 안정적, Mouse 사람처럼",
        ["AIM_TRIGGER"] = "트리거 키",
        ["AIM_PART"] = "에임 부위",
        ["AIM_SMOOTH"] = "부드러움",
        ["AIM_SMOOTH_DESC"] = "낮을수록 느리고 자연스러움",
        ["AIM_FILTER"] = "범위 및 필터",
        ["AIM_FOV"] = "FOV 반경",
        ["AIM_FOV_DESC"] = "이 픽셀 반경 내에서만 고정",
        ["AIM_MAXDIST"] = "최대 고정 거리",
        ["AIM_TEAM"] = "팀원 건너뛰기",
        ["AIM_VIS"] = "보이는 대상만",
        ["AIM_VIS_DESC"] = "켜면 벽 뒤는 고정 안 함",
        ["AIM_SHOWFOV"] = "FOV 원 표시",
        ["AIM_FOVCOLOR"] = "FOV 원 색상",
        ["AIM_RESET"] = "기본값으로 초기화",
        ["AIM_RESET_MSG"] = "기본값으로 복원됨",
        ["LANG_TAB"] = "언어",
        ["LANG_TITLE"] = "언어 전환",
        ["LANG_DESC"] = "표시 언어 선택",
        ["LANG_SELECT"] = "언어 선택",
        ["LANG_CURRENT"] = "현재 언어",
        ["LANG_APPLIED"] = "언어가 변경됨",
        ["LANG_TIP"] = "일부 텍스트가 안 바뀌면 스크립트 재실행",
        ["PROFILE_COPYJOBID"] = "서버 ID 복사",
        ["PROFILE_YEARS"] = "년",
        ["PROFILE_ABOUT"] = "약",
        ["APPEARANCE_TITLE"] = "인터페이스 사용자화",
        ["APPEARANCE_DESC"] = "사용자 경험을 개인화",
        ["THEME_APPLIED"] = "테마 적용됨",
        ["DARKMODE"] = "다크 모드",
        ["DARKMODE_DESC"] = "어두운 색 구성 사용",
        ["CREATE_THEME"] = "새 테마 만들기",
        ["CREATE_THEME_DLG"] = "테마 만들기",
        ["COMING_SOON"] = "이 기능은 곧 출시됩니다!",
        ["OK"] = "확인",
        ["CONFIG_SEC"] = "설정 관리",
        ["CONFIG_TITLE"] = "설정 저장 및 불러오기",
        ["CONFIG_NAME"] = "설정 이름",
        ["CONFIG_NAME_PLACEHOLDER"] = "설정 이름 입력",
        ["CONFIG_SAVE"] = "설정 저장",
        ["CONFIG_SAVED"] = "설정이 저장됨",
        ["CONFIG_SAVE_FAIL"] = "저장 실패",
        ["CONFIG_LOAD"] = "설정 불러오기",
        ["CONFIG_LOADED"] = "설정을 불러왔습니다",
        ["CONFIG_LOAD_FAIL"] = "불러오기 실패",
        ["CONFIG_EMPTY"] = "설정이 비어있거나 없음",
        ["CONFIG_LOADED_KEYS"] = "불러온 설정",
        ["CONFIG_NOTSUP"] = "ConfigManager를 사용할 수 없음",
        ["CONFIG_AUTOSAVE"] = "설정이 자동 저장됨",
        ["BULLET_TAB"] = "탄환 추적",
        ["BULLET_DESC"] = "탄환 추적 / 명중 보정",
        ["BULLET_TITLE"] = "탄환 추적",
        ["BULLET_HEAD_DESC"] = "발사 시 탄도를 대상으로 보정",
        ["BULLET_ENABLE"] = "탄환 추적 활성화",
        ["BULLET_ENABLE_DESC"] = "시점 고정, 탄환이 대상으로",
        ["BULLET_BASIC"] = "기본 설정",
        ["BULLET_METHOD"] = "추적 방식",
        ["BULLET_METHOD_DESC"] = "레이 리다이렉트가 가장 범용, 히트포인트는 mouse.Hit 무기용",
        ["BULLET_PART"] = "추적 부위",
        ["BULLET_HITCHANCE"] = "명중률",
        ["BULLET_HITCHANCE_DESC"] = "100 미만은 의도적으로 빗나가 사람처럼 보임",
        ["BULLET_FOLLOW"] = "에임봇 대상 따르기",
        ["BULLET_FOLLOW_DESC"] = "에임봇이 켜지면 그 대상 우선",
        ["BULLET_FILTER"] = "범위 및 필터",
        ["BULLET_FOV"] = "추적 FOV",
        ["BULLET_FOV_DESC"] = "이 픽셀 반경 내 대상만 추적",
        ["BULLET_MAXDIST"] = "최대 추적 거리",
        ["BULLET_TEAM"] = "팀원 건너뛰기",
        ["BULLET_VIS"] = "보이는 대상만",
        ["BULLET_VIS_DESC"] = "켜면 벽 뒤 대상은 추적 안 함",
        ["BULLET_NOTSUP_TITLE"] = "탄환 추적 사용 불가",
        ["BULLET_NOTSUP_MSG"] = "이 실행 환경은 hook을 지원하지 않습니다",
        ["BULLET_READY"] = "탄환 추적 준비 완료",
        ["BULLET_READY_MSG"] = "탄도 보정 설치됨, 발사로 확인",
        ["BULLET_RESET"] = "기본값으로 초기화",
        ["BULLET_STATUS"] = "상태",
        ["BULLET_STATUS_DESC"] = "저수준 hook 사용 가능 여부 표시",
        ["BULLET_WALLBANG"] = "벽 관통",
        ["BULLET_WALLBANG_DESC"] = "벽을 관통해 명중, 대상을 향할 필요 없음",
        ["BULLET_WALLBANG_NOTE"] = "벽 관통 켜짐: 레이는 대상만 명중, 벽 무시",
        ["BULLET_WALLBANG_OFF"] = "벽 관통 꺼짐",
        ["BULLET_SERVER_WARN"] = "서버에서 재계산하면 외형만 바뀔 수 있음",
        ["BULLET_IMPL"] = "구현 방식",
        ["BULLET_IMPL_DESC"] = "Hook은 레이 가로채기(강력, 저수준 권한 필요), Mouse는 발사 시 조준(호환성 좋음)",
        ["BULLET_FIREKEY"] = "발사 키",
        ["BULLET_FIREKEY_DESC"] = "Mouse 모드에서 이 키 입력 시 조준",
        ["BULLET_MOUSE_READY"] = "Mouse 모드 준비 완료: 발사 시 자동 조준",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel 사용 불가, 카메라 즉시 이동으로 대체",
        ["BULLET_HOOK_ONLY"] = "Hook 모드에서만 적용",
        ["BULLET_PROJ"] = "투사체 리다이렉트",
        ["BULLET_REMOTE"] = "Remote 재작성",
        ["BULLET_PROJ_SPEED"] = "최소 투사체 속도",
        ["BULLET_PROJ_SPEED_DESC"] = "이 속도 미만 Part는 탄환으로 취급 안 함",
        ["BULLET_PROJ_RANGE"] = "감지 범위",
        ["BULLET_PROJ_RANGE_DESC"] = "이 범위 내 나타난 투사체만 리다이렉트",
        ["BULLET_PROJ_NOTE"] = "투사체 리다이렉트 켜짐: 비행 중 투사체가 대상으로 휨",
        ["BULLET_HITBOX"] = "Hitbox 확대",
        ["BULLET_HITBOX_DESC"] = "대상 히트박스 확대로 레이가 더 잘 맞음",
        ["BULLET_HB_MULT"] = "확대 배율",
        ["BULLET_HB_MULT_DESC"] = "1 = 원본 크기, 클수록 잘 맞음",
        ["BULLET_HB_PART"] = "확대 부위",
        ["BULLET_HB_NOTE"] = "Hitbox 확대 켜짐",
        ["BULLET_RM_KW"] = "이름 키워드",
        ["BULLET_RM_KW_DESC"] = "이 단어 포함 Remote만 처리, 비우면 전체",
        ["BULLET_RM_IDX"] = "인자 위치",
        ["BULLET_RM_IDX_DESC"] = "몇 번째 인자를 대상으로 교체할지(1부터)",
        ["BULLET_RM_TYPE"] = "교체 내용",
        ["BULLET_RM_LOG"] = "캡처된 Remote 보기",
        ["BULLET_RM_LOG_DESC"] = "발사 후 눌러 사용된 Remote 확인",
        ["BULLET_RM_EMPTY"] = "아직 캡처된 Remote 없음, 먼저 발사",
        ["BULLET_RM_CAPTURED"] = "캡처됨",
        ["BULLET_RM_NOTE"] = "Remote 재작성 켜짐",
        ["T_PLAYER"] = "대상 플레이어",
        ["T_POSITION"] = "대상 좌표",
        ["ESP_DRAW_EXT"] = "확장 그리기",
        ["ESP_SKELETON"] = "스켈레톤",
        ["ESP_SKELETON_DESC"] = "뼈 선 그리기",
        ["ESP_BOX3D"] = "3D 박스",
        ["ESP_BOX3D_DESC"] = "원근 있는 정육면체",
        ["ESP_HIGHLIGHT"] = "네이티브 하이라이트",
        ["ESP_HIGHLIGHT_DESC"] = "Highlight 인스턴스로 벽 너머 표시",
        ["ESP_HEADDOT"] = "머리 점",
        ["ESP_VIEWLINE"] = "시선 선",
        ["ESP_VIEWLINE_DESC"] = "머리에서 방향 표시 선",
        ["ESP_OFFSCREEN"] = "화면 밖 화살표",
        ["ESP_OFFSCREEN_DESC"] = "대상이 화면 밖일 때 화살표 표시",
        ["ESP_INFO"] = "정보 표시",
        ["ESP_WEAPON"] = "무기 표시",
        ["ESP_HEALTHNUM"] = "체력 숫자",
        ["ESP_TARGETHL"] = "고정 대상 강조",
        ["ESP_TARGETHL_DESC"] = "에임/탄추적 대상을 빨강으로 표시",
        ["ESP_RADAR_SEC"] = "레이다",
        ["ESP_RADAR"] = "레이다 활성화",
        ["ESP_RADAR_DESC"] = "코너에 2D 레이다 표시",
        ["RADAR_SIZE"] = "레이다 크기",
        ["RADAR_RANGE"] = "레이다 범위",
        ["RADAR_RANGE_DESC"] = "레이다가 몇 m 커버",
        ["RADAR_POS"] = "레이다 위치",
        ["CAM_SEC"] = "카메라 진단",
        ["CAM_CHECK"] = "카메라 쓰기 가능 검사",
        ["CAM_CHECK_DESC"] = "쓰기 후 읽기로 카메라 락 여부 판단",
        ["CAM_RESULT"] = "검사 결과",
        ["CAM_WRITABLE"] = "카메라 쓰기 가능, CFrame 에임 사용 가능",
        ["CAM_LOCKED"] = "카메라 락됨, 매 프레임 덮어씀",
        ["CAM_TYPE"] = "카메라 타입",
        ["CAM_SUBJECT"] = "카메라 대상",
        ["CAM_MODE"] = "카메라 쓰기 방식",
        ["CAM_MODE_DESC"] = "직접 쓰기는 덮어쓰일 수 있음, Hook은 이후 재작성",
        ["CAM_HOOK_OK"] = "카메라 Hook 설치됨",
        ["CAM_HOOK_FAIL"] = "카메라 Hook 실패(미지원)",
        ["CAM_NOHOOK"] = "카메라 메타테이블 읽기 실패",
        ["TB_SEC"] = "자동 사격",
        ["TB_ENABLE"] = "자동 사격 활성화",
        ["TB_ENABLE_DESC"] = "조준점이 적에 닿으면 자동 발사",
        ["TB_METHOD"] = "발사 방식",
        ["TB_METHOD_DESC"] = "실행기마다 지원 함수 다름",
        ["TB_DELAY"] = "발사 지연",
        ["TB_DELAY_DESC"] = "조준 후 몇 ms 대기 후 발사",
        ["TB_COOLDOWN"] = "발사 간격",
        ["TB_COOLDOWN_DESC"] = "두 발 사이 최소 간격",
        ["TB_BURST"] = "연발 모드",
        ["TB_BURST_DESC"] = "누르는 동안 연속 발사",
        ["TB_ONLYVIS"] = "보이는 대상만",
        ["TB_HITCHK"] = "탄추적 대상 사용",
        ["TB_HITCHK_DESC"] = "탄추적 켜지면 그 대상 기준",
        ["TB_TEST"] = "발사 테스트",
        ["TB_TEST_DESC"] = "클릭해 발사 트리거 확인",
        ["TB_TESTED"] = "발사 신호 전송, 반응 확인",
        ["TB_NOMETHOD"] = "사용 가능한 발사 함수 없음",
        ["TB_FIRED"] = "발사됨",
        ["ESP_DIAG"] = "ESP 자체진단",
        ["ESP_DIAG_DESC"] = "Drawing 지원 여부와 최근 오류 표시",
        ["ESP_DIAG_RESULT"] = "진단 결과",
        ["ESP_DRAWING_OK"] = "Drawing API 사용 가능",
        ["ESP_DRAWING_NO"] = "Drawing API 사용 불가, ESP 그리기 불가",
        ["ESP_LASTERR"] = "최근 오류",
        ["ESP_NOERR"] = "오류 없음",
        ["ESP_STATE"] = "실행 상태",
        ["ESP_DRAWN"] = "그려진 대상 수",
        ["ESP_CAMLOCKED"] = "카메라 락됨, 시점 기반 기능 사용 불가",
        ["TB_ONLY_LEFT"] = "대신 자동 사격 사용: 조준만 맞추면 발사",
        ["FLY_TAB"] = "비행",
        ["FLY_DESC"] = "자유 비행 및 벽 통과 이동",
        ["FLY_TITLE"] = "비행",
        ["FLY_HEAD_DESC"] = "BodyGyro + BodyVelocity 구동, 벽 통과 지원",
        ["FLY_ENABLE"] = "비행 활성화",
        ["FLY_ENABLE_DESC"] = "켜면 상승, 방향은 카메라 기준",
        ["FLY_NOCLIP"] = "벽 통과",
        ["FLY_NOCLIP_DESC"] = "비행 중 벽 통과 활성화",
        ["FLY_SPEED"] = "비행 속도",
        ["FLY_SPEED_DESC"] = "클수록 빠름",
        ["FLY_UP"] = "상승",
        ["FLY_DOWN"] = "하강",
        ["FLY_UP_DESC"] = "누르는 동안 상승",
        ["FLY_DOWN_DESC"] = "누르는 동안 하강",
        ["FLY_STOP"] = "비행 정지",
        ["FLY_STOPPED"] = "비행 정지됨",
        ["FLY_NOCHAR"] = "캐릭터 미준비, 부활 후 재시도",
        ["FLY_STARTED"] = "비행 시작됨",
        ["FLY_VERTSPD"] = "상하 속도",
        ["FLY_VERTSPD_DESC"] = "상하 버튼 누를 때 이동 거리",
        ["FLY_UNSTICK"] = "정지 시 자동 탈출",
        ["FLY_UNSTICK_DESC"] = "지형에 박혔는지 검사 후 끌어올림",
        ["FLY_FORCE_RESET"] = "강제 초기화",
        ["FLY_FORCE_RESET_DESC"] = "비행 후 점프 안 되면 클릭",
        ["FLY_RESET_DONE"] = "초기화 완료, 점프 시도",
        ["FLY_NOCLIP_MODE"] = "벽 통과 방식",
        ["FLY_NOCLIP_MODE_DESC"] = "충돌 off가 가장 안정적, Translate는 구형 게임용",
        ["ESP_UNIT"] = "거리 단위",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud(로블록스 단위)",
        ["UNIT_M"] = "m(미터)",
        ["UNIT_KM"] = "km(킬로미터)",
        ["UNIT_SCALE"] = "환산 비율",
        ["UNIT_SCALE_DESC"] = "1 stud는 몇 m, 기본 0.28",
        ["THEME_SELECT"] = "테마 선택",
        ["BULLET_REMOTE_LOG_DESC"] = "발사 후 눌러 사용된 Remote 확인",
        ["MISC_TAB"] = "유틸리티",
        ["MISC_DESC"] = "기본 속성 변경",
        ["MISC_SEC_CHAR"] = "캐릭터",
        ["MISC_SEC_WORLD"] = "세계와 시야",
        ["MISC_SPEED"] = "이동 속도",
        ["MISC_SPEED_DESC"] = "이동 속도 증가",
        ["MISC_JUMP"] = "점프력",
        ["MISC_JUMP_DESC"] = "점프 높이 증가",
        ["MISC_HEALTH"] = "최대 체력",
        ["MISC_HEALTH_DESC"] = "최대 체력 증가",
        ["MISC_INFJUMP"] = "무한 점프",
        ["MISC_INFJUMP_DESC"] = "공중에서도 점프",
        ["MISC_GRAVITY"] = "중력",
        ["MISC_GRAVITY_DESC"] = "작을수록 높이, 기본 196",
        ["MISC_NOCLIP"] = "벽 통과",
        ["MISC_NOCLIP_DESC"] = "모든 오브젝트 통과",
        ["MISC_FOV"] = "시야 FOV",
        ["MISC_FOV_DESC"] = "시야 범위 조정, 기본 70",
        ["MISC_BRIGHT"] = "야간 시야",
        ["MISC_BRIGHT_DESC"] = "밝기 증가로 어두운 곳 확인",
        ["MISC_RESET"] = "전체 초기화",
        ["MISC_RESET_DESC"] = "모든 값 원래대로",
        ["MISC_RESET_DONE"] = "기본값으로 복원",
        ["MISC_SEC_AFK"] = "방출 방지와 투시",
        ["MISC_ANTIAFK"] = "AFK 강퇴 방지",
        ["MISC_ANTIAFK_DESC"] = "방치해도 강퇴 안 됨",
        ["MISC_AFK_STATUS"] = "AFK 방지 상태",
        ["MISC_XRAY"] = "투시(벽 투명화)",
        ["MISC_XRAY_DESC"] = "벽을 투명하게 해 뒤를 봄",
        ["MISC_XRAY_AMT"] = "투시 정도",
        ["MISC_XRAY_AMT_DESC"] = "0=불투명, 1=완전 투명",
        ["MISC_SEC_TP"] = "플레이어에게 순간이동",
        ["MISC_TP_SELECT"] = "플레이어 선택",
        ["MISC_TP_SELECT_DESC"] = "새로고침 후 선택",
        ["MISC_TP_REFRESH"] = "목록 새로고침",
        ["MISC_TP_REFRESHED"] = "목록 새로고침됨",
        ["MISC_TP_GO"] = "순간이동",
        ["MISC_TP_BEHIND"] = "뒤로 순간이동",
        ["MISC_TP_BEHIND_DESC"] = "대상 뒤에 나타남",
        ["MISC_TP_VEH"] = "탑승 모드",
        ["MISC_TP_VEH_DESC"] = "순간이동 시 좌석 유지",
        ["MISC_TP_OK"] = "순간이동됨",
        ["MISC_TP_NONE"] = "대상 없음",
        ["MISC_TP_NOCHAR"] = "내 캐릭터 미준비",
        ["SCRIPT_SEC"] = "스크립트",
        ["SCRIPT_TAB"] = "스크립트 허브",
        ["SCRIPT_DESC"] = "각 서버 서드파티 스크립트",
        ["SCRIPT_CATEGORY"] = "카테고리",
        ["SCRIPT_CATEGORY_DESC"] = "먼저 카테고리 선택",
        ["SCRIPT_SELECT"] = "스크립트 선택",
        ["SCRIPT_SELECT_DESC"] = "선택 후 로드",
        ["SCRIPT_INFO"] = "스크립트 정보",
        ["SCRIPT_INFO_EMPTY"] = "선택 안 됨",
        ["SCRIPT_LOAD"] = "스크립트 로드",
        ["SCRIPT_LOAD_DESC"] = "선택한 스크립트 실행",
        ["SCRIPT_COPY"] = "링크 복사",
        ["SCRIPT_COPY_DESC"] = "URL 클립보드 복사",
        ["SCRIPT_CONFIRM_TITLE"] = "로드 확인",
        ["SCRIPT_CONFIRM_BODY"] = "서드파티 스크립트 실행, 계속?",
        ["SCRIPT_LOADING"] = "로드 중…",
        ["SCRIPT_LOADED"] = "스크립트 실행됨",
        ["SCRIPT_FAILED"] = "실패, URL 확인",
        ["SCRIPT_NO_URL"] = "이 스크립트는 URL 없음",
        ["SCRIPT_COPIED"] = "링크 복사됨",
        ["SCRIPT_CUSTOM_SEC"] = "사용자 스크립트",
        ["SCRIPT_CUSTOM_URL"] = "스크립트 URL",
        ["SCRIPT_CUSTOM_URL_DESC"] = "raw/gist 링크 붙여넣기",
        ["SCRIPT_CUSTOM_LOAD"] = "사용자 스크립트 로드",
        ["SCRIPT_CUSTOM_EMPTY"] = "URL 입력 필요",
        ["SCRIPT_GUIDE"] = "추가 방법",
        ["SCRIPT_GUIDE_DESC"] = "상단 SCRIPT_LIB 참조",
        ["CANCEL"] = "취소",
    },
    ["ru"] = {
        ["PROFILE_TAB"] = "Введение",
        ["PROFILE_DESC"] = "О скрипте и состоянии сервера",
        ["PROFILE_BASIC"] = "Основная информация",
        ["PROFILE_USERNAME"] = "Имя пользователя",
        ["PROFILE_DISPLAYNAME"] = "Отображаемое имя",
        ["PROFILE_UID"] = "ID пользователя",
        ["PROFILE_ACCOUNTAGE"] = "Возраст аккаунта",
        ["PROFILE_SERVER"] = "Информация о сервере",
        ["PROFILE_PLACEID"] = "ID места",
        ["PROFILE_JOBID"] = "ID сервера",
        ["PROFILE_PLAYERS"] = "Игроков онлайн",
        ["PROFILE_PING"] = "Задержка",
        ["PROFILE_FPS"] = "FPS",
        ["PROFILE_REFRESH"] = "Обновить",
        ["PROFILE_VIEW"] = "Полный профиль",
        ["PROFILE_COPYUID"] = "Копировать ID",
        ["PROFILE_COPIED"] = "Скопировано",
        ["PROFILE_DAYS"] = "дн.",
        ["PROFILE_UNKNOWN"] = "Неизвестно",
        ["PROFILE_GREET"] = "Профиль",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP Визуал",
        ["ESP_DESC"] = "Бокс / Имя / Дистанция / Здоровье / Трейсер",
        ["ESP_ENABLE"] = "Включить ESP",
        ["ESP_ENABLE_DESC"] = "Главный выключатель; при выключении вся отрисовка исчезает",
        ["ESP_DRAW"] = "Отрисовка",
        ["ESP_BOX"] = "Бокс игрока",
        ["ESP_NAME"] = "Имя игрока",
        ["ESP_DISTANCE"] = "Дистанция",
        ["ESP_HEALTH"] = "Полоса здоровья",
        ["ESP_TRACER"] = "Трейсер",
        ["ESP_NAMESEC"] = "Отображение имени",
        ["ESP_NAMESRC"] = "Источник имени",
        ["ESP_NAMESRC_DESC"] = "Если отображаемое имя — знаки вопросов, использовать имя пользователя",
        ["ESP_FONT"] = "Шрифт",
        ["ESP_FONT_DESC"] = "Попробуйте System / Plex / Monospace для CJK",
        ["ESP_ASCII"] = "Авто-фолбэк для CJK",
        ["ESP_ASCII_DESC"] = "Авто-подмена имени при отсутствии поддержки CJK",
        ["ESP_FILTER"] = "Фильтры и стиль",
        ["ESP_TEAM"] = "Показывать команду",
        ["ESP_TEAM_DESC"] = "Союзники не будут отрисованы",
        ["ESP_LOS"] = "Только видимые",
        ["ESP_LOS_DESC"] = "Скрытые цели пропускаются",
        ["ESP_MAXDIST"] = "Макс. дистанция",
        ["ESP_MAXDIST_DESC"] = "Цели дальше не отрисуются",
        ["ESP_THICK"] = "Толщина линий",
        ["ESP_TEXTSIZE"] = "Размер текста",
        ["ESP_COLOR"] = "Цвет ESP",
        ["ESP_CLEAR"] = "Очистить отрисовку",
        ["ESP_CLEAR_DESC"] = "Если боксы застряли — нажмите",
        ["ESP_NOTSUP_TITLE"] = "ESP недоступно",
        ["ESP_NOTSUP_MSG"] = "Это окружение не поддерживает Drawing API",
        ["ESP_CLEARED"] = "Вся отрисовка очищена",
        ["AIM_TAB"] = "Аимбот",
        ["AIM_TITLE"] = "Аимбот",
        ["AIM_DESC"] = "FOV-захват · Плавное слежение · Фильтр стен и союзников",
        ["AIM_ENABLE"] = "Включить аимбот",
        ["AIM_ENABLE_DESC"] = "По умолчанию всегда включён; клавиша не нужна",
        ["AIM_BASIC"] = "Основные настройки",
        ["AIM_MODE"] = "Способ наведения",
        ["AIM_MODE_DESC"] = "CFrame — стабильно; Mouse — имитация человека",
        ["AIM_TRIGGER"] = "Клавиша активации",
        ["AIM_PART"] = "Часть тела",
        ["AIM_SMOOTH"] = "Плавность",
        ["AIM_SMOOTH_DESC"] = "Меньше = медленнее и естественнее",
        ["AIM_FILTER"] = "Дистанция и фильтры",
        ["AIM_FOV"] = "Радиус FOV",
        ["AIM_FOV_DESC"] = "Захват только в этом радиусе в пикселях",
        ["AIM_MAXDIST"] = "Макс. дистанция захвата",
        ["AIM_TEAM"] = "Пропуск союзников",
        ["AIM_VIS"] = "Только видимые",
        ["AIM_VIS_DESC"] = "Цели за стенами игнорируются",
        ["AIM_SHOWFOV"] = "Показывать круг FOV",
        ["AIM_FOVCOLOR"] = "Цвет круга FOV",
        ["AIM_RESET"] = "Сброс к умолчаниям",
        ["AIM_RESET_MSG"] = "Настройки сброшены",
        ["LANG_TAB"] = "Язык",
        ["LANG_TITLE"] = "Переключение языка",
        ["LANG_DESC"] = "Выберите язык интерфейса",
        ["LANG_SELECT"] = "Выбрать язык",
        ["LANG_CURRENT"] = "Текущий язык",
        ["LANG_APPLIED"] = "Язык применён",
        ["LANG_TIP"] = "Перезапустите скрипт, если часть текста не изменилась",
        ["PROFILE_COPYJOBID"] = "Копировать ID сервера",
        ["PROFILE_YEARS"] = "лет",
        ["PROFILE_ABOUT"] = "около",
        ["APPEARANCE_TITLE"] = "Настройка интерфейса",
        ["APPEARANCE_DESC"] = "Персонализируйте свой опыт",
        ["THEME_APPLIED"] = "Тема применена",
        ["DARKMODE"] = "Тёмная тема",
        ["DARKMODE_DESC"] = "Использовать тёмную схему",
        ["CREATE_THEME"] = "Создать тему",
        ["CREATE_THEME_DLG"] = "Создание темы",
        ["COMING_SOON"] = "Эта функция скоро появится!",
        ["OK"] = "OK",
        ["CONFIG_SEC"] = "Конфигурация",
        ["CONFIG_TITLE"] = "Сохранение и загрузка настроек",
        ["CONFIG_NAME"] = "Имя конфигурации",
        ["CONFIG_NAME_PLACEHOLDER"] = "Введите имя конфигурации",
        ["CONFIG_SAVE"] = "Сохранить конфигурацию",
        ["CONFIG_SAVED"] = "Конфигурация сохранена",
        ["CONFIG_SAVE_FAIL"] = "Ошибка сохранения",
        ["CONFIG_LOAD"] = "Загрузить конфигурацию",
        ["CONFIG_LOADED"] = "Конфигурация загружена",
        ["CONFIG_LOAD_FAIL"] = "Ошибка загрузки",
        ["CONFIG_EMPTY"] = "Конфигурация пуста или отсутствует",
        ["CONFIG_LOADED_KEYS"] = "Загруженные настройки",
        ["CONFIG_NOTSUP"] = "ConfigManager недоступен",
        ["CONFIG_AUTOSAVE"] = "Настройки автосохранены",
        ["BULLET_TAB"] = "Трекинг пуль",
        ["BULLET_DESC"] = "Трекинг пуль / коррекция попадания",
        ["BULLET_TITLE"] = "Трекинг пуль",
        ["BULLET_HEAD_DESC"] = "Перенаправляет выстрелы в цель при стрельбе",
        ["BULLET_ENABLE"] = "Включить трекинг пуль",
        ["BULLET_ENABLE_DESC"] = "Прицел не двигается, пули летят в цель",
        ["BULLET_BASIC"] = "Основные настройки",
        ["BULLET_METHOD"] = "Способ трекинга",
        ["BULLET_METHOD_DESC"] = "Ray Redirect — универсально; Hit Point — для mouse.Hit",
        ["BULLET_PART"] = "Часть цели",
        ["BULLET_HITCHANCE"] = "Шанс попадания",
        ["BULLET_HITCHANCE_DESC"] = "Ниже 100 часть выстрелов промахивается — похоже на человека",
        ["BULLET_FOLLOW"] = "Следовать за целью аимбота",
        ["BULLET_FOLLOW_DESC"] = "При включённом аимботе использовать его цель",
        ["BULLET_FILTER"] = "Дистанция и фильтры",
        ["BULLET_FOV"] = "FOV трекинга",
        ["BULLET_FOV_DESC"] = "Захват только в этом радиусе в пикселях",
        ["BULLET_MAXDIST"] = "Макс. дистанция трекинга",
        ["BULLET_TEAM"] = "Пропуск союзников",
        ["BULLET_VIS"] = "Только видимые",
        ["BULLET_VIS_DESC"] = "Цели за стенами игнорируются",
        ["BULLET_NOTSUP_TITLE"] = "Трекинг недоступен",
        ["BULLET_NOTSUP_MSG"] = "Окружение не поддерживает хуки",
        ["BULLET_READY"] = "Трекинг готов",
        ["BULLET_READY_MSG"] = "Коррекция установлена — стреляйте",
        ["BULLET_RESET"] = "Сброс к умолчаниям",
        ["BULLET_STATUS"] = "Состояние",
        ["BULLET_STATUS_DESC"] = "Показывает, доступен ли хук",
        ["BULLET_WALLBANG"] = "Прострел стен",
        ["BULLET_WALLBANG_DESC"] = "Пули проходят сквозь стены; не нужно смотреть на цель",
        ["BULLET_WALLBANG_NOTE"] = "Прострел включён: лучи игнорируют стены",
        ["BULLET_WALLBANG_OFF"] = "Прострел выключен",
        ["BULLET_SERVER_WARN"] = "Если игра пересчитывает выстрелы на сервере — только визуально",
        ["BULLET_IMPL"] = "Способ реализации",
        ["BULLET_IMPL_DESC"] = "Hook перехватывает лучи (мощно, нужен низкоуровневый доступ); Mouse наводится при выстреле (лучше совместимость)",
        ["BULLET_FIREKEY"] = "Клавиша выстрела",
        ["BULLET_FIREKEY_DESC"] = "В режиме Mouse наводится при нажатии этой клавиши",
        ["BULLET_MOUSE_READY"] = "Режим Mouse готов: наведение при выстреле",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel недоступен — используется поворот камеры",
        ["BULLET_HOOK_ONLY"] = "Применимо только в режиме Hook",
        ["BULLET_PROJ"] = "Перенаправление снарядов",
        ["BULLET_REMOTE"] = "Перезапись Remote",
        ["BULLET_PROJ_SPEED"] = "Мин. скорость снаряда",
        ["BULLET_PROJ_SPEED_DESC"] = "Части медленнее не считаются снарядами",
        ["BULLET_PROJ_RANGE"] = "Радиус обнаружения",
        ["BULLET_PROJ_RANGE_DESC"] = "Перенаправлять только снаряды в этом радиусе",
        ["BULLET_PROJ_NOTE"] = "Перенаправление включено: снаряды поворачивают к цели",
        ["BULLET_HITBOX"] = "Увеличение хитбокса",
        ["BULLET_HITBOX_DESC"] = "Увеличивает хитбокс, лучи попадают чаще",
        ["BULLET_HB_MULT"] = "Множитель хитбокса",
        ["BULLET_HB_MULT_DESC"] = "1 = исходный размер; больше = легче попасть",
        ["BULLET_HB_PART"] = "Увеличиваемая часть",
        ["BULLET_HB_NOTE"] = "Увеличение хитбокса включено",
        ["BULLET_RM_KW"] = "Ключевое слово",
        ["BULLET_RM_KW_DESC"] = "Обрабатывать только с этим словом; пусто = все",
        ["BULLET_RM_IDX"] = "Индекс аргумента",
        ["BULLET_RM_IDX_DESC"] = "Какой аргумент заменить (начиная с 1)",
        ["BULLET_RM_TYPE"] = "Чем заменить",
        ["BULLET_RM_LOG"] = "Показать перехваченные",
        ["BULLET_RM_LOG_DESC"] = "Сначала выстрелите, затем посмотрите",
        ["BULLET_RM_EMPTY"] = "Пока ничего не перехвачено — сначала выстрелите",
        ["BULLET_RM_CAPTURED"] = "Перехвачено",
        ["BULLET_RM_NOTE"] = "Перезапись Remote включена",
        ["T_PLAYER"] = "Игрок-цель",
        ["T_POSITION"] = "Позиция цели",
        ["ESP_DRAW_EXT"] = "Расширенная отрисовка",
        ["ESP_SKELETON"] = "Скелет",
        ["ESP_SKELETON_DESC"] = "Рисует линии костей",
        ["ESP_BOX3D"] = "3D бокс",
        ["ESP_BOX3D_DESC"] = "Куб с перспективой",
        ["ESP_HIGHLIGHT"] = "Встроенная подсветка",
        ["ESP_HIGHLIGHT_DESC"] = "Использует Highlight; видно сквозь стены",
        ["ESP_HEADDOT"] = "Точка над головой",
        ["ESP_VIEWLINE"] = "Линия взгляда",
        ["ESP_VIEWLINE_DESC"] = "Рисует линию от головы",
        ["ESP_OFFSCREEN"] = "Стрелка за экраном",
        ["ESP_OFFSCREEN_DESC"] = "Показывает стрелку, если цель за экраном",
        ["ESP_INFO"] = "Отображение информации",
        ["ESP_WEAPON"] = "Показывать оружие",
        ["ESP_HEALTHNUM"] = "Число здоровья",
        ["ESP_TARGETHL"] = "Подсветка захваченной цели",
        ["ESP_TARGETHL_DESC"] = "Цель аимбота/трекинга выделяется красным",
        ["ESP_RADAR_SEC"] = "Радар",
        ["ESP_RADAR"] = "Включить радар",
        ["ESP_RADAR_DESC"] = "Радар сверху в углу",
        ["RADAR_SIZE"] = "Размер радара",
        ["RADAR_RANGE"] = "Дальность радара",
        ["RADAR_RANGE_DESC"] = "Сколько метров покрывает радар",
        ["RADAR_POS"] = "Позиция радара",
        ["CAM_SEC"] = "Диагностика камеры",
        ["CAM_CHECK"] = "Проверить запись в камеру",
        ["CAM_CHECK_DESC"] = "Записать и прочитать, чтобы проверить блокировку",
        ["CAM_RESULT"] = "Результат",
        ["CAM_WRITABLE"] = "Камера доступна для записи",
        ["CAM_LOCKED"] = "Камера заблокирована",
        ["CAM_TYPE"] = "Тип камеры",
        ["CAM_SUBJECT"] = "Объект камеры",
        ["CAM_MODE"] = "Режим записи камеры",
        ["CAM_MODE_DESC"] = "Прямая запись может быть перезаписана",
        ["CAM_HOOK_OK"] = "Хук камеры установлен",
        ["CAM_HOOK_FAIL"] = "Хук камеры не установлен",
        ["CAM_NOHOOK"] = "Не удаётся прочитать метатаблицу",
        ["TB_SEC"] = "Авто-огонь",
        ["TB_ENABLE"] = "Включить авто-огонь",
        ["TB_ENABLE_DESC"] = "Стреляет, когда прицел на враге",
        ["TB_METHOD"] = "Способ выстрела",
        ["TB_METHOD_DESC"] = "Разные исполнители — попробуйте каждый",
        ["TB_DELAY"] = "Задержка выстрела",
        ["TB_DELAY_DESC"] = "Ждать мс перед выстрелом",
        ["TB_COOLDOWN"] = "Задержка между выстрелами",
        ["TB_COOLDOWN_DESC"] = "Минимум между двумя выстрелами",
        ["TB_BURST"] = "Режим очереди",
        ["TB_BURST_DESC"] = "Стреляет непрерывно при удержании",
        ["TB_ONLYVIS"] = "Только видимые",
        ["TB_HITCHK"] = "Использовать цель трекинга",
        ["TB_HITCHK_DESC"] = "Если трекинг включён — его цель",
        ["TB_TEST"] = "Тест выстрела",
        ["TB_TEST_DESC"] = "Проверить, работает ли выстрел",
        ["TB_TESTED"] = "Сигнал отправлен; проверьте реакцию",
        ["TB_NOMETHOD"] = "Нет доступных функций выстрела",
        ["TB_FIRED"] = "Выстрел",
        ["ESP_DIAG"] = "Диагностика ESP",
        ["ESP_DIAG_DESC"] = "Проверяет Drawing и показывает последнюю ошибку",
        ["ESP_DIAG_RESULT"] = "Результат",
        ["ESP_DRAWING_OK"] = "Drawing API доступен",
        ["ESP_DRAWING_NO"] = "Drawing API недоступен; ESP не может рисовать",
        ["ESP_LASTERR"] = "Последняя ошибка",
        ["ESP_NOERR"] = "Ошибок нет",
        ["ESP_STATE"] = "Состояние",
        ["ESP_DRAWN"] = "Отрисовано целей",
        ["ESP_CAMLOCKED"] = "Камера заблокирована",
        ["TB_ONLY_LEFT"] = "Используйте авто-огонь: не требует камеры",
        ["FLY_TAB"] = "Полёт",
        ["FLY_DESC"] = "Свободный полёт и проход сквозь стены",
        ["FLY_TITLE"] = "Полёт",
        ["FLY_HEAD_DESC"] = "На BodyGyro + BodyVelocity, с проходом сквозь стены",
        ["FLY_ENABLE"] = "Включить полёт",
        ["FLY_ENABLE_DESC"] = "Поднимает; направление по камере",
        ["FLY_NOCLIP"] = "Проход сквозь стены",
        ["FLY_NOCLIP_DESC"] = "Включает проход сквозь стены при полёте",
        ["FLY_SPEED"] = "Скорость полёта",
        ["FLY_SPEED_DESC"] = "Больше = быстрее",
        ["FLY_UP"] = "Вверх",
        ["FLY_DOWN"] = "Вниз",
        ["FLY_UP_DESC"] = "Удерживайте для подъёма",
        ["FLY_DOWN_DESC"] = "Удерживайте для спуска",
        ["FLY_STOP"] = "Остановить полёт",
        ["FLY_STOPPED"] = "Полёт остановлен",
        ["FLY_NOCHAR"] = "Персонаж не готов; попробуйте после возрождения",
        ["FLY_STARTED"] = "Полёт включён",
        ["FLY_VERTSPD"] = "Скорость подъёма",
        ["FLY_VERTSPD_DESC"] = "Расстояние за тик при удержании",
        ["FLY_UNSTICK"] = "Авто-вытаскивание при остановке",
        ["FLY_UNSTICK_DESC"] = "Определяет застревание и вытаскивает",
        ["FLY_FORCE_RESET"] = "Принудительный сброс",
        ["FLY_FORCE_RESET_DESC"] = "Если не прыгается после полёта",
        ["FLY_RESET_DONE"] = "Сброс выполнен; попробуйте прыгнуть",
        ["FLY_NOCLIP_MODE"] = "Способ прохода",
        ["FLY_NOCLIP_MODE_DESC"] = "Отключение коллизий стабильнее",
        ["ESP_UNIT"] = "Единица расстояния",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud (ед. Roblox)",
        ["UNIT_M"] = "m (метры)",
        ["UNIT_KM"] = "km (километры)",
        ["UNIT_SCALE"] = "Коэффициент",
        ["UNIT_SCALE_DESC"] = "Сколько метров в stud, по умолчанию 0.28",
        ["THEME_SELECT"] = "Выберите тему",
        ["BULLET_REMOTE_LOG_DESC"] = "Сначала выстрелите, затем посмотрите",
        ["MISC_TAB"] = "Утилиты",
        ["MISC_DESC"] = "Базовые настройки",
        ["MISC_SEC_CHAR"] = "Персонаж",
        ["MISC_SEC_WORLD"] = "Мир и обзор",
        ["MISC_SPEED"] = "Скорость ходьбы",
        ["MISC_SPEED_DESC"] = "Увеличить скорость ходьбы",
        ["MISC_JUMP"] = "Сила прыжка",
        ["MISC_JUMP_DESC"] = "Увеличить высоту прыжка",
        ["MISC_HEALTH"] = "Макс. здоровье",
        ["MISC_HEALTH_DESC"] = "Повысить макс. здоровье",
        ["MISC_INFJUMP"] = "Бесконечный прыжок",
        ["MISC_INFJUMP_DESC"] = "Прыжок в воздухе",
        ["MISC_GRAVITY"] = "Гравитация",
        ["MISC_GRAVITY_DESC"] = "Меньше = выше, по умолч. 196",
        ["MISC_NOCLIP"] = "Проход сквозь стены",
        ["MISC_NOCLIP_DESC"] = "Проходить сквозь объекты",
        ["MISC_FOV"] = "Поле зрения",
        ["MISC_FOV_DESC"] = "Настроить обзор, по умолч. 70",
        ["MISC_BRIGHT"] = "Полная яркость",
        ["MISC_BRIGHT_DESC"] = "Осветлить сцену",
        ["MISC_RESET"] = "Сбросить всё",
        ["MISC_RESET_DESC"] = "Вернуть исходные значения",
        ["MISC_RESET_DONE"] = "Сброшено",
        ["MISC_SEC_AFK"] = "Анти-АФК и рентген",
        ["MISC_ANTIAFK"] = "Защита от кика за АФК",
        ["MISC_ANTIAFK_DESC"] = "Не закикают за бездействие",
        ["MISC_AFK_STATUS"] = "Статус анти-АФК",
        ["MISC_XRAY"] = "Рентген (стены прозрачные)",
        ["MISC_XRAY_DESC"] = "Стены становятся прозрачными",
        ["MISC_XRAY_AMT"] = "Степень прозрачности",
        ["MISC_XRAY_AMT_DESC"] = "0 = непрозрачно, 1 = полностью",
        ["MISC_SEC_TP"] = "Телепорт к игроку",
        ["MISC_TP_SELECT"] = "Выбрать игрока",
        ["MISC_TP_SELECT_DESC"] = "Сначала обновите, затем выберите",
        ["MISC_TP_REFRESH"] = "Обновить список",
        ["MISC_TP_REFRESHED"] = "Список обновлён",
        ["MISC_TP_GO"] = "Телепортироваться",
        ["MISC_TP_BEHIND"] = "Телепорт за спину",
        ["MISC_TP_BEHIND_DESC"] = "Появиться за спиной цели",
        ["MISC_TP_VEH"] = "По транспорту",
        ["MISC_TP_VEH_DESC"] = "Сохранять сиденье при ТП",
        ["MISC_TP_OK"] = "Телепортировано",
        ["MISC_TP_NONE"] = "Нет цели",
        ["MISC_TP_NOCHAR"] = "Ваш персонаж не готов",
        ["SCRIPT_SEC"] = "Скрипты",
        ["SCRIPT_TAB"] = "Библиотека скриптов",
        ["SCRIPT_DESC"] = "Сторонние скрипты для игр",
        ["SCRIPT_CATEGORY"] = "Категория",
        ["SCRIPT_CATEGORY_DESC"] = "Сначала выберите категорию",
        ["SCRIPT_SELECT"] = "Выбрать скрипт",
        ["SCRIPT_SELECT_DESC"] = "Затем нажмите загрузить",
        ["SCRIPT_INFO"] = "Информация о скрипте",
        ["SCRIPT_INFO_EMPTY"] = "Скрипт не выбран",
        ["SCRIPT_LOAD"] = "Загрузить скрипт",
        ["SCRIPT_LOAD_DESC"] = "Запускает выбранный скрипт",
        ["SCRIPT_COPY"] = "Копировать ссылку",
        ["SCRIPT_COPY_DESC"] = "Скопировать URL",
        ["SCRIPT_CONFIRM_TITLE"] = "Подтвердить",
        ["SCRIPT_CONFIRM_BODY"] = "Сторонний скрипт. Продолжить?",
        ["SCRIPT_LOADING"] = "Загрузка…",
        ["SCRIPT_LOADED"] = "Скрипт выполнен",
        ["SCRIPT_FAILED"] = "Ошибка; проверьте ссылку",
        ["SCRIPT_NO_URL"] = "URL не задан",
        ["SCRIPT_COPIED"] = "Ссылка скопирована",
        ["SCRIPT_CUSTOM_SEC"] = "Свой скрипт",
        ["SCRIPT_CUSTOM_URL"] = "URL скрипта",
        ["SCRIPT_CUSTOM_URL_DESC"] = "Вставьте прямую ссылку",
        ["SCRIPT_CUSTOM_LOAD"] = "Загрузить свой",
        ["SCRIPT_CUSTOM_EMPTY"] = "Сначала введите URL",
        ["SCRIPT_GUIDE"] = "Как добавить",
        ["SCRIPT_GUIDE_DESC"] = "См. массив SCRIPT_LIB",
        ["CANCEL"] = "Отмена",
    },
    ["es"] = {
        ["PROFILE_TAB"] = "Introducción",
        ["PROFILE_DESC"] = "Acerca del script y estado del servidor",
        ["PROFILE_BASIC"] = "Información básica",
        ["PROFILE_USERNAME"] = "Nombre de usuario",
        ["PROFILE_DISPLAYNAME"] = "Nombre visible",
        ["PROFILE_UID"] = "ID de usuario",
        ["PROFILE_ACCOUNTAGE"] = "Antigüedad de la cuenta",
        ["PROFILE_SERVER"] = "Información del servidor",
        ["PROFILE_PLACEID"] = "ID del lugar",
        ["PROFILE_JOBID"] = "ID del servidor",
        ["PROFILE_PLAYERS"] = "Jugadores en línea",
        ["PROFILE_PING"] = "Latencia",
        ["PROFILE_FPS"] = "FPS",
        ["PROFILE_REFRESH"] = "Actualizar",
        ["PROFILE_VIEW"] = "Ver perfil completo",
        ["PROFILE_COPYUID"] = "Copiar ID de usuario",
        ["PROFILE_COPIED"] = "Copiado al portapapeles",
        ["PROFILE_DAYS"] = "días",
        ["PROFILE_UNKNOWN"] = "Desconocido",
        ["PROFILE_GREET"] = "Perfil",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP Visual",
        ["ESP_DESC"] = "Caja / Nombre / Distancia / Vida / Traza",
        ["ESP_ENABLE"] = "Activar ESP",
        ["ESP_ENABLE_DESC"] = "Interruptor principal; se borra todo al desactivar",
        ["ESP_DRAW"] = "Dibujos",
        ["ESP_BOX"] = "Caja del jugador",
        ["ESP_NAME"] = "Nombre del jugador",
        ["ESP_DISTANCE"] = "Distancia",
        ["ESP_HEALTH"] = "Barra de vida",
        ["ESP_TRACER"] = "Traza",
        ["ESP_NAMESEC"] = "Mostrar nombre",
        ["ESP_NAMESRC"] = "Fuente del nombre",
        ["ESP_NAMESRC_DESC"] = "Usa el nombre de usuario si el nombre visible sale como ???",
        ["ESP_FONT"] = "Fuente",
        ["ESP_FONT_DESC"] = "Prueba System / Plex / Monospace para CJK",
        ["ESP_ASCII"] = "Respaldo automático CJK",
        ["ESP_ASCII_DESC"] = "Usa el nombre de usuario si no hay soporte CJK",
        ["ESP_FILTER"] = "Filtros y estilo",
        ["ESP_TEAM"] = "Mostrar equipo",
        ["ESP_TEAM_DESC"] = "Los compañeros no se dibujarán",
        ["ESP_LOS"] = "Solo visibles",
        ["ESP_LOS_DESC"] = "Los objetivos ocultos se omiten",
        ["ESP_MAXDIST"] = "Distancia máxima",
        ["ESP_MAXDIST_DESC"] = "Más allá de esta distancia no se dibuja",
        ["ESP_THICK"] = "Grosor de línea",
        ["ESP_TEXTSIZE"] = "Tamaño del texto",
        ["ESP_COLOR"] = "Color ESP",
        ["ESP_CLEAR"] = "Limpiar dibujos",
        ["ESP_CLEAR_DESC"] = "Pulsa si quedan cajas pegadas",
        ["ESP_NOTSUP_TITLE"] = "ESP no disponible",
        ["ESP_NOTSUP_MSG"] = "Este ejecutor no admite Drawing API",
        ["ESP_CLEARED"] = "Todos los dibujos borrados",
        ["AIM_TAB"] = "Aimbot",
        ["AIM_TITLE"] = "Aimbot",
        ["AIM_DESC"] = "Bloqueo FOV · Seguimiento suave · Filtros de muro/equipo",
        ["AIM_ENABLE"] = "Activar aimbot",
        ["AIM_ENABLE_DESC"] = "Siempre activo por defecto; sin tecla",
        ["AIM_BASIC"] = "Ajustes básicos",
        ["AIM_MODE"] = "Modo de puntería",
        ["AIM_MODE_DESC"] = "CFrame estable; Mouse imita movimiento humano",
        ["AIM_TRIGGER"] = "Tecla de activación",
        ["AIM_PART"] = "Parte del cuerpo",
        ["AIM_SMOOTH"] = "Suavidad",
        ["AIM_SMOOTH_DESC"] = "Menor = más lento y natural",
        ["AIM_FILTER"] = "Rango y filtros",
        ["AIM_FOV"] = "Radio FOV",
        ["AIM_FOV_DESC"] = "Solo bloquea dentro de este radio en px",
        ["AIM_MAXDIST"] = "Distancia máx. de bloqueo",
        ["AIM_TEAM"] = "Omitir compañeros",
        ["AIM_VIS"] = "Solo visibles",
        ["AIM_VIS_DESC"] = "Los objetivos tras muros se ignoran",
        ["AIM_SHOWFOV"] = "Mostrar círculo FOV",
        ["AIM_FOVCOLOR"] = "Color del círculo FOV",
        ["AIM_RESET"] = "Restablecer valores",
        ["AIM_RESET_MSG"] = "Valores restablecidos",
        ["LANG_TAB"] = "Idioma",
        ["LANG_TITLE"] = "Cambio de idioma",
        ["LANG_DESC"] = "Elige el idioma de la interfaz",
        ["LANG_SELECT"] = "Seleccionar idioma",
        ["LANG_CURRENT"] = "Idioma actual",
        ["LANG_APPLIED"] = "Idioma aplicado",
        ["LANG_TIP"] = "Vuelve a ejecutar el script si algún texto no cambia",
        ["PROFILE_COPYJOBID"] = "Copiar ID del servidor",
        ["PROFILE_YEARS"] = "años",
        ["PROFILE_ABOUT"] = "aprox.",
        ["APPEARANCE_TITLE"] = "Personalizar interfaz",
        ["APPEARANCE_DESC"] = "Personaliza tu experiencia",
        ["THEME_APPLIED"] = "Tema aplicado",
        ["DARKMODE"] = "Modo oscuro",
        ["DARKMODE_DESC"] = "Usar esquema de colores oscuro",
        ["CREATE_THEME"] = "Crear nuevo tema",
        ["CREATE_THEME_DLG"] = "Crear tema",
        ["COMING_SOON"] = "¡Esta función llegará pronto!",
        ["OK"] = "OK",
        ["CONFIG_SEC"] = "Configuración",
        ["CONFIG_TITLE"] = "Guarda y carga tus ajustes",
        ["CONFIG_NAME"] = "Nombre de configuración",
        ["CONFIG_NAME_PLACEHOLDER"] = "Introduce el nombre",
        ["CONFIG_SAVE"] = "Guardar configuración",
        ["CONFIG_SAVED"] = "Configuración guardada",
        ["CONFIG_SAVE_FAIL"] = "Error al guardar",
        ["CONFIG_LOAD"] = "Cargar configuración",
        ["CONFIG_LOADED"] = "Configuración cargada",
        ["CONFIG_LOAD_FAIL"] = "Error al cargar",
        ["CONFIG_EMPTY"] = "La configuración está vacía",
        ["CONFIG_LOADED_KEYS"] = "Ajustes cargados",
        ["CONFIG_NOTSUP"] = "ConfigManager no disponible",
        ["CONFIG_AUTOSAVE"] = "Ajustes guardados automáticamente",
        ["BULLET_TAB"] = "Rastreo de balas",
        ["BULLET_DESC"] = "Rastreo de balas / corrección",
        ["BULLET_TITLE"] = "Rastreo de balas",
        ["BULLET_HEAD_DESC"] = "Redirige los disparos al objetivo",
        ["BULLET_ENABLE"] = "Activar rastreo",
        ["BULLET_ENABLE_DESC"] = "La vista no se mueve; las balas van al objetivo",
        ["BULLET_BASIC"] = "Ajustes básicos",
        ["BULLET_METHOD"] = "Método de rastreo",
        ["BULLET_METHOD_DESC"] = "Ray Redirect es universal; Hit Point para mouse.Hit",
        ["BULLET_PART"] = "Parte objetivo",
        ["BULLET_HITCHANCE"] = "Probabilidad de acierto",
        ["BULLET_HITCHANCE_DESC"] = "Por debajo de 100 algunos tiros fallan, parece humano",
        ["BULLET_FOLLOW"] = "Seguir objetivo del aimbot",
        ["BULLET_FOLLOW_DESC"] = "Prioriza el objetivo del aimbot",
        ["BULLET_FILTER"] = "Rango y filtros",
        ["BULLET_FOV"] = "FOV de rastreo",
        ["BULLET_FOV_DESC"] = "Solo dentro de este radio en px",
        ["BULLET_MAXDIST"] = "Distancia máx. de rastreo",
        ["BULLET_TEAM"] = "Omitir compañeros",
        ["BULLET_VIS"] = "Solo visibles",
        ["BULLET_VIS_DESC"] = "Los objetivos tras muros se ignoran",
        ["BULLET_NOTSUP_TITLE"] = "Rastreo no disponible",
        ["BULLET_NOTSUP_MSG"] = "Este ejecutor no admite hooks",
        ["BULLET_READY"] = "Rastreo listo",
        ["BULLET_READY_MSG"] = "Corrección instalada; dispara para probar",
        ["BULLET_RESET"] = "Restablecer valores",
        ["BULLET_STATUS"] = "Estado",
        ["BULLET_STATUS_DESC"] = "Muestra si el hook está disponible",
        ["BULLET_WALLBANG"] = "Atravesar muros",
        ["BULLET_WALLBANG_DESC"] = "Los disparos atraviesan muros; sin mirar al objetivo",
        ["BULLET_WALLBANG_NOTE"] = "Atravesar activado: los rayos ignoran muros",
        ["BULLET_WALLBANG_OFF"] = "Atravesar desactivado",
        ["BULLET_SERVER_WARN"] = "Si el juego recalcula en servidor, puede ser solo visual",
        ["BULLET_IMPL"] = "Implementación",
        ["BULLET_IMPL_DESC"] = "Hook intercepta rayos (potente, requiere acceso bajo); Mouse apunta al disparar (mejor compatibilidad)",
        ["BULLET_FIREKEY"] = "Tecla de disparo",
        ["BULLET_FIREKEY_DESC"] = "En modo Mouse, apunta al pulsar esta tecla",
        ["BULLET_MOUSE_READY"] = "Modo Mouse listo: apunta al disparar",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel no disponible; se usará giro de cámara",
        ["BULLET_HOOK_ONLY"] = "Solo aplica en modo Hook",
        ["BULLET_PROJ"] = "Redirección de proyectiles",
        ["BULLET_REMOTE"] = "Reescritura de Remote",
        ["BULLET_PROJ_SPEED"] = "Velocidad mínima",
        ["BULLET_PROJ_SPEED_DESC"] = "Las partes más lentas no se tratan como balas",
        ["BULLET_PROJ_RANGE"] = "Rango de detección",
        ["BULLET_PROJ_RANGE_DESC"] = "Solo redirige proyectiles dentro de este rango",
        ["BULLET_PROJ_NOTE"] = "Redirección activa: los proyectiles giran al objetivo",
        ["BULLET_HITBOX"] = "Expandir hitbox",
        ["BULLET_HITBOX_DESC"] = "Agranda el hitbox para que los rayos acierten",
        ["BULLET_HB_MULT"] = "Multiplicador",
        ["BULLET_HB_MULT_DESC"] = "1 = tamaño original; mayor = más fácil acertar",
        ["BULLET_HB_PART"] = "Parte a expandir",
        ["BULLET_HB_NOTE"] = "Expansión activa",
        ["BULLET_RM_KW"] = "Palabra clave",
        ["BULLET_RM_KW_DESC"] = "Solo remotos que contengan esto; vacío = todos",
        ["BULLET_RM_IDX"] = "Índice del argumento",
        ["BULLET_RM_IDX_DESC"] = "Qué argumento reemplazar (empieza en 1)",
        ["BULLET_RM_TYPE"] = "Reemplazar con",
        ["BULLET_RM_LOG"] = "Ver remotos capturados",
        ["BULLET_RM_LOG_DESC"] = "Dispara y luego mira qué remotos usa",
        ["BULLET_RM_EMPTY"] = "Aún no se capturó ninguno; dispara primero",
        ["BULLET_RM_CAPTURED"] = "Interceptado",
        ["BULLET_RM_NOTE"] = "Reescritura activa",
        ["T_PLAYER"] = "Jugador objetivo",
        ["T_POSITION"] = "Posición objetivo",
        ["ESP_DRAW_EXT"] = "Dibujos extendidos",
        ["ESP_SKELETON"] = "Esqueleto",
        ["ESP_SKELETON_DESC"] = "Dibuja líneas de huesos",
        ["ESP_BOX3D"] = "Caja 3D",
        ["ESP_BOX3D_DESC"] = "Cubo con perspectiva",
        ["ESP_HIGHLIGHT"] = "Resalte nativo",
        ["ESP_HIGHLIGHT_DESC"] = "Usa Highlight; visible a través de muros",
        ["ESP_HEADDOT"] = "Punto en la cabeza",
        ["ESP_VIEWLINE"] = "Línea de visión",
        ["ESP_VIEWLINE_DESC"] = "Dibuja línea desde la cabeza",
        ["ESP_OFFSCREEN"] = "Flecha fuera de pantalla",
        ["ESP_OFFSCREEN_DESC"] = "Muestra flecha si el objetivo está fuera",
        ["ESP_INFO"] = "Mostrar información",
        ["ESP_WEAPON"] = "Mostrar arma",
        ["ESP_HEALTHNUM"] = "Número de vida",
        ["ESP_TARGETHL"] = "Resaltar objetivo fijado",
        ["ESP_TARGETHL_DESC"] = "Marca en rojo el objetivo del aimbot",
        ["ESP_RADAR_SEC"] = "Radar",
        ["ESP_RADAR"] = "Activar radar",
        ["ESP_RADAR_DESC"] = "Radar 2D en la esquina",
        ["RADAR_SIZE"] = "Tamaño del radar",
        ["RADAR_RANGE"] = "Rango del radar",
        ["RADAR_RANGE_DESC"] = "Cuántos metros cubre",
        ["RADAR_POS"] = "Posición del radar",
        ["CAM_SEC"] = "Diagnóstico de cámara",
        ["CAM_CHECK"] = "Probar escritura de cámara",
        ["CAM_CHECK_DESC"] = "Escribe y lee para ver si el juego bloquea",
        ["CAM_RESULT"] = "Resultado",
        ["CAM_WRITABLE"] = "Cámara escribible",
        ["CAM_LOCKED"] = "Cámara bloqueada",
        ["CAM_TYPE"] = "Tipo de cámara",
        ["CAM_SUBJECT"] = "Objeto de cámara",
        ["CAM_MODE"] = "Modo de escritura",
        ["CAM_MODE_DESC"] = "Escritura directa puede sobrescribirse",
        ["CAM_HOOK_OK"] = "Hook de cámara instalado",
        ["CAM_HOOK_FAIL"] = "Hook de cámara falló",
        ["CAM_NOHOOK"] = "No se puede leer la metatable",
        ["TB_SEC"] = "Disparo automático",
        ["TB_ENABLE"] = "Activar disparo automático",
        ["TB_ENABLE_DESC"] = "Dispara al apuntar a un enemigo",
        ["TB_METHOD"] = "Método de disparo",
        ["TB_METHOD_DESC"] = "Cada ejecutor soporta funciones distintas",
        ["TB_DELAY"] = "Retardo de disparo",
        ["TB_DELAY_DESC"] = "Espera ms antes de disparar",
        ["TB_COOLDOWN"] = "Intervalo entre disparos",
        ["TB_COOLDOWN_DESC"] = "Mínimo entre dos disparos",
        ["TB_BURST"] = "Modo ráfaga",
        ["TB_BURST_DESC"] = "Dispara mientras se mantiene",
        ["TB_ONLYVIS"] = "Solo objetivos visibles",
        ["TB_HITCHK"] = "Usar objetivo de balas",
        ["TB_HITCHK_DESC"] = "Si el rastreo está activo, usa su objetivo",
        ["TB_TEST"] = "Prueba de disparo",
        ["TB_TEST_DESC"] = "Comprueba si el disparo funciona",
        ["TB_TESTED"] = "Señal enviada; comprueba reacción",
        ["TB_NOMETHOD"] = "No hay función de disparo",
        ["TB_FIRED"] = "Disparado",
        ["ESP_DIAG"] = "Diagnóstico ESP",
        ["ESP_DIAG_DESC"] = "Comprueba Drawing y muestra el último error",
        ["ESP_DIAG_RESULT"] = "Resultado",
        ["ESP_DRAWING_OK"] = "Drawing API disponible",
        ["ESP_DRAWING_NO"] = "Drawing API no disponible; ESP no puede dibujar",
        ["ESP_LASTERR"] = "Último error",
        ["ESP_NOERR"] = "Sin errores",
        ["ESP_STATE"] = "Estado",
        ["ESP_DRAWN"] = "Objetivos dibujados",
        ["ESP_CAMLOCKED"] = "Cámara bloqueada; las funciones de cámara no funcionan",
        ["TB_ONLY_LEFT"] = "Usa disparo automático: no necesita cámara",
        ["FLY_TAB"] = "Volar",
        ["FLY_DESC"] = "Vuelo libre y atravesar muros",
        ["FLY_TITLE"] = "Vuelo",
        ["FLY_HEAD_DESC"] = "BodyGyro + BodyVelocity, con atravesar muros",
        ["FLY_ENABLE"] = "Activar vuelo",
        ["FLY_ENABLE_DESC"] = "Te eleva; la dirección sigue la cámara",
        ["FLY_NOCLIP"] = "Atravesar muros",
        ["FLY_NOCLIP_DESC"] = "Activa atravesar muros al volar",
        ["FLY_SPEED"] = "Velocidad de vuelo",
        ["FLY_SPEED_DESC"] = "Mayor = más rápido",
        ["FLY_UP"] = "Ascender",
        ["FLY_DOWN"] = "Descender",
        ["FLY_UP_DESC"] = "Mantén para ascender",
        ["FLY_DOWN_DESC"] = "Mantén para descender",
        ["FLY_STOP"] = "Detener vuelo",
        ["FLY_STOPPED"] = "Vuelo detenido",
        ["FLY_NOCHAR"] = "Personaje no listo; reintenta tras revivir",
        ["FLY_STARTED"] = "Vuelo activado",
        ["FLY_VERTSPD"] = "Velocidad vertical",
        ["FLY_VERTSPD_DESC"] = "Distancia por tick al mantener",
        ["FLY_UNSTICK"] = "Auto liberar al detener",
        ["FLY_UNSTICK_DESC"] = "Detecta si estás atascado y te saca",
        ["FLY_FORCE_RESET"] = "Restablecer personaje",
        ["FLY_FORCE_RESET_DESC"] = "Pulsa si no puedes saltar tras volar",
        ["FLY_RESET_DONE"] = "Restablecido; prueba a saltar",
        ["FLY_NOCLIP_MODE"] = "Método de atravesar",
        ["FLY_NOCLIP_MODE_DESC"] = "Desactivar colisión es más estable",
        ["ESP_UNIT"] = "Unidad de distancia",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud (unidad Roblox)",
        ["UNIT_M"] = "m (metros)",
        ["UNIT_KM"] = "km (kilómetros)",
        ["UNIT_SCALE"] = "Factor de conversión",
        ["UNIT_SCALE_DESC"] = "Cuántos metros por stud, 0.28 por defecto",
        ["THEME_SELECT"] = "Seleccionar tema",
        ["BULLET_REMOTE_LOG_DESC"] = "Dispara y luego mira qué remotos usa",
        ["MISC_TAB"] = "Utilidades",
        ["MISC_DESC"] = "Ajustes básicos",
        ["MISC_SEC_CHAR"] = "Personaje",
        ["MISC_SEC_WORLD"] = "Mundo y vista",
        ["MISC_SPEED"] = "Velocidad de caminar",
        ["MISC_SPEED_DESC"] = "Aumenta la velocidad",
        ["MISC_JUMP"] = "Potencia de salto",
        ["MISC_JUMP_DESC"] = "Aumenta el salto",
        ["MISC_HEALTH"] = "Vida máxima",
        ["MISC_HEALTH_DESC"] = "Aumenta la vida máxima",
        ["MISC_INFJUMP"] = "Salto infinito",
        ["MISC_INFJUMP_DESC"] = "Saltar en el aire",
        ["MISC_GRAVITY"] = "Gravedad",
        ["MISC_GRAVITY_DESC"] = "Menor flota más, 196 por defecto",
        ["MISC_NOCLIP"] = "Atravesar muros",
        ["MISC_NOCLIP_DESC"] = "Atravesar objetos",
        ["MISC_FOV"] = "Campo de visión",
        ["MISC_FOV_DESC"] = "Ajustar rango, 70 por defecto",
        ["MISC_BRIGHT"] = "Visión nocturna",
        ["MISC_BRIGHT_DESC"] = "Aclara la escena",
        ["MISC_RESET"] = "Restablecer todo",
        ["MISC_RESET_DESC"] = "Restaura los valores",
        ["MISC_RESET_DONE"] = "Restaurado",
        ["MISC_SEC_AFK"] = "Anti-AFK y visión X",
        ["MISC_ANTIAFK"] = "Evitar expulsión por AFK",
        ["MISC_ANTIAFK_DESC"] = "No te expulsan por inactividad",
        ["MISC_AFK_STATUS"] = "Estado anti-AFK",
        ["MISC_XRAY"] = "Visión X (ver a través)",
        ["MISC_XRAY_DESC"] = "Hace las paredes transparentes",
        ["MISC_XRAY_AMT"] = "Cantidad de visión X",
        ["MISC_XRAY_AMT_DESC"] = "0 = opaco, 1 = transparente",
        ["MISC_SEC_TP"] = "Teletransporte al jugador",
        ["MISC_TP_SELECT"] = "Seleccionar jugador",
        ["MISC_TP_SELECT_DESC"] = "Actualiza y luego elige",
        ["MISC_TP_REFRESH"] = "Actualizar lista",
        ["MISC_TP_REFRESHED"] = "Lista actualizada",
        ["MISC_TP_GO"] = "Teletransportar",
        ["MISC_TP_BEHIND"] = "Detrás del jugador",
        ["MISC_TP_BEHIND_DESC"] = "Aparecer detrás",
        ["MISC_TP_VEH"] = "Modo vehículo",
        ["MISC_TP_VEH_DESC"] = "Mantener asiento al TP",
        ["MISC_TP_OK"] = "Teletransportado",
        ["MISC_TP_NONE"] = "Sin objetivo",
        ["MISC_TP_NOCHAR"] = "Tu personaje no está listo",
        ["SCRIPT_SEC"] = "Scripts",
        ["SCRIPT_TAB"] = "Biblioteca de scripts",
        ["SCRIPT_DESC"] = "Scripts de terceros para varios juegos",
        ["SCRIPT_CATEGORY"] = "Categoría",
        ["SCRIPT_CATEGORY_DESC"] = "Elige categoría primero",
        ["SCRIPT_SELECT"] = "Seleccionar script",
        ["SCRIPT_SELECT_DESC"] = "Luego pulsa cargar",
        ["SCRIPT_INFO"] = "Info del script",
        ["SCRIPT_INFO_EMPTY"] = "Ningún script",
        ["SCRIPT_LOAD"] = "Cargar script",
        ["SCRIPT_LOAD_DESC"] = "Ejecuta el script",
        ["SCRIPT_COPY"] = "Copiar enlace",
        ["SCRIPT_COPY_DESC"] = "Copiar URL",
        ["SCRIPT_CONFIRM_TITLE"] = "Confirmar",
        ["SCRIPT_CONFIRM_BODY"] = "¿Ejecutar script de terceros?",
        ["SCRIPT_LOADING"] = "Cargando…",
        ["SCRIPT_LOADED"] = "Script ejecutado",
        ["SCRIPT_FAILED"] = "Falló; revisa el enlace",
        ["SCRIPT_NO_URL"] = "Sin URL",
        ["SCRIPT_COPIED"] = "Enlace copiado",
        ["SCRIPT_CUSTOM_SEC"] = "Script personalizado",
        ["SCRIPT_CUSTOM_URL"] = "URL del script",
        ["SCRIPT_CUSTOM_URL_DESC"] = "Pega enlace directo",
        ["SCRIPT_CUSTOM_LOAD"] = "Cargar personalizado",
        ["SCRIPT_CUSTOM_EMPTY"] = "Introduce una URL",
        ["SCRIPT_GUIDE"] = "Cómo añadir",
        ["SCRIPT_GUIDE_DESC"] = "Ver el array SCRIPT_LIB",
        ["CANCEL"] = "Cancelar",
    },
    ["fr"] = {
        ["PROFILE_TAB"] = "Introduction",
        ["PROFILE_DESC"] = "À propos du script et de l'état du serveur",
        ["PROFILE_BASIC"] = "Informations de base",
        ["PROFILE_USERNAME"] = "Nom d'utilisateur",
        ["PROFILE_DISPLAYNAME"] = "Nom d'affichage",
        ["PROFILE_UID"] = "ID utilisateur",
        ["PROFILE_ACCOUNTAGE"] = "Âge du compte",
        ["PROFILE_SERVER"] = "Informations du serveur",
        ["PROFILE_PLACEID"] = "ID du lieu",
        ["PROFILE_JOBID"] = "ID du serveur",
        ["PROFILE_PLAYERS"] = "Joueurs en ligne",
        ["PROFILE_PING"] = "Ping",
        ["PROFILE_FPS"] = "FPS",
        ["PROFILE_REFRESH"] = "Actualiser",
        ["PROFILE_VIEW"] = "Voir le profil complet",
        ["PROFILE_COPYUID"] = "Copier l'ID utilisateur",
        ["PROFILE_COPIED"] = "Copié dans le presse-papiers",
        ["PROFILE_DAYS"] = "jours",
        ["PROFILE_UNKNOWN"] = "Inconnu",
        ["PROFILE_GREET"] = "Profil",
        ["ESP_TAB"] = "ESP",
        ["ESP_TITLE"] = "ESP Visuel",
        ["ESP_DESC"] = "Boîte / Nom / Distance / Vie / Tracer",
        ["ESP_ENABLE"] = "Activer l'ESP",
        ["ESP_ENABLE_DESC"] = "Interrupteur principal ; tout disparaît à l'arrêt",
        ["ESP_DRAW"] = "Dessins",
        ["ESP_BOX"] = "Boîte du joueur",
        ["ESP_NAME"] = "Nom du joueur",
        ["ESP_DISTANCE"] = "Distance",
        ["ESP_HEALTH"] = "Barre de vie",
        ["ESP_TRACER"] = "Tracer",
        ["ESP_NAMESEC"] = "Affichage du nom",
        ["ESP_NAMESRC"] = "Source du nom",
        ["ESP_NAMESRC_DESC"] = "Utiliser le nom d'utilisateur si le nom visible s'affiche en ???",
        ["ESP_FONT"] = "Police",
        ["ESP_FONT_DESC"] = "Essayez System / Plex / Monospace pour le CJK",
        ["ESP_ASCII"] = "Repli automatique CJK",
        ["ESP_ASCII_DESC"] = "Utilise le nom d'utilisateur si le CJK n'est pas supporté",
        ["ESP_FILTER"] = "Filtres et style",
        ["ESP_TEAM"] = "Afficher l'équipe",
        ["ESP_TEAM_DESC"] = "Les coéquipiers ne seront pas dessinés",
        ["ESP_LOS"] = "Visibles uniquement",
        ["ESP_LOS_DESC"] = "Les cibles cachées sont ignorées",
        ["ESP_MAXDIST"] = "Distance max",
        ["ESP_MAXDIST_DESC"] = "Au-delà, pas de dessin",
        ["ESP_THICK"] = "Épaisseur du trait",
        ["ESP_TEXTSIZE"] = "Taille du texte",
        ["ESP_COLOR"] = "Couleur ESP",
        ["ESP_CLEAR"] = "Nettoyer les dessins",
        ["ESP_CLEAR_DESC"] = "Clique si des boîtes restent bloquées",
        ["ESP_NOTSUP_TITLE"] = "ESP indisponible",
        ["ESP_NOTSUP_MSG"] = "Cet exécuteur ne prend pas en charge Drawing API",
        ["ESP_CLEARED"] = "Tous les dessins nettoyés",
        ["AIM_TAB"] = "Aimbot",
        ["AIM_TITLE"] = "Aimbot",
        ["AIM_DESC"] = "Verrouillage FOV · Suivi fluide · Filtres murs/équipe",
        ["AIM_ENABLE"] = "Activer l'aimbot",
        ["AIM_ENABLE_DESC"] = "Toujours actif par défaut ; aucune touche nécessaire",
        ["AIM_BASIC"] = "Réglages de base",
        ["AIM_MODE"] = "Méthode de visée",
        ["AIM_MODE_DESC"] = "CFrame stable ; Mouse imite un mouvement humain",
        ["AIM_TRIGGER"] = "Touche d'activation",
        ["AIM_PART"] = "Partie du corps",
        ["AIM_SMOOTH"] = "Fluidité",
        ["AIM_SMOOTH_DESC"] = "Plus bas = plus lent et naturel",
        ["AIM_FILTER"] = "Portée et filtres",
        ["AIM_FOV"] = "Rayon FOV",
        ["AIM_FOV_DESC"] = "Verrouille seulement dans ce rayon en px",
        ["AIM_MAXDIST"] = "Distance max de verrouillage",
        ["AIM_TEAM"] = "Ignorer les coéquipiers",
        ["AIM_VIS"] = "Visibles uniquement",
        ["AIM_VIS_DESC"] = "Les cibles derrière les murs sont ignorées",
        ["AIM_SHOWFOV"] = "Afficher le cercle FOV",
        ["AIM_FOVCOLOR"] = "Couleur du cercle FOV",
        ["AIM_RESET"] = "Réinitialiser",
        ["AIM_RESET_MSG"] = "Paramètres réinitialisés",
        ["LANG_TAB"] = "Langue",
        ["LANG_TITLE"] = "Changement de langue",
        ["LANG_DESC"] = "Choisissez la langue de l'interface",
        ["LANG_SELECT"] = "Choisir une langue",
        ["LANG_CURRENT"] = "Langue actuelle",
        ["LANG_APPLIED"] = "Langue appliquée",
        ["LANG_TIP"] = "Réexécutez le script si certains textes ne changent pas",
        ["PROFILE_COPYJOBID"] = "Copier l'ID du serveur",
        ["PROFILE_YEARS"] = "ans",
        ["PROFILE_ABOUT"] = "env.",
        ["APPEARANCE_TITLE"] = "Personnaliser l'interface",
        ["APPEARANCE_DESC"] = "Personnalisez votre expérience",
        ["THEME_APPLIED"] = "Thème appliqué",
        ["DARKMODE"] = "Mode sombre",
        ["DARKMODE_DESC"] = "Utiliser le jeu de couleurs sombre",
        ["CREATE_THEME"] = "Créer un nouveau thème",
        ["CREATE_THEME_DLG"] = "Créer un thème",
        ["COMING_SOON"] = "Cette fonctionnalité arrive bientôt !",
        ["OK"] = "OK",
        ["CONFIG_SEC"] = "Configuration",
        ["CONFIG_TITLE"] = "Enregistrez et chargez vos paramètres",
        ["CONFIG_NAME"] = "Nom de la configuration",
        ["CONFIG_NAME_PLACEHOLDER"] = "Entrez le nom",
        ["CONFIG_SAVE"] = "Enregistrer la configuration",
        ["CONFIG_SAVED"] = "Configuration enregistrée",
        ["CONFIG_SAVE_FAIL"] = "Échec de l'enregistrement",
        ["CONFIG_LOAD"] = "Charger la configuration",
        ["CONFIG_LOADED"] = "Configuration chargée",
        ["CONFIG_LOAD_FAIL"] = "Échec du chargement",
        ["CONFIG_EMPTY"] = "La configuration est vide",
        ["CONFIG_LOADED_KEYS"] = "Paramètres chargés",
        ["CONFIG_NOTSUP"] = "ConfigManager indisponible",
        ["CONFIG_AUTOSAVE"] = "Paramètres enregistrés automatiquement",
        ["BULLET_TAB"] = "Suivi des balles",
        ["BULLET_DESC"] = "Suivi des balles / correction",
        ["BULLET_TITLE"] = "Suivi des balles",
        ["BULLET_HEAD_DESC"] = "Redirige les tirs vers la cible",
        ["BULLET_ENABLE"] = "Activer le suivi",
        ["BULLET_ENABLE_DESC"] = "La vue ne bouge pas ; les balles vont à la cible",
        ["BULLET_BASIC"] = "Réglages de base",
        ["BULLET_METHOD"] = "Méthode de suivi",
        ["BULLET_METHOD_DESC"] = "Ray Redirect est universel ; Hit Point pour mouse.Hit",
        ["BULLET_PART"] = "Partie cible",
        ["BULLET_HITCHANCE"] = "Taux de réussite",
        ["BULLET_HITCHANCE_DESC"] = "En dessous de 100 certains tirs ratent, plus humain",
        ["BULLET_FOLLOW"] = "Suivre la cible de l'aimbot",
        ["BULLET_FOLLOW_DESC"] = "Priorise la cible de l'aimbot",
        ["BULLET_FILTER"] = "Portée et filtres",
        ["BULLET_FOV"] = "FOV de suivi",
        ["BULLET_FOV_DESC"] = "Uniquement dans ce rayon en px",
        ["BULLET_MAXDIST"] = "Distance max de suivi",
        ["BULLET_TEAM"] = "Ignorer les coéquipiers",
        ["BULLET_VIS"] = "Visibles uniquement",
        ["BULLET_VIS_DESC"] = "Les cibles derrière les murs sont ignorées",
        ["BULLET_NOTSUP_TITLE"] = "Suivi indisponible",
        ["BULLET_NOTSUP_MSG"] = "Cet exécuteur ne prend pas en charge les hooks",
        ["BULLET_READY"] = "Suivi prêt",
        ["BULLET_READY_MSG"] = "Correction installée ; tirez pour tester",
        ["BULLET_RESET"] = "Réinitialiser",
        ["BULLET_STATUS"] = "État",
        ["BULLET_STATUS_DESC"] = "Indique si le hook est disponible",
        ["BULLET_WALLBANG"] = "Tir à travers les murs",
        ["BULLET_WALLBANG_DESC"] = "Les tirs traversent les murs ; inutile de faire face",
        ["BULLET_WALLBANG_NOTE"] = "Tir à travers activé : les rayons ignorent les murs",
        ["BULLET_WALLBANG_OFF"] = "Tir à travers désactivé",
        ["BULLET_SERVER_WARN"] = "Si le jeu recalcule côté serveur, l'effet peut être visuel",
        ["BULLET_IMPL"] = "Implémentation",
        ["BULLET_IMPL_DESC"] = "Hook intercepte les rayons (puissant, accès bas niveau) ; Mouse vise au moment du tir (meilleure compatibilité)",
        ["BULLET_FIREKEY"] = "Touche de tir",
        ["BULLET_FIREKEY_DESC"] = "En mode Mouse, vise lors de l'appui sur cette touche",
        ["BULLET_MOUSE_READY"] = "Mode Mouse prêt : visée au moment du tir",
        ["BULLET_MOUSE_NOMOVEREL"] = "mousemoverel indisponible ; bascule sur rotation caméra",
        ["BULLET_HOOK_ONLY"] = "S'applique uniquement en mode Hook",
        ["BULLET_PROJ"] = "Redirection de projectiles",
        ["BULLET_REMOTE"] = "Réécriture de Remote",
        ["BULLET_PROJ_SPEED"] = "Vitesse minimale",
        ["BULLET_PROJ_SPEED_DESC"] = "Les parts plus lentes ne sont pas traitées",
        ["BULLET_PROJ_RANGE"] = "Portée de détection",
        ["BULLET_PROJ_RANGE_DESC"] = "Ne redirige que dans ce rayon",
        ["BULLET_PROJ_NOTE"] = "Redirection active : les projectiles tournent vers la cible",
        ["BULLET_HITBOX"] = "Agrandissement de hitbox",
        ["BULLET_HITBOX_DESC"] = "Agrandit la hitbox pour faciliter les tirs",
        ["BULLET_HB_MULT"] = "Multiplicateur",
        ["BULLET_HB_MULT_DESC"] = "1 = taille d'origine ; plus haut = plus facile",
        ["BULLET_HB_PART"] = "Partie à agrandir",
        ["BULLET_HB_NOTE"] = "Agrandissement activé",
        ["BULLET_RM_KW"] = "Mot-clé",
        ["BULLET_RM_KW_DESC"] = "Uniquement les remotes contenant ceci ; vide = tous",
        ["BULLET_RM_IDX"] = "Index de l'argument",
        ["BULLET_RM_IDX_DESC"] = "Quel argument remplacer (à partir de 1)",
        ["BULLET_RM_TYPE"] = "Remplacer par",
        ["BULLET_RM_LOG"] = "Voir les remotes capturés",
        ["BULLET_RM_LOG_DESC"] = "Tirez puis voyez quels remotes sont utilisés",
        ["BULLET_RM_EMPTY"] = "Aucun remote capturé ; tirez d'abord",
        ["BULLET_RM_CAPTURED"] = "Intercepté",
        ["BULLET_RM_NOTE"] = "Réécriture activée",
        ["T_PLAYER"] = "Joueur cible",
        ["T_POSITION"] = "Position cible",
        ["ESP_DRAW_EXT"] = "Dessins étendus",
        ["ESP_SKELETON"] = "Squelette",
        ["ESP_SKELETON_DESC"] = "Dessine les lignes d'os",
        ["ESP_BOX3D"] = "Boîte 3D",
        ["ESP_BOX3D_DESC"] = "Cube en perspective",
        ["ESP_HIGHLIGHT"] = "Surlignage natif",
        ["ESP_HIGHLIGHT_DESC"] = "Utilise Highlight ; visible à travers les murs",
        ["ESP_HEADDOT"] = "Point sur la tête",
        ["ESP_VIEWLINE"] = "Ligne de vue",
        ["ESP_VIEWLINE_DESC"] = "Dessine une ligne depuis la tête",
        ["ESP_OFFSCREEN"] = "Flèche hors écran",
        ["ESP_OFFSCREEN_DESC"] = "Affiche une flèche si la cible est hors écran",
        ["ESP_INFO"] = "Affichage d'infos",
        ["ESP_WEAPON"] = "Afficher l'arme",
        ["ESP_HEALTHNUM"] = "Chiffre de vie",
        ["ESP_TARGETHL"] = "Surligner la cible verrouillée",
        ["ESP_TARGETHL_DESC"] = "Marque en rouge la cible de l'aimbot",
        ["ESP_RADAR_SEC"] = "Radar",
        ["ESP_RADAR"] = "Activer le radar",
        ["ESP_RADAR_DESC"] = "Radar 2D dans le coin",
        ["RADAR_SIZE"] = "Taille du radar",
        ["RADAR_RANGE"] = "Portée du radar",
        ["RADAR_RANGE_DESC"] = "Nombre de mètres couverts",
        ["RADAR_POS"] = "Position du radar",
        ["CAM_SEC"] = "Diagnostic caméra",
        ["CAM_CHECK"] = "Tester l'écriture caméra",
        ["CAM_CHECK_DESC"] = "Écrit puis relit pour voir si le jeu bloque",
        ["CAM_RESULT"] = "Résultat",
        ["CAM_WRITABLE"] = "Caméra accessible en écriture",
        ["CAM_LOCKED"] = "Caméra verrouillée",
        ["CAM_TYPE"] = "Type de caméra",
        ["CAM_SUBJECT"] = "Sujet de caméra",
        ["CAM_MODE"] = "Mode d'écriture",
        ["CAM_MODE_DESC"] = "L'écriture directe peut être écrasée",
        ["CAM_HOOK_OK"] = "Hook caméra installé",
        ["CAM_HOOK_FAIL"] = "Hook caméra échoué",
        ["CAM_NOHOOK"] = "Impossible de lire la metatable",
        ["TB_SEC"] = "Tir automatique",
        ["TB_ENABLE"] = "Activer le tir auto",
        ["TB_ENABLE_DESC"] = "Tire quand le viseur est sur un ennemi",
        ["TB_METHOD"] = "Méthode de tir",
        ["TB_METHOD_DESC"] = "Chaque exécuteur diffère",
        ["TB_DELAY"] = "Délai de tir",
        ["TB_DELAY_DESC"] = "Attendre ms avant de tirer",
        ["TB_COOLDOWN"] = "Délai entre tirs",
        ["TB_COOLDOWN_DESC"] = "Minimum entre deux tirs",
        ["TB_BURST"] = "Mode rafale",
        ["TB_BURST_DESC"] = "Tire en continu",
        ["TB_ONLYVIS"] = "Cibles visibles uniquement",
        ["TB_HITCHK"] = "Utiliser la cible des balles",
        ["TB_HITCHK_DESC"] = "Si le suivi est actif, utilise sa cible",
        ["TB_TEST"] = "Test de tir",
        ["TB_TEST_DESC"] = "Vérifie si le tir fonctionne",
        ["TB_TESTED"] = "Signal envoyé ; vérifiez la réaction",
        ["TB_NOMETHOD"] = "Aucune fonction de tir",
        ["TB_FIRED"] = "Tiré",
        ["ESP_DIAG"] = "Diagnostic ESP",
        ["ESP_DIAG_DESC"] = "Vérifie Drawing et affiche la dernière erreur",
        ["ESP_DIAG_RESULT"] = "Résultat",
        ["ESP_DRAWING_OK"] = "Drawing API disponible",
        ["ESP_DRAWING_NO"] = "Drawing API indisponible ; ESP ne peut pas dessiner",
        ["ESP_LASTERR"] = "Dernière erreur",
        ["ESP_NOERR"] = "Aucune erreur",
        ["ESP_STATE"] = "État",
        ["ESP_DRAWN"] = "Cibles dessinées",
        ["ESP_CAMLOCKED"] = "Caméra verrouillée ; les fonctions de visée sont inutilisables",
        ["TB_ONLY_LEFT"] = "Utilisez le tir automatique : ne nécessite pas la caméra",
        ["FLY_TAB"] = "Vol",
        ["FLY_DESC"] = "Vol libre et passage à travers les murs",
        ["FLY_TITLE"] = "Vol",
        ["FLY_HEAD_DESC"] = "BodyGyro + BodyVelocity, avec passage à travers les murs",
        ["FLY_ENABLE"] = "Activer le vol",
        ["FLY_ENABLE_DESC"] = "Vous élève ; la direction suit la caméra",
        ["FLY_NOCLIP"] = "Passage à travers les murs",
        ["FLY_NOCLIP_DESC"] = "Active le passage à travers les murs en volant",
        ["FLY_SPEED"] = "Vitesse de vol",
        ["FLY_SPEED_DESC"] = "Plus haut = plus rapide",
        ["FLY_UP"] = "Monter",
        ["FLY_DOWN"] = "Descendre",
        ["FLY_UP_DESC"] = "Maintenir pour monter",
        ["FLY_DOWN_DESC"] = "Maintenir pour descendre",
        ["FLY_STOP"] = "Arrêter le vol",
        ["FLY_STOPPED"] = "Vol arrêté",
        ["FLY_NOCHAR"] = "Personnage non prêt ; réessayez après réapparition",
        ["FLY_STARTED"] = "Vol activé",
        ["FLY_VERTSPD"] = "Vitesse verticale",
        ["FLY_VERTSPD_DESC"] = "Distance par tick en maintenant",
        ["FLY_UNSTICK"] = "Dégagement auto à l'arrêt",
        ["FLY_UNSTICK_DESC"] = "Détecte si vous êtes coincé et vous sort",
        ["FLY_FORCE_RESET"] = "Réinitialiser le personnage",
        ["FLY_FORCE_RESET_DESC"] = "Cliquez si vous ne pouvez pas sauter après le vol",
        ["FLY_RESET_DONE"] = "Réinitialisé ; essayez de sauter",
        ["FLY_NOCLIP_MODE"] = "Méthode de passage",
        ["FLY_NOCLIP_MODE_DESC"] = "Désactiver la collision est plus stable",
        ["ESP_UNIT"] = "Unité de distance",
        ["ESP_UNIT_DESC"] = "stud / m / km",
        ["UNIT_STUD"] = "stud (unité Roblox)",
        ["UNIT_M"] = "m (mètres)",
        ["UNIT_KM"] = "km (kilomètres)",
        ["UNIT_SCALE"] = "Facteur de conversion",
        ["UNIT_SCALE_DESC"] = "Combien de mètres par stud, 0.28 par défaut",
        ["THEME_SELECT"] = "Choisir un thème",
        ["BULLET_REMOTE_LOG_DESC"] = "Tirez puis voyez quels remotes sont utilisés",
        ["MISC_TAB"] = "Utilitaires",
        ["MISC_DESC"] = "Réglages de base",
        ["MISC_SEC_CHAR"] = "Personnage",
        ["MISC_SEC_WORLD"] = "Monde et vue",
        ["MISC_SPEED"] = "Vitesse de marche",
        ["MISC_SPEED_DESC"] = "Augmente la vitesse",
        ["MISC_JUMP"] = "Puissance de saut",
        ["MISC_JUMP_DESC"] = "Augmente le saut",
        ["MISC_HEALTH"] = "Santé max",
        ["MISC_HEALTH_DESC"] = "Augmente la santé max",
        ["MISC_INFJUMP"] = "Saut infini",
        ["MISC_INFJUMP_DESC"] = "Sauter en l'air",
        ["MISC_GRAVITY"] = "Gravité",
        ["MISC_GRAVITY_DESC"] = "Plus bas flotte plus haut, 196 par défaut",
        ["MISC_NOCLIP"] = "Passage à travers les murs",
        ["MISC_NOCLIP_DESC"] = "Traverser les objets",
        ["MISC_FOV"] = "Champ de vision",
        ["MISC_FOV_DESC"] = "Ajuster la portée, 70 par défaut",
        ["MISC_BRIGHT"] = "Vision nocturne",
        ["MISC_BRIGHT_DESC"] = "Éclaircit la scène",
        ["MISC_RESET"] = "Réinitialiser tout",
        ["MISC_RESET_DESC"] = "Restaure les valeurs",
        ["MISC_RESET_DONE"] = "Restauré",
        ["MISC_SEC_AFK"] = "Anti-AFK et rayons X",
        ["MISC_ANTIAFK"] = "Éviter l'expulsion AFK",
        ["MISC_ANTIAFK_DESC"] = "Pas d'expulsion pour inactivité",
        ["MISC_AFK_STATUS"] = "État anti-AFK",
        ["MISC_XRAY"] = "Rayons X (voir à travers)",
        ["MISC_XRAY_DESC"] = "Rend les murs transparents",
        ["MISC_XRAY_AMT"] = "Degré de transparence",
        ["MISC_XRAY_AMT_DESC"] = "0 = opaque, 1 = transparent",
        ["MISC_SEC_TP"] = "Téléportation au joueur",
        ["MISC_TP_SELECT"] = "Choisir le joueur",
        ["MISC_TP_SELECT_DESC"] = "Actualise puis choisis",
        ["MISC_TP_REFRESH"] = "Actualiser la liste",
        ["MISC_TP_REFRESHED"] = "Liste actualisée",
        ["MISC_TP_GO"] = "Téléporter",
        ["MISC_TP_BEHIND"] = "Derrière le joueur",
        ["MISC_TP_BEHIND_DESC"] = "Apparaître derrière",
        ["MISC_TP_VEH"] = "Mode véhicule",
        ["MISC_TP_VEH_DESC"] = "Garder le siège au TP",
        ["MISC_TP_OK"] = "Téléporté",
        ["MISC_TP_NONE"] = "Aucune cible",
        ["MISC_TP_NOCHAR"] = "Votre personnage n'est pas prêt",
        ["SCRIPT_SEC"] = "Scripts",
        ["SCRIPT_TAB"] = "Bibliothèque de scripts",
        ["SCRIPT_DESC"] = "Scripts tiers pour divers jeux",
        ["SCRIPT_CATEGORY"] = "Catégorie",
        ["SCRIPT_CATEGORY_DESC"] = "Choisissez une catégorie",
        ["SCRIPT_SELECT"] = "Choisir un script",
        ["SCRIPT_SELECT_DESC"] = "Puis cliquez sur charger",
        ["SCRIPT_INFO"] = "Infos du script",
        ["SCRIPT_INFO_EMPTY"] = "Aucun script",
        ["SCRIPT_LOAD"] = "Charger le script",
        ["SCRIPT_LOAD_DESC"] = "Exécute le script",
        ["SCRIPT_COPY"] = "Copier le lien",
        ["SCRIPT_COPY_DESC"] = "Copier l'URL",
        ["SCRIPT_CONFIRM_TITLE"] = "Confirmer",
        ["SCRIPT_CONFIRM_BODY"] = "Exécuter un script tiers ?",
        ["SCRIPT_LOADING"] = "Chargement…",
        ["SCRIPT_LOADED"] = "Script exécuté",
        ["SCRIPT_FAILED"] = "Échec ; vérifiez le lien",
        ["SCRIPT_NO_URL"] = "Pas d'URL",
        ["SCRIPT_COPIED"] = "Lien copié",
        ["SCRIPT_CUSTOM_SEC"] = "Script personnalisé",
        ["SCRIPT_CUSTOM_URL"] = "URL du script",
        ["SCRIPT_CUSTOM_URL_DESC"] = "Collez un lien direct",
        ["SCRIPT_CUSTOM_LOAD"] = "Charger personnalisé",
        ["SCRIPT_CUSTOM_EMPTY"] = "Entrez une URL",
        ["SCRIPT_GUIDE"] = "Comment ajouter",
        ["SCRIPT_GUIDE_DESC"] = "Voir le tableau SCRIPT_LIB",
        ["CANCEL"] = "Annuler",
    },
}
local CurrentLang = "zh-cn"   -- 默认简体中文

-- 取当前语言文本，缺失自动回退英文
local function T(key)
    local t = LANG_TABLE[CurrentLang]
    if t and t[key] then return t[key] end
    local en = LANG_TABLE["en"]
    if en and en[key] then return en[key] end
    return key
end

-- 语言切换时用来刷新已创建控件的标题
local LangUpdaters = {}
local function bindLang(fn)
    if type(fn) == "function" then table.insert(LangUpdaters, fn) end
end
local function setTitleSafe(obj, text)
    if not obj then return end
    pcall(function()
        if obj.SetTitle then obj:SetTitle(text)
        elseif obj.Set then obj:Set(text) end
    end)
end
local function applyLanguage(langCode)
    CurrentLang = langCode
    pcall(function() WindUI:SetLanguage(langCode) end)
    for _, fn in ipairs(LangUpdaters) do pcall(fn) end
end
local function findLangCode(name)
    for _, item in ipairs(LANG_ORDER) do
        if item.Name == name then return item.Code end
    end
    return nil
end
-- =================== 多语言支持结束 ===================

WindUI.TransparencyValue = 0.2
WindUI:SetTheme("Dark")

function gradient(text, startColor, endColor)
    local result = ""
    local chars = {}
    
    for uchar in text:gmatch("[%z\1-\127\194-\244][\128-\191]*") do
        table.insert(chars, uchar)
    end
    
    local length = #chars
    
    for i = 1, length do
        local t = (i - 1) / math.max(length - 1, 1)
        local r = startColor.R + (endColor.R - startColor.R) * t
        local g = startColor.G + (endColor.G - startColor.G) * t
        local b = startColor.B + (endColor.B - startColor.B) * t
        
        result = result .. string.format('<font color="rgb(%d,%d,%d)">%s</font>', 
            math.floor(r * 255), 
            math.floor(g * 255), 
            math.floor(b * 255), 
            chars[i])
    end
    
    return result
end

WindUI:Popup({
    Title = gradient("LaevatainSky", Color3.fromHex("#6A11CB"), Color3.fromHex("#2575FC")),
    Icon = "star",
    Content = "欢迎使用 LaevatainSky",
    Buttons = {
        {
            Title = "Get Started",
            Icon = "arrow-right",
            Variant = "Primary",
            Callback = function() end
        }
    }
})


-- Add your service to get key 
--[[
WindUI.Services.mysuperservicetogetkey = {
    Name = "My Super Service",
    Icon = "droplet", -- lucide or rbxassetid or raw link to img
    
    Args = { "ServiceId" }, --       <- \
    --                                   |
    -- important!!!!!!!!!!!!!!!          |
    New = function(ServiceId) -- <------ | Args!!!!!!!!!!!!
        
        function validateKey(key) -- <--- this too important!!!
            -- your function to validate key
            -- see examples at src/utils/
            
            if not key then
                return false, "Key is invalid!" 
                
            end
            
            return true, "Key is valid!" 
        end
        
        function copyLink()
            return setclipboard("link to key system service.")
        end
        
        return {
            -- ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Å“ do not change this!!1!1!1!1!1!!1!100
            Verify = validateKey, -- <-----  THIS TOO IMPORTANT!!!!!
            Copy = copyLink -- <-------- IMPORTANT!1!1!1!1!1!1!11!
            -- ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ do not change this!!1!1!1!1!1!!1!100
        }
    end
}
]]

local Window = WindUI:CreateWindow({
    Title = "LaevatainSky",
    Icon = "monitor",
    Author = "LaevatainSky v1",
    Folder = "LaevatainSky",
    Size = UDim2.fromOffset(580, 490),
    Theme = "Dark",
    -- Background = WindUI:Gradient({
    --     ["0"] = { Color = Color3.fromHex("#0f0c29"), Transparency = 1 },
    --     ["100"] = { Color = Color3.fromHex("#302b63"), Transparency = 0.9 },
    -- }, {
    --     Rotation = 45,
    -- }),
    --Background = "video:https://cdn.discordapp.com/attachments/1337368451865645096/1402703845657673878/VID_20250616_180732_158.webm?ex=68958a01&is=68943881&hm=164c5b04d1076308b38055075f7eb0653c1d73bec9bcee08e918a31321fe3058&",
    User = {
        Enabled = true,
        Anonymous = false,   -- false = 显示真实头像与名字
        Callback = function()
            WindUI:Notify({
                Title = T("PROFILE_GREET"),
                Content = LocalPlayer.DisplayName .. " (@" .. LocalPlayer.Name .. ")",
                Duration = 3
            })
        end
    },
    Acrylic = true,
    HideSearchBar = false,
    SideBarWidth = 200,
})


-- OPTIONAL   >:(

Window:Tag({
    Title = "v1.6.4",
    Color = Color3.fromHex("#30ff6a")
})
Window:Tag({
    Title = "Alpha",
    Color = Color3.fromHex("#315dff")
})
local TimeTag = Window:Tag({
    Title = "--:--",
    Radius = 0,
    --Color = Color3.fromHex("#000000"),
    Color = WindUI:Gradient({
        ["0"]   = { Color = Color3.fromHex("#FF0F7B"), Transparency = 0 },
        ["100"] = { Color = Color3.fromHex("#F89B29"), Transparency = 0 },
    }, {
        Rotation = 45,
    }),
})


local hue = 0

-- Rainbow effect & Time 
task.spawn(function()
	while true do
		local now = os.date("*t")
		local hours = string.format("%02d", now.hour)
		local minutes = string.format("%02d", now.min)
		
		hue = (hue + 0.01) % 1
		local color = Color3.fromHSV(hue, 1, 1)
		
		TimeTag:SetTitle(hours .. ":" .. minutes)
		--TimeTag:SetColor(color)

		task.wait(0.06)
	end
end)


Window:CreateTopbarButton("theme-switcher", "moon", function()
    WindUI:SetTheme(WindUI:GetCurrentTheme() == "Dark" and "Light" or "Dark")
    WindUI:Notify({
        Title = "Theme Changed",
        Content = "Current theme: "..WindUI:GetCurrentTheme(),
        Duration = 2
    })
end, 990)

local Tabs = {
    Main = Window:Section({ Title = "loc:FEATURES", Opened = true }),
    Settings = Window:Section({ Title = "loc:SETTINGS", Opened = true }),
    Scripts = Window:Section({ Title = "脚本", Opened = false })
}

local TabHandles = {
    Profile = Tabs.Main:Tab({ Title = T("PROFILE_TAB"), Icon = "user", Desc = T("PROFILE_DESC") }),
    ESP = Tabs.Main:Tab({ Title = T("ESP_TAB"), Icon = "eye", Desc = T("ESP_DESC") }),
    ESPPlus = Tabs.Main:Tab({ Title = "ESP 扩展", Icon = "shapes", Desc = "骨架 / 3D框 / 雷达等扩展绘制" }),
    Aimbot = Tabs.Main:Tab({ Title = T("AIM_TAB"), Icon = "crosshair", Desc = T("AIM_DESC") }),
    Bullet = Tabs.Main:Tab({ Title = T("BULLET_TAB"), Icon = "target", Desc = T("BULLET_DESC") }),
    Fly = Tabs.Main:Tab({ Title = T("FLY_TAB"), Icon = "wind", Desc = T("FLY_DESC") }),
    Misc = Tabs.Main:Tab({ Title = T("MISC_TAB"), Icon = "type", Desc = T("MISC_DESC") }),
    Language = Tabs.Settings:Tab({ Title = T("LANG_TAB"), Icon = "globe", Desc = T("LANG_DESC") }),
    Appearance = Tabs.Settings:Tab({ Title = "loc:APPEARANCE", Icon = "brush" }),
    Elements = Tabs.Settings:Tab({ Title = "loc:UI_ELEMENTS", Icon = "layout-grid", Desc = "UI Elements Example" }),
    ScriptHub = Tabs.Scripts:Tab({ Title = "脚本库", Icon = "list", Desc = "收录各服务器/游戏的第三方脚本" })
}

-- ========================= ESP 功能模块 =========================
local Ctl = {}   -- 控件注册表（避免 main chunk 局部变量超限）

local CurrentBulletTarget = nil
local ESPLastError = nil
local ESPDrawnCount = 0
local espWasEnabled = false

-- ESP 全局状态
Ctl.ESPState = {
    Enabled = false,
    Box = true,
    Name = true,
    Distance = true,
    Health = true,
    Tracer = false,
    TeamCheck = false,
    VisibleCheck = false,
    MaxDistance = 500,
    Thickness = 1,
    TextSize = 14,
    Color = Color3.fromHex("#30ff6a"),
    NameMode = "用户名",
    DistanceUnit = "UNIT_M",
    FontName = "UI",
    AsciiFallback = true,       -- 显示名含非ASCII时自动回退用用户名
    -- 扩展绘制
    Skeleton = false,           -- 骨架连线
    Box3D = false,              -- 3D 立体框
    Highlight = false,          -- 原生 Highlight 描边（穿墙可见）
    HeadDot = false,            -- 头顶圆圈
    ViewLine = false,           -- 视野朝向线
    OffScreenArrow = false,     -- 屏幕外箭头
    -- 信息显示
    ShowWeapon = false,         -- 手持武器
    ShowTeam = false,           -- 队伍
    HealthNumber = false,       -- 血量数字
    TargetHighlight = true,     -- 锁定目标用红色标出
    -- 雷达
    Radar = false,
    RadarSize = 150,
    RadarRange = 150,
    RadarPos = "右下",
    TargetColor = Color3.fromHex("#ff4d4d"),
    UnitScale = 0.28,
    Minimal = false,
}

local ESPDrawings = {}   -- [Player] = { Box, Name, Dist, HealthBg, HealthBar, Tracer }
local ESPSupported = true

local function newDrawing(class)
    local ok, obj = pcall(Drawing.new, class)
    if not ok or not obj then ESPSupported = false; return nil end
    obj.Visible = false
    return obj
end

-- Drawing 字体映射（不同执行器枚举值不同，用 pcall 兜底）
local DrawingFonts = {}
pcall(function()
    local f = Drawing.Fonts
    DrawingFonts = {
        UI        = f.UI,
        Roblox    = f.Roblox,
        System    = f.System,
        Code      = f.Code,
        Plex      = f.Plex,
        Monospace = f.Monospace,
    }
end)
if DrawingFonts.UI == nil then
    DrawingFonts = { UI = 0, Roblox = 1, System = 2, Code = 3, Plex = 4, Monospace = 5 }
end

local function applyFont(textObj)
    pcall(function()
        textObj.Font = DrawingFonts[Ctl.ESPState.FontName] or DrawingFonts.UI
    end)
end

local function setVis(d, v)
    if d == nil then return end
    pcall(function() d.Visible = v end)
end

local function createESPObject(plr)
    local obj = { _hidden = true }

    local box = newDrawing("Square")
    if box then pcall(function() box.Filled = false; box.Thickness = 1; box.Transparency = 1; box.Visible = false end) end
    obj.Box = box

    local name = newDrawing("Text")
    if name then pcall(function() name.Center = true; name.Outline = true; name.Size = Ctl.ESPState.TextSize; name.Visible = false end); applyFont(name) end
    obj.Name = name

    local dist = newDrawing("Text")
    if dist then pcall(function() dist.Center = true; dist.Outline = true; dist.Size = Ctl.ESPState.TextSize - 1; dist.Visible = false end); applyFont(dist) end
    obj.Dist = dist

    local hBg = newDrawing("Square")
    if hBg then pcall(function() hBg.Filled = true; hBg.Thickness = 1; hBg.Transparency = 0.4; hBg.Color = Color3.new(0, 0, 0); hBg.Visible = false end) end
    obj.HealthBg = hBg

    local hBar = newDrawing("Square")
    if hBar then pcall(function() hBar.Filled = true; hBar.Thickness = 1; hBar.Transparency = 0; hBar.Visible = false end) end
    obj.HealthBar = hBar

    local tracer = newDrawing("Line")
    if tracer then pcall(function() tracer.Thickness = 1; tracer.Visible = false end) end
    obj.Tracer = tracer

    -- 扩展对象懒创建，最小模式下完全不建，省大量 Drawing 对象
    obj.Bones = nil
    obj.Box3D = nil
    obj.HeadDot = nil
    obj.ViewLine = nil
    obj.Arrow = nil
    obj.Weapon = nil
    obj.Team = nil
    obj.HP = nil
    obj.Highlight = nil

    ESPDrawings[plr] = obj
    return obj
end

local function ensureLines(obj, key, n)
    if obj[key] then return obj[key] end
    local t = {}
    for i = 1, n do
        local l = newDrawing("Line")
        if l then pcall(function() l.Thickness = 1; l.Visible = false end); t[#t + 1] = l end
    end
    obj[key] = t
    return t
end

local function ensureOne(obj, key, class)
    if obj[key] then return obj[key] end
    local d = newDrawing(class)
    if not d then return nil end
    pcall(function()
        d.Visible = false
        if class == "Text" then d.Center = true; d.Outline = true; d.Size = Ctl.ESPState.TextSize - 1 end
        if class == "Circle" then d.Filled = false; d.NumSides = 24; d.Thickness = 1 end
        if class == "Line" then d.Thickness = 1 end
    end)
    if class == "Text" then applyFont(d) end
    obj[key] = d
    return d
end

local function ensureHighlight(obj)
    if obj.Highlight then return obj.Highlight end
    local hl = nil
    pcall(function()
        hl = Instance.new("Highlight")
        hl.FillTransparency = 1
        hl.OutlineTransparency = 0
        hl.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
        hl.Enabled = false
    end)
    obj.Highlight = hl
    return hl
end

-- 骨架定义：兼容 R15 与 R6，{ 起点候选名, 终点候选名 }
Ctl.BONE_LINKS = {
    { { "Head" }, { "UpperTorso", "Torso" } },
    { { "UpperTorso", "Torso" }, { "LowerTorso", "Torso" } },
    { { "UpperTorso", "Torso" }, { "LeftUpperArm", "Left Arm" } },
    { { "LeftUpperArm", "Left Arm" }, { "LeftLowerArm", "Left Arm" } },
    { { "LeftLowerArm", "Left Arm" }, { "LeftHand", "Left Arm" } },
    { { "UpperTorso", "Torso" }, { "RightUpperArm", "Right Arm" } },
    { { "RightUpperArm", "Right Arm" }, { "RightLowerArm", "Right Arm" } },
    { { "RightLowerArm", "Right Arm" }, { "RightHand", "Right Arm" } },
    { { "LowerTorso", "Torso" }, { "LeftUpperLeg", "Left Leg" } },
    { { "LeftUpperLeg", "Left Leg" }, { "LeftLowerLeg", "Left Leg" } },
    { { "LowerTorso", "Torso" }, { "RightUpperLeg", "Right Leg" } },
    { { "RightUpperLeg", "Right Leg" }, { "RightLowerLeg", "Right Leg" } },
}

local function findPart(char, names)
    for _, n in ipairs(names) do
        local p = char:FindFirstChild(n)
        if p and p:IsA("BasePart") then return p end
    end
    return nil
end

-- 3D 立方体 12 条边（顶点索引）
Ctl.BOX3D_EDGES = {
    { 1, 2 }, { 2, 3 }, { 3, 4 }, { 4, 1 },   -- 底面
    { 5, 6 }, { 6, 7 }, { 7, 8 }, { 8, 5 },   -- 顶面
    { 1, 5 }, { 2, 6 }, { 3, 7 }, { 4, 8 },   -- 竖边
}

local function hideAll(obj)
    if not obj or obj._hidden then return end
    setVis(obj.Box, false); setVis(obj.Name, false); setVis(obj.Dist, false)
    setVis(obj.HealthBg, false); setVis(obj.HealthBar, false); setVis(obj.Tracer, false)
    setVis(obj.HeadDot, false); setVis(obj.ViewLine, false); setVis(obj.Arrow, false)
    setVis(obj.Weapon, false); setVis(obj.Team, false); setVis(obj.HP, false)
    if obj.Bones then for _, l in ipairs(obj.Bones) do setVis(l, false) end end
    if obj.Box3D then for _, l in ipairs(obj.Box3D) do setVis(l, false) end end
    if obj.Highlight then pcall(function() obj.Highlight.Enabled = false end) end
    obj._hidden = true
end

local function removeESPObject(plr)
    local obj = ESPDrawings[plr]
    if not obj then return end
    for k, d in pairs(obj) do
        if k == "Bones" or k == "Box3D" or k == "_hidden" then
            if type(d) == "table" then
                for _, l in ipairs(d) do pcall(function() l:Remove() end) end
            end
        elseif d ~= nil then
            pcall(function()
                if typeof(d) == "Instance" then d:Destroy() else d:Remove() end
            end)
        end
    end
    ESPDrawings[plr] = nil
end

-- 是否含非 ASCII 字符（中文等）
local function hasNonAscii(s)
    return s:match("[\128-\255]") ~= nil
end

local function getNameText(plr)
    local dn = plr.DisplayName or plr.Name
    local mode = Ctl.ESPState.NameMode
    if mode == "显示名" then
        if Ctl.ESPState.AsciiFallback and hasNonAscii(dn) then return plr.Name end
        return dn
    elseif mode == "两者" then
        if Ctl.ESPState.AsciiFallback and hasNonAscii(dn) then return plr.Name end
        if dn == plr.Name then return plr.Name end
        return dn .. " (@" .. plr.Name .. ")"
    end
    return plr.Name  -- 默认：用户名（纯 ASCII，绝不乱码）
end

local function isEnemy(plr)
    if Ctl.ESPState.TeamCheck and LocalPlayer.Team and plr.Team then
        return plr.Team ~= LocalPlayer.Team
    end
    return true
end

-- 视线检测：true = 没被墙挡住（复用 params，角色为空时不会崩）
Ctl.LOSParams = RaycastParams.new()
Ctl.LOSParams.FilterType = Enum.RaycastFilterType.Blacklist
Ctl.LOSParams.IgnoreWater = true
Ctl.LOSCharCache = nil

local function hasLineOfSight(part)
    local origin = Camera.CFrame.Position
    local dir = part.Position - origin
    local len = dir.Magnitude
    if len <= 0 then return true end

    local myChar = LocalPlayer.Character
    if Ctl.LOSCharCache ~= myChar then
        LOSCharCache = myChar
        pcall(function()
            Ctl.LOSParams.FilterDescendantsInstances = myChar and { myChar } or {}
        end)
    end

    local ok, result = pcall(function()
        return workspace:Raycast(origin, dir.Unit * len, Ctl.LOSParams)
    end)
    if not ok or not result or not result.Instance then return true end

    local char = part.Parent
    if not char then return false end
    local ok2, isDesc = pcall(function() return result.Instance:IsDescendantOf(char) end)
    return ok2 and isDesc
end

-- 雷达
Ctl.RadarRing = nil
Ctl.RadarDots = {}

pcall(function()
    RadarRing = Drawing.new("Circle")
    Ctl.RadarRing.Filled = false
    Ctl.RadarRing.Thickness = 1
    Ctl.RadarRing.NumSides = 48
    Ctl.RadarRing.Transparency = 0.8
    Ctl.RadarRing.Visible = false
end)

local function getRadarCenter()
    local size = Ctl.ESPState.RadarSize
    local vs = Camera.ViewportSize
    local m = 20
    if Ctl.ESPState.RadarPos == "右下" then
        return Vector2.new(vs.X - size / 2 - m, vs.Y - size / 2 - m)
    elseif Ctl.ESPState.RadarPos == "右上" then
        return Vector2.new(vs.X - size / 2 - m, size / 2 + m)
    elseif Ctl.ESPState.RadarPos == "左下" then
        return Vector2.new(size / 2 + m, vs.Y - size / 2 - m)
    end
    return Vector2.new(size / 2 + m, size / 2 + m)
end

local function updateRadar()
    if not Ctl.RadarRing then return end
    if not (Ctl.ESPState.Enabled and Ctl.ESPState.Radar and not Ctl.ESPState.Minimal) then
        Ctl.RadarRing.Visible = false
        for plr, dot in pairs(Ctl.RadarDots) do
            pcall(function() dot.Visible = false end)
        end
        return
    end
    local center = getRadarCenter()
    local radius = Ctl.ESPState.RadarSize / 2
    local range = math.max(Ctl.ESPState.RadarRange, 1)
    Ctl.RadarRing.Position = center
    Ctl.RadarRing.Radius = radius
    Ctl.RadarRing.Color = Ctl.ESPState.Color
    Ctl.RadarRing.Visible = true

    local myHRP = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not myHRP then return end
    local myPos = myHRP.Position
    local look = Camera.CFrame.LookVector
    local yaw = math.atan2(look.X, -look.Z)

    local seen = {}
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer and isEnemy(plr) then
            local char = plr.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart")
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            if hrp and hum and hum.Health > 0 then
                local rel = hrp.Position - myPos
                local d3 = rel.Magnitude
                if d3 <= range then
                    local dot = Ctl.RadarDots[plr]
                    if not dot then
                        local ok2, d = pcall(function() return Drawing.new("Circle") end)
                        if ok2 and d then
                            d.Filled = true
                            d.NumSides = 12
                            d.Thickness = 1
                            dot = d
                            Ctl.RadarDots[plr] = dot
                        end
                    end
                    if dot then
                        local ang = math.atan2(rel.X, -rel.Z) - yaw
                        local rx = math.sin(ang) * (d3 / range) * radius
                        local ry = -math.cos(ang) * (d3 / range) * radius
                        pcall(function()
                            dot.Position = center + Vector2.new(rx, ry)
                            dot.Radius = 3
                            dot.Color = Ctl.ESPState.Color
                            dot.Visible = true
                        end)
                        seen[plr] = true
                    end
                end
            end
        end
    end
    for plr, dot in pairs(Ctl.RadarDots) do
        if not seen[plr] then
            pcall(function() dot.Visible = false end)
        end
    end
end

-- 记录当前锁定目标，供 ESP 高亮使用
CurrentBulletTarget = nil
RunService.RenderStepped:Connect(function()
    pcall(function()
        if Ctl.BulletState and Ctl.BulletState.Enabled then
            local ok2, t = pcall(findBulletTarget)
            CurrentBulletTarget = (ok2 and t) or nil
        else
            CurrentBulletTarget = nil
        end
    end)
end)

local function cleanupAllESP()
    for _, obj in pairs(ESPDrawings) do hideAll(obj) end
    if Ctl.RadarRing then setVis(Ctl.RadarRing, false) end
    for _, dot in pairs(Ctl.RadarDots) do setVis(dot, false) end
end

local function formatDistance(studs)
    local scale = tonumber(Ctl.ESPState.UnitScale) or 0.28
    if scale <= 0 then scale = 0.28 end
    local meters = studs * scale

    if Ctl.ESPState.DistanceUnit == "UNIT_STUD" then
        return string.format("%d st", math.floor(studs + 0.5))
    elseif Ctl.ESPState.DistanceUnit == "UNIT_KM" then
        if meters >= 1000 then
            return string.format("%.2f km", meters / 1000)
        elseif meters >= 100 then
            return string.format("%.1f km", meters / 1000)
        end
        return string.format("%.3f km", meters / 1000)
    end

    -- 默认米
    if meters >= 100 then
        return string.format("%d m", math.floor(meters + 0.5))
    elseif meters >= 10 then
        return string.format("%.1f m", meters)
    end
    return string.format("%.2f m", meters)
end

local function updateESP()
    if not ESPSupported then return end
    if not Ctl.ESPState.Enabled then
        if espWasEnabled then cleanupAllESP(); espWasEnabled = false end
        return
    end
    espWasEnabled = true

    Camera = workspace.CurrentCamera or Camera
    if not Camera then return end
    local camPos = Camera.CFrame.Position
    local screenSize = Camera.ViewportSize

    for plr in pairs(ESPDrawings) do
        if plr.Parent ~= Players then removeESPObject(plr) end
    end

    local minimal = Ctl.ESPState.Minimal
    local useSkel = Ctl.ESPState.Skeleton and not minimal
    local useBox3d = Ctl.ESPState.Box3D and not minimal
    local useHL = Ctl.ESPState.Highlight and not minimal
    local useHeadDot = Ctl.ESPState.HeadDot and not minimal
    local useViewLine = Ctl.ESPState.ViewLine and not minimal
    local useWeapon = Ctl.ESPState.ShowWeapon and not minimal
    local useTeamInfo = Ctl.ESPState.ShowTeam and not minimal
    local useHpNum = Ctl.ESPState.HealthNumber and not minimal

    ESPDrawnCount = 0
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr == LocalPlayer then continue end
        local obj = ESPDrawings[plr] or createESPObject(plr)
        if not obj then continue end

        local char = plr.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        local head = char and char:FindFirstChild("Head")

        local show = Ctl.ESPState.Enabled and hrp ~= nil and hum ~= nil and hum.Health > 0 and isEnemy(plr)
        local dist = 0
        if show then
            dist = (hrp.Position - camPos).Magnitude
            if dist > Ctl.ESPState.MaxDistance then show = false end
            if show and Ctl.ESPState.VisibleCheck and not hasLineOfSight(hrp) then show = false end
        end
        if not show then hideAll(obj); continue end
        obj._hidden = false

        local rootPos, onScreen = Camera:WorldToViewportPoint(hrp.Position)
        local topPos = Camera:WorldToViewportPoint((head and head.Position or hrp.Position) + Vector3.new(0, 0.6, 0))
        local bottomPos = Camera:WorldToViewportPoint(hrp.Position - Vector3.new(0, 2.8, 0))
        if not onScreen then hideAll(obj); continue end

        -- 锁定目标用不同颜色
        local drawColor = Ctl.ESPState.Color
        local isTarget = false
        if Ctl.ESPState.TargetHighlight and CurrentBulletTarget then
            local okT, r = pcall(function() return CurrentBulletTarget:IsDescendantOf(char) end)
            isTarget = okT and r
        end
        if isTarget then
            drawColor = Ctl.ESPState.TargetColor
        end

        local height = math.max(math.abs(bottomPos.Y - topPos.Y), 4)
        local width = math.clamp(height / 2, 2, 400)
        local x = rootPos.X - width / 2
        local y = topPos.Y

        -- 方框
        obj.Box.Visible = Ctl.ESPState.Box
        if Ctl.ESPState.Box then
            obj.Box.Size = Vector2.new(width, height)
            obj.Box.Position = Vector2.new(x, y)
            obj.Box.Color = drawColor
            obj.Box.Thickness = Ctl.ESPState.Thickness
        end

        -- 名字（框上方）
        obj.Name.Visible = Ctl.ESPState.Name
        if Ctl.ESPState.Name then
            obj.Name.Text = getNameText(plr)
            obj.Name.Position = Vector2.new(rootPos.X, y - Ctl.ESPState.TextSize - 3)
            obj.Name.Color = drawColor
            obj.Name.Size = Ctl.ESPState.TextSize
        end

        -- 血量条（框正下方水平条，宽度与框一致，保证可见）
        local ratio = math.clamp(hum.Health / math.max(hum.MaxHealth, 1), 0, 1)
        obj.HealthBg.Visible = Ctl.ESPState.Health
        obj.HealthBar.Visible = Ctl.ESPState.Health
        local barH = 4
        if Ctl.ESPState.Health then
            local barY = y + height + 3
            obj.HealthBg.Size = Vector2.new(width, barH)
            obj.HealthBg.Position = Vector2.new(x, barY)
            obj.HealthBg.Color = Color3.new(0, 0, 0)
            obj.HealthBg.Transparency = 0.35
            obj.HealthBg.Filled = true
            obj.HealthBar.Size = Vector2.new(math.max(width * ratio, 0), barH)
            obj.HealthBar.Position = Vector2.new(x, barY)
            obj.HealthBar.Color = Color3.fromRGB(math.floor(255 * (1 - ratio)), math.floor(255 * ratio), 60)
            obj.HealthBar.Transparency = 0
            obj.HealthBar.Filled = true
        end

        -- 距离（血条下方，避免重叠）
        obj.Dist.Visible = Ctl.ESPState.Distance
        if Ctl.ESPState.Distance then
            local distY = y + height + (Ctl.ESPState.Health and (barH + 6) or 4)
            obj.Dist.Text = formatDistance(dist)
            obj.Dist.Position = Vector2.new(rootPos.X, distY)
            obj.Dist.Color = Color3.new(1, 1, 1)
            obj.Dist.Size = Ctl.ESPState.TextSize - 1
        end

        ESPDrawnCount = ESPDrawnCount + 1

        -- 追踪线
        obj.Tracer.Visible = Ctl.ESPState.Tracer
        if Ctl.ESPState.Tracer then
            obj.Tracer.From = Vector2.new(screenSize.X / 2, screenSize.Y)
            obj.Tracer.To = Vector2.new(rootPos.X, y + height)
            obj.Tracer.Color = drawColor
            obj.Tracer.Thickness = Ctl.ESPState.Thickness
        end

        -- 骨架连线
        if not useSkel and obj.Bones then
            for _, l in ipairs(obj.Bones) do setVis(l, false) end
        elseif useSkel then
        local bones = ensureLines(obj, "Bones", 12)
        for i, line in ipairs(bones) do
            local vis = false
            if true then
                local link = Ctl.BONE_LINKS[i]
                if link then
                    local a = findPart(char, link[1])
                    local b = findPart(char, link[2])
                    if a and b then
                        local pa, va = Camera:WorldToViewportPoint(a.Position)
                        local pb, vb = Camera:WorldToViewportPoint(b.Position)
                        if va and vb then
                            line.From = Vector2.new(pa.X, pa.Y)
                            line.To = Vector2.new(pb.X, pb.Y)
                            line.Color = drawColor
                            line.Thickness = Ctl.ESPState.Thickness
                            vis = true
                        end
                    end
                end
            end
            setVis(line, vis)
        end
        end

        -- 3D 立体框
        if not useBox3d and obj.Box3D then
            for _, l in ipairs(obj.Box3D) do setVis(l, false) end
        elseif useBox3d then
        local corners = nil
        do
            local okSz, ext = pcall(function() return char:GetExtentsSize() end)
            local sx = (okSz and ext and ext.X > 0.5) and ext.X or 2
            local sy = (okSz and ext and ext.Y > 0.5) and ext.Y or 5
            local sz = (okSz and ext and ext.Z > 0.5) and ext.Z or 2
            local cf = hrp.CFrame
            corners = {}
            local offs = {
                Vector3.new(-sx / 2, -sy / 2, -sz / 2),
                Vector3.new(sx / 2, -sy / 2, -sz / 2),
                Vector3.new(sx / 2, -sy / 2, sz / 2),
                Vector3.new(-sx / 2, -sy / 2, sz / 2),
                Vector3.new(-sx / 2, sy / 2, -sz / 2),
                Vector3.new(sx / 2, sy / 2, -sz / 2),
                Vector3.new(sx / 2, sy / 2, sz / 2),
                Vector3.new(-sx / 2, sy / 2, sz / 2),
            }
            for _, o in ipairs(offs) do
                local wp, v = Camera:WorldToViewportPoint((cf * CFrame.new(o)).Position)
                corners[#corners + 1] = v and Vector2.new(wp.X, wp.Y) or nil
            end
        end
        local box3dLines = ensureLines(obj, "Box3D", 12)
        for i, line in ipairs(box3dLines) do
            local vis = false
            if corners then
                local e = Ctl.BOX3D_EDGES[i]
                local a = corners[e[1]]
                local b = corners[e[2]]
                if a and b then
                    line.From = a
                    line.To = b
                    line.Color = drawColor
                    line.Thickness = Ctl.ESPState.Thickness
                    vis = true
                end
            end
            setVis(line, vis)
        end
        end

        -- 头顶圆圈
        local headDot = useHeadDot and ensureOne(obj, "HeadDot", "Circle") or nil
        if obj.HeadDot and not useHeadDot then setVis(obj.HeadDot, false) end
        if headDot then
            setVis(headDot, false)
            if head then
                local hp2, hv = Camera:WorldToViewportPoint(head.Position + Vector3.new(0, 0.5, 0))
                if hv then
                    headDot.Position = Vector2.new(hp2.X, hp2.Y)
                    headDot.Radius = math.clamp(width / 4, 3, 60)
                    headDot.Color = drawColor
                    headDot.Thickness = Ctl.ESPState.Thickness
                    headDot.Visible = true
                end
            end
        end

        -- 视野朝向线
        local viewLine = useViewLine and ensureOne(obj, "ViewLine", "Line") or nil
        if obj.ViewLine and not useViewLine then setVis(obj.ViewLine, false) end
        if viewLine then
            setVis(viewLine, false)
            if head then
                local look = head.CFrame.LookVector
                local p1, v1 = Camera:WorldToViewportPoint(head.Position)
                local p2, v2 = Camera:WorldToViewportPoint(head.Position + look * 5)
                if v1 and v2 then
                    viewLine.From = Vector2.new(p1.X, p1.Y)
                    viewLine.To = Vector2.new(p2.X, p2.Y)
                    viewLine.Color = drawColor
                    viewLine.Thickness = Ctl.ESPState.Thickness
                    viewLine.Visible = true
                end
            end
        end

        -- 原生 Highlight 描边
        pcall(function()
            local hl = useHL and ensureHighlight(obj) or obj.Highlight
            if hl then
                if useHL then
                    if hl.Adornee ~= char then hl.Adornee = char end
                    if hl.Parent ~= char then
                        hl.Parent = char
                    end
                    hl.OutlineColor = drawColor
                    hl.Enabled = true
                else
                    hl.Enabled = false
                end
            end
        end)

        -- 屏幕外箭头
        if obj.Arrow then setVis(obj.Arrow, false) end

        -- 信息文本：武器 / 队伍 / 血量数字
        local infoY = y + height + (Ctl.ESPState.Health and (barH + 6) or 4)
            + (Ctl.ESPState.Distance and (Ctl.ESPState.TextSize + 2) or 0)

        local wpn = useWeapon and ensureOne(obj, "Weapon", "Text") or nil
        if obj.Weapon and not useWeapon then setVis(obj.Weapon, false) end
        if wpn then
            setVis(wpn, false)
            local tool = char:FindFirstChildOfClass("Tool")
            if tool then
                pcall(function()
                    wpn.Text = tostring(tool.Name)
                    wpn.Position = Vector2.new(rootPos.X, infoY)
                    wpn.Color = Color3.new(1, 1, 1)
                    wpn.Size = Ctl.ESPState.TextSize - 1
                    wpn.Visible = true
                end)
                infoY = infoY + Ctl.ESPState.TextSize + 2
            end
        end

        local tm = useTeamInfo and ensureOne(obj, "Team", "Text") or nil
        if obj.Team and not useTeamInfo then setVis(obj.Team, false) end
        if tm and plr.Team then
            setVis(tm, false)
            pcall(function()
                tm.Text = "[" .. tostring(plr.Team.Name) .. "]"
                tm.Position = Vector2.new(rootPos.X, infoY)
                tm.Color = Ctl.ESPState.TeamCheck and Color3.fromHex("#315dff") or Color3.new(1, 1, 1)
                tm.Size = Ctl.ESPState.TextSize - 1
                tm.Visible = true
            end)
            infoY = infoY + Ctl.ESPState.TextSize + 2
        elseif tm then
            setVis(tm, false)
        end

        local hpTxt = useHpNum and ensureOne(obj, "HP", "Text") or nil
        if obj.HP and not useHpNum then setVis(obj.HP, false) end
        if hpTxt then
            pcall(function()
                hpTxt.Text = tostring(math.floor(hum.Health)) .. " / " .. tostring(math.floor(hum.MaxHealth))
                hpTxt.Position = Vector2.new(rootPos.X, infoY)
                hpTxt.Color = Color3.fromRGB(math.floor(255 * (1 - ratio)), math.floor(255 * ratio), 60)
                hpTxt.Size = Ctl.ESPState.TextSize - 1
                hpTxt.Visible = true
            end)
        end
    end

    -- 屏幕外箭头：为不在画面内的目标绘制
    if Ctl.ESPState.OffScreenArrow and not minimal and Ctl.ESPState.Enabled then
        for plr, obj in pairs(ESPDrawings) do
            if plr == LocalPlayer then continue end
            local char = plr.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart")
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            if hrp and hum and hum.Health > 0 and isEnemy(plr) then
                local d3 = (hrp.Position - camPos).Magnitude
                if d3 <= Ctl.ESPState.MaxDistance then
                    local sp, onScreen = Camera:WorldToViewportPoint(hrp.Position)
                    if not onScreen then
                        local dir = Vector2.new(sp.X - screenSize.X / 2, sp.Y - screenSize.Y / 2)
                        if dir.Magnitude > 0 then
                            local ang = math.atan2(dir.Y, dir.X)
                            local marg = 30
                            local hw = screenSize.X / 2 - marg
                            local hh = screenSize.Y / 2 - marg
                            local scale = math.min(
                                math.abs(hw / (math.cos(ang) ~= 0 and math.cos(ang) or 0.0001)),
                                math.abs(hh / (math.sin(ang) ~= 0 and math.sin(ang) or 0.0001))
                            )
                            if scale == scale and scale ~= math.huge then
                                local px = screenSize.X / 2 + math.cos(ang) * scale
                                local py = screenSize.Y / 2 + math.sin(ang) * scale
                                local deg = math.deg(ang)
                                local ch = ">"
                                if deg > -45 and deg <= 45 then ch = ">"
                                elseif deg > 45 and deg <= 135 then ch = "v"
                                elseif deg > -135 and deg <= -45 then ch = "^"
                                else ch = "<" end
                                local arrow = ensureOne(obj, "Arrow", "Text")
                                if arrow then
                                    pcall(function()
                                        arrow.Text = ch
                                        arrow.Position = Vector2.new(px, py)
                                        arrow.Color = Ctl.ESPState.Color
                                        arrow.Size = 20
                                        arrow.Visible = true
                                    end)
                                end
                            end
                        end
                    end
                end
            end
        end
    end

    -- 雷达
    pcall(updateRadar)
end

RunService.RenderStepped:Connect(function()
    local ok, err = pcall(updateESP)
    if not ok and err then
        local trace = ""
        pcall(function()
            if debug and debug.traceback then trace = debug.traceback(err, 2) end
        end)
        ESPLastError = tostring(err) .. (trace ~= "" and ("\n" .. trace) or "")
    end
end)
Players.PlayerRemoving:Connect(removeESPObject)

-- ESP 界面
-- 容错创建：单个控件出错不会中断整页构建，错误记入 UIErrorLog 供诊断查看
local UIErrorLog = {}

local function makeDummy()
    local d = {}
    setmetatable(d, {
        __index = function(_, k)
            if k == "Title" or k == "Desc" or k == "Value" then return nil end
            return function() return makeDummy() end
        end,
        __call = function() return makeDummy() end,
    })
    return d
end

local function safeCreate(creator, method, cfg, tag)
    if creator == nil then
        table.insert(UIErrorLog, tostring(tag or method) .. ": parent nil")
        return makeDummy()
    end
    local ok, res = pcall(function() return creator[method](creator, cfg) end)
    if not ok then
        table.insert(UIErrorLog, tostring(tag or method) .. ": " .. tostring(res))
        return makeDummy()
    end
    return res or makeDummy()
end

safeCreate(TabHandles.ESP, "Paragraph", {
    Title = T("ESP_TITLE"),
    Desc = T("ESP_DESC"),
    Image = "eye",
    ImageSize = 20,
    Color = Color3.fromHex("#30ff6a"),
})
safeCreate(TabHandles.ESP, "Divider", {})

local espToggle = safeCreate(TabHandles.ESP, "Toggle", {
    Title = T("ESP_ENABLE"),
    Desc = T("ESP_ENABLE_DESC"),
    Value = false,
    Callback = function(state)
        if state and not ESPSupported then
            WindUI:Notify({ Title = T("ESP_NOTSUP_TITLE"), Content = T("ESP_NOTSUP_MSG"), Icon = "x", Duration = 4 })
            espToggle:Set(false)
            return
        end
        Ctl.ESPState.Enabled = state
        if not state then
            for plr in pairs(ESPDrawings) do hideAll(ESPDrawings[plr]) end
        end
    end
})

Ctl.espSectionDraw = safeCreate(TabHandles.ESP, "Section", { Title = T("ESP_DRAW"), Icon = "shapes" })
Ctl.espBoxToggle = safeCreate(Ctl.espSectionDraw, "Toggle", { Title = T("ESP_BOX"), Value = Ctl.ESPState.Box, Callback = function(s) Ctl.ESPState.Box = s end })
Ctl.espNameToggle = safeCreate(Ctl.espSectionDraw, "Toggle", { Title = T("ESP_NAME"), Value = Ctl.ESPState.Name, Callback = function(s) Ctl.ESPState.Name = s end })
Ctl.espDistToggle = safeCreate(Ctl.espSectionDraw, "Toggle", { Title = T("ESP_DISTANCE"), Value = Ctl.ESPState.Distance, Callback = function(s) Ctl.ESPState.Distance = s end })
Ctl.espHealthToggle = safeCreate(Ctl.espSectionDraw, "Toggle", { Title = T("ESP_HEALTH"), Value = Ctl.ESPState.Health, Callback = function(s) Ctl.ESPState.Health = s end })
Ctl.espTracerToggle = safeCreate(Ctl.espSectionDraw, "Toggle", { Title = T("ESP_TRACER"), Value = Ctl.ESPState.Tracer, Callback = function(s) Ctl.ESPState.Tracer = s end })

safeCreate(TabHandles.ESPPlus, "Paragraph", {
    Title = "ESP 扩展绘制",
    Desc = "骨架 / 3D框 / 高亮 / 雷达等，按需开启以免掉帧",
    Image = "shapes",
    ImageSize = 20,
    Color = "White",
}, "espPlusHeader")
safeCreate(TabHandles.ESPPlus, "Divider", {}, "espPlusDivider")

Ctl.espMinimalToggle = safeCreate(TabHandles.ESPPlus, "Toggle", {
    Title = "最小模式",
    Desc = "开启后只画方框/名字/距离/血条，暂停全部扩展绘制",
    Value = Ctl.ESPState.Minimal,
    Callback = function(v) Ctl.ESPState.Minimal = v end
}, "espMinimalToggle")

Ctl.espSectionExt = safeCreate(TabHandles.ESPPlus, "Section", { Title = T("ESP_DRAW_EXT"), Icon = "shapes" })
bindLang(function() setTitleSafe(Ctl.espSectionExt, T("ESP_DRAW_EXT")) end)

Ctl.espSkeletonToggle = safeCreate(Ctl.espSectionExt, "Toggle", {
    Title = T("ESP_SKELETON"),
    Desc = T("ESP_SKELETON_DESC"),
    Value = Ctl.ESPState.Skeleton,
    Callback = function(v) Ctl.ESPState.Skeleton = v end
})
bindLang(function()
    pcall(function() Ctl.espSkeletonToggle:SetTitle(T("ESP_SKELETON")) end)
    pcall(function() Ctl.espSkeletonToggle:SetDesc(T("ESP_SKELETON_DESC")) end)
end)

Ctl.espBox3dToggle = safeCreate(Ctl.espSectionExt, "Toggle", {
    Title = T("ESP_BOX3D"),
    Desc = T("ESP_BOX3D_DESC"),
    Value = Ctl.ESPState.Box3D,
    Callback = function(v) Ctl.ESPState.Box3D = v end
})
bindLang(function()
    pcall(function() Ctl.espBox3dToggle:SetTitle(T("ESP_BOX3D")) end)
    pcall(function() Ctl.espBox3dToggle:SetDesc(T("ESP_BOX3D_DESC")) end)
end)

Ctl.espHighlightToggle = safeCreate(Ctl.espSectionExt, "Toggle", {
    Title = T("ESP_HIGHLIGHT"),
    Desc = T("ESP_HIGHLIGHT_DESC"),
    Value = Ctl.ESPState.Highlight,
    Callback = function(v) Ctl.ESPState.Highlight = v end
})
bindLang(function()
    pcall(function() Ctl.espHighlightToggle:SetTitle(T("ESP_HIGHLIGHT")) end)
    pcall(function() Ctl.espHighlightToggle:SetDesc(T("ESP_HIGHLIGHT_DESC")) end)
end)

Ctl.espHeadDotToggle = safeCreate(Ctl.espSectionExt, "Toggle", {
    Title = T("ESP_HEADDOT"),
    Value = Ctl.ESPState.HeadDot,
    Callback = function(v) Ctl.ESPState.HeadDot = v end
})
bindLang(function() pcall(function() Ctl.espHeadDotToggle:SetTitle(T("ESP_HEADDOT")) end) end)

Ctl.espViewLineToggle = safeCreate(Ctl.espSectionExt, "Toggle", {
    Title = T("ESP_VIEWLINE"),
    Desc = T("ESP_VIEWLINE_DESC"),
    Value = Ctl.ESPState.ViewLine,
    Callback = function(v) Ctl.ESPState.ViewLine = v end
})
bindLang(function()
    pcall(function() Ctl.espViewLineToggle:SetTitle(T("ESP_VIEWLINE")) end)
    pcall(function() Ctl.espViewLineToggle:SetDesc(T("ESP_VIEWLINE_DESC")) end)
end)

Ctl.espArrowToggle = safeCreate(Ctl.espSectionExt, "Toggle", {
    Title = T("ESP_OFFSCREEN"),
    Desc = T("ESP_OFFSCREEN_DESC"),
    Value = Ctl.ESPState.OffScreenArrow,
    Callback = function(v) Ctl.ESPState.OffScreenArrow = v end
})
bindLang(function()
    pcall(function() Ctl.espArrowToggle:SetTitle(T("ESP_OFFSCREEN")) end)
    pcall(function() Ctl.espArrowToggle:SetDesc(T("ESP_OFFSCREEN_DESC")) end)
end)

-- 信息显示
Ctl.espSectionInfo = safeCreate(TabHandles.ESPPlus, "Section", { Title = T("ESP_INFO"), Icon = "info" })
bindLang(function() setTitleSafe(Ctl.espSectionInfo, T("ESP_INFO")) end)

Ctl.espWeaponToggle = safeCreate(Ctl.espSectionInfo, "Toggle", {
    Title = T("ESP_WEAPON"),
    Value = Ctl.ESPState.ShowWeapon,
    Callback = function(v) Ctl.ESPState.ShowWeapon = v end
})
bindLang(function() pcall(function() Ctl.espWeaponToggle:SetTitle(T("ESP_WEAPON")) end) end)

Ctl.espTeamInfoToggle = safeCreate(Ctl.espSectionInfo, "Toggle", {
    Title = T("ESP_TEAM"),
    Value = Ctl.ESPState.ShowTeam,
    Callback = function(v) Ctl.ESPState.ShowTeam = v end
})
bindLang(function() pcall(function() Ctl.espTeamInfoToggle:SetTitle(T("ESP_TEAM")) end) end)

Ctl.espHpNumToggle = safeCreate(Ctl.espSectionInfo, "Toggle", {
    Title = T("ESP_HEALTHNUM"),
    Value = Ctl.ESPState.HealthNumber,
    Callback = function(v) Ctl.ESPState.HealthNumber = v end
})
bindLang(function() pcall(function() Ctl.espHpNumToggle:SetTitle(T("ESP_HEALTHNUM")) end) end)

Ctl.espTargetHlToggle = safeCreate(Ctl.espSectionInfo, "Toggle", {
    Title = T("ESP_TARGETHL"),
    Desc = T("ESP_TARGETHL_DESC"),
    Value = Ctl.ESPState.TargetHighlight,
    Callback = function(v) Ctl.ESPState.TargetHighlight = v end
})
bindLang(function()
    pcall(function() Ctl.espTargetHlToggle:SetTitle(T("ESP_TARGETHL")) end)
    pcall(function() Ctl.espTargetHlToggle:SetDesc(T("ESP_TARGETHL_DESC")) end)
end)

Ctl.espTargetColor = safeCreate(Ctl.espSectionInfo, "Colorpicker", {
    Title = T("ESP_TARGETHL"),
    Default = Ctl.ESPState.TargetColor,
    Callback = function(c) Ctl.ESPState.TargetColor = c end
})

-- 雷达分区
Ctl.espSectionRadar = safeCreate(TabHandles.ESPPlus, "Section", { Title = T("ESP_RADAR_SEC"), Icon = "crosshair" })
bindLang(function() setTitleSafe(Ctl.espSectionRadar, T("ESP_RADAR_SEC")) end)

Ctl.espRadarToggle = safeCreate(Ctl.espSectionRadar, "Toggle", {
    Title = T("ESP_RADAR"),
    Desc = T("ESP_RADAR_DESC"),
    Value = Ctl.ESPState.Radar,
    Callback = function(v) Ctl.ESPState.Radar = v end
})
bindLang(function()
    pcall(function() Ctl.espRadarToggle:SetTitle(T("ESP_RADAR")) end)
    pcall(function() Ctl.espRadarToggle:SetDesc(T("ESP_RADAR_DESC")) end)
end)

Ctl.espRadarSize = safeCreate(Ctl.espSectionRadar, "Slider", {
    Title = T("RADAR_SIZE"),
    Value = { Min = 80, Max = 300, Default = Ctl.ESPState.RadarSize },
    Step = 10,
    Callback = function(v) Ctl.ESPState.RadarSize = tonumber(v) or 150 end
})
bindLang(function() pcall(function() Ctl.espRadarSize:SetTitle(T("RADAR_SIZE")) end) end)

Ctl.espRadarRange = safeCreate(Ctl.espSectionRadar, "Slider", {
    Title = T("RADAR_RANGE"),
    Desc = T("RADAR_RANGE_DESC"),
    Value = { Min = 50, Max = 1000, Default = Ctl.ESPState.RadarRange },
    Step = 50,
    Callback = function(v) Ctl.ESPState.RadarRange = tonumber(v) or 150 end
})
bindLang(function()
    pcall(function() Ctl.espRadarRange:SetTitle(T("RADAR_RANGE")) end)
    pcall(function() Ctl.espRadarRange:SetDesc(T("RADAR_RANGE_DESC")) end)
end)

Ctl.espRadarPos = safeCreate(Ctl.espSectionRadar, "Dropdown", {
    Title = T("RADAR_POS"),
    Values = { "右下", "右上", "左下", "左上" },
    Value = Ctl.ESPState.RadarPos,
    Callback = function(v) Ctl.ESPState.RadarPos = v end
})
bindLang(function() pcall(function() Ctl.espRadarPos:SetTitle(T("RADAR_POS")) end) end)

Ctl.espSectionUnit = safeCreate(TabHandles.ESP, "Section", { Title = T("ESP_UNIT"), Icon = "type" })
bindLang(function() setTitleSafe(Ctl.espSectionUnit, T("ESP_UNIT")) end)

Ctl.espUnitDropdown = safeCreate(Ctl.espSectionUnit, "Dropdown", {
    Title = T("ESP_UNIT"),
    Desc = T("ESP_UNIT_DESC"),
    Values = { T("UNIT_STUD"), T("UNIT_M"), T("UNIT_KM") },
    Value = T(Ctl.ESPState.DistanceUnit),
    Callback = function(v)
        for _, key in ipairs({ "UNIT_STUD", "UNIT_M", "UNIT_KM" }) do
            if v == T(key) then Ctl.ESPState.DistanceUnit = key; break end
        end
    end
})
bindLang(function()
    pcall(function() Ctl.espUnitDropdown:SetTitle(T("ESP_UNIT")) end)
    pcall(function()
        Ctl.espUnitDropdown:Select(T(Ctl.ESPState.DistanceUnit))
    end)
end)

Ctl.espUnitScale = safeCreate(Ctl.espSectionUnit, "Slider", {
    Title = T("UNIT_SCALE"),
    Desc = T("UNIT_SCALE_DESC"),
    Value = { Min = 5, Max = 100, Default = math.floor((Ctl.ESPState.UnitScale or 0.28) * 100 + 0.5) },
    Step = 1,
    Callback = function(v) Ctl.ESPState.UnitScale = (tonumber(v) or 28) / 100 end
})
bindLang(function() pcall(function() Ctl.espUnitScale:SetTitle(T("UNIT_SCALE")) end) end)

Ctl.espSectionName = safeCreate(TabHandles.ESP, "Section", { Title = T("ESP_NAMESEC"), Icon = "type" })
Ctl.espNameMode = safeCreate(Ctl.espSectionName, "Dropdown", {
    Title = T("ESP_NAMESRC"),
    Desc = T("ESP_NAMESRC_DESC"),
    Values = { "用户名", "显示名", "两者" },
    Value = Ctl.ESPState.NameMode,
    Callback = function(v) Ctl.ESPState.NameMode = v end
})
Ctl.espFontDropdown = safeCreate(Ctl.espSectionName, "Dropdown", {
    Title = T("ESP_FONT"),
    Desc = T("ESP_FONT_DESC"),
    Values = { "UI", "Roblox", "System", "Code", "Plex", "Monospace" },
    Value = Ctl.ESPState.FontName,
    Callback = function(v)
        Ctl.ESPState.FontName = v
        for _, o in pairs(ESPDrawings) do applyFont(o.Name); applyFont(o.Dist) end
    end
})
Ctl.espAsciiToggle = safeCreate(Ctl.espSectionName, "Toggle", {
    Title = T("ESP_ASCII"),
    Desc = T("ESP_ASCII_DESC"),
    Value = Ctl.ESPState.AsciiFallback,
    Callback = function(v) Ctl.ESPState.AsciiFallback = v end
})

Ctl.espSectionFilter = safeCreate(TabHandles.ESP, "Section", { Title = T("ESP_FILTER"), Icon = "filter" })
Ctl.espTeamToggle = safeCreate(Ctl.espSectionFilter, "Toggle", { Title = T("ESP_TEAM"), Desc = T("ESP_TEAM_DESC"), Value = Ctl.ESPState.TeamCheck, Callback = function(s) Ctl.ESPState.TeamCheck = s end })
Ctl.espLosToggle = safeCreate(Ctl.espSectionFilter, "Toggle", { Title = T("ESP_LOS"), Desc = T("ESP_LOS_DESC"), Value = Ctl.ESPState.VisibleCheck, Callback = function(s) Ctl.ESPState.VisibleCheck = s end })

Ctl.espDistSlider = safeCreate(Ctl.espSectionFilter, "Slider", {
    Title = T("ESP_MAXDIST"),
    Desc = T("ESP_MAXDIST_DESC"),
    Value = { Min = 50, Max = 3000, Default = Ctl.ESPState.MaxDistance },
    Step = 50,
    Callback = function(v) Ctl.ESPState.MaxDistance = tonumber(v) or Ctl.ESPState.MaxDistance end
})
Ctl.espThickSlider = safeCreate(Ctl.espSectionFilter, "Slider", {
    Title = T("ESP_THICK"),
    Value = { Min = 1, Max = 5, Default = Ctl.ESPState.Thickness },
    Step = 1,
    Callback = function(v) Ctl.ESPState.Thickness = tonumber(v) or 1 end
})
Ctl.espTextSlider = safeCreate(Ctl.espSectionFilter, "Slider", {
    Title = T("ESP_TEXTSIZE"),
    Value = { Min = 10, Max = 24, Default = Ctl.ESPState.TextSize },
    Step = 1,
    Callback = function(v) Ctl.ESPState.TextSize = tonumber(v) or 14 end
})
bindLang(function() setTitleSafe(TabHandles.Profile, T("PROFILE_TAB")) end)
bindLang(function() setTitleSafe(TabHandles.ESP, T("ESP_TAB")) end)
bindLang(function() setTitleSafe(TabHandles.Aimbot, T("AIM_TAB")) end)
bindLang(function() setTitleSafe(TabHandles.Language, T("LANG_TAB")) end)
bindLang(function() setTitleSafe(TabHandles.Bullet, T("BULLET_TAB")) end)
bindLang(function() setTitleSafe(TabHandles.Fly, T("FLY_TAB")) end)
pcall(function()
    TabHandles.ESPPlus:SetTitle("ESP 扩展")
end)
bindLang(function()
    pcall(function() ThemeToggle:SetTitle(T("DARKMODE")) end)
    pcall(function() ThemeToggle:SetDesc(T("DARKMODE_DESC")) end)
    pcall(function() themeDropdown:SetTitle(T("THEME_SELECT")) end)
end)

-- ========================= 自瞄模块 =========================
local UserInputService = game:GetService("UserInputService")
Camera = workspace.CurrentCamera or Camera

Ctl.AimState = {
    Enabled = false,
    Mode = "CFrame",
    HoldMode = true,
    Part = "头部",
    TeamCheck = true,
    VisibleCheck = true,
    MaxDistance = 300,
    FOV = 150,
    ShowFOV = true,
    Smoothness = 0.35,
    Trigger = "常开",
    CamMode = "直接写",
}

-- TriggerBot 状态
local TBState = {
    Enabled = false,
    Method = "自动",
    Delay = 0,            -- 瞄准后延迟 ms
    Cooldown = 100,       -- 两次开火最小间隔 ms
    Burst = false,        -- 连发
    OnlyVisible = true,
    UseBulletTarget = true,
    UseRemote = false,
    lastFire = 0,
}

local AimbotFOVCircle = nil
local aimbotSupported = true
local holdingTrigger = false

pcall(function()
    AimbotFOVCircle = Drawing.new("Circle")
    AimbotFOVCircle.Filled = false
    AimbotFOVCircle.Thickness = 1
    AimbotFOVCircle.NumSides = 64
    AimbotFOVCircle.Transparency = 0.8
    AimbotFOVCircle.Visible = false
end)
if not AimbotFOVCircle then aimbotSupported = false end

-- 目标部位
local function getAimPart(char)
    if not char then return nil end
    if Ctl.AimState.Part == "头部" then
        return char:FindFirstChild("Head")
    end
    return char:FindFirstChild("HumanoidRootPart") or char:FindFirstChild("Head")
end

-- 找 FOV 内、离准星最近的目标
local function findAimTarget()
    local center = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
    local best, bestDist = nil, math.huge

    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer and isEnemy(plr) then
            local char = plr.Character
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            local part = getAimPart(char)
            if part and hum and hum.Health > 0 then
                local dist3d = (part.Position - Camera.CFrame.Position).Magnitude
                if dist3d <= Ctl.AimState.MaxDistance then
                    local sp, onScreen = Camera:WorldToViewportPoint(part.Position)
                    if onScreen then
                        local sd = (Vector2.new(sp.X, sp.Y) - center).Magnitude
                        if sd <= Ctl.AimState.FOV and sd < bestDist then
                            if (not Ctl.AimState.VisibleCheck) or hasLineOfSight(part) then
                                best, bestDist = part, sd
                            end
                        end
                    end
                end
            end
        end
    end
    return best
end

-- 触发键判定
local function triggerActive()
    if Ctl.AimState.Trigger == "常开" then return true end
    return holdingTrigger
end

UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end
    local want = (Ctl.AimState.Trigger == "左键" and input.UserInputType == Enum.UserInputType.MouseButton1)
        or (Ctl.AimState.Trigger == "右键" and input.UserInputType == Enum.UserInputType.MouseButton2)
    if want then holdingTrigger = true end
end)
UserInputService.InputEnded:Connect(function(input)
    local want = (Ctl.AimState.Trigger == "左键" and input.UserInputType == Enum.UserInputType.MouseButton1)
        or (Ctl.AimState.Trigger == "右键" and input.UserInputType == Enum.UserInputType.MouseButton2)
    if want then holdingTrigger = false end
end)

RunService.RenderStepped:Connect(function()
    if AimbotFOVCircle then
        AimbotFOVCircle.Visible = Ctl.AimState.Enabled and Ctl.AimState.ShowFOV
        AimbotFOVCircle.Radius = Ctl.AimState.FOV
        AimbotFOVCircle.Position = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
        AimbotFOVCircle.Color = Ctl.AimState.Color
    end
    if (not Ctl.AimState.Enabled) or (not triggerActive()) then return end

    local target = findAimTarget()
    if not target then return end

    if Ctl.AimState.Mode == "Mouse" then
        local sp = Camera:WorldToViewportPoint(target.Position)
        local center = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
        local dx = (sp.X - center.X) * Ctl.AimState.Smoothness
        local dy = (sp.Y - center.Y) * Ctl.AimState.Smoothness
        pcall(function() mousemoverel(dx, dy) end)
    else
        local cf = CFrame.new(Camera.CFrame.Position, target.Position)
        local goal = Camera.CFrame:Lerp(cf, math.clamp(Ctl.AimState.Smoothness, 0.01, 1))
        if Ctl.AimState.CamMode == "Hook 拦截" and CamHookInstalled then
            CamDesiredCFrame = goal
            pcall(function() Camera.CFrame = goal end)
        else
            Camera.CFrame = goal
        end
    end
end)

-- 自瞄界面
safeCreate(TabHandles.Aimbot, "Paragraph", {
    Title = T("AIM_TITLE"),
    Desc = T("AIM_DESC"),
    Image = "crosshair",
    ImageSize = 20,
    Color = Color3.fromHex("#ff4d4d"),
})
safeCreate(TabHandles.Aimbot, "Divider", {})

local aimToggle = safeCreate(TabHandles.Aimbot, "Toggle", {
    Title = T("AIM_ENABLE"),
    Desc = T("AIM_ENABLE_DESC"),
    Value = false,
    Callback = function(state)
        Ctl.AimState.Enabled = state
    end
})

Ctl.aimSectionBasic = safeCreate(TabHandles.Aimbot, "Section", { Title = T("AIM_BASIC"), Icon = "target" })
local aimModeDropdown = safeCreate(Ctl.aimSectionBasic, "Dropdown", {
    Title = T("AIM_MODE"),
    Desc = T("AIM_MODE_DESC"),
    Values = { "CFrame", "Mouse" },
    Value = Ctl.AimState.Mode,
    Callback = function(v) Ctl.AimState.Mode = v end
})
local aimTriggerDropdown = safeCreate(Ctl.aimSectionBasic, "Dropdown", {
    Title = T("AIM_TRIGGER"),
    Values = { "右键", "左键", "常开" },
    Value = "常开",
    Callback = function(v) Ctl.AimState.Trigger = v; holdingTrigger = false end
})
local aimPartDropdown = safeCreate(Ctl.aimSectionBasic, "Dropdown", {
    Title = T("AIM_PART"),
    Values = { "头部", "躯干" },
    Value = Ctl.AimState.Part,
    Callback = function(v) Ctl.AimState.Part = v end
})
local aimSmoothSlider = safeCreate(Ctl.aimSectionBasic, "Slider", {
    Title = T("AIM_SMOOTH"),
    Desc = T("AIM_SMOOTH_DESC"),
    Value = { Min = 0.05, Max = 1, Default = Ctl.AimState.Smoothness },
    Step = 0.05,
    Callback = function(v) Ctl.AimState.Smoothness = tonumber(v) or 0.35 end
})

Ctl.aimSectionCam = safeCreate(TabHandles.Aimbot, "Section", { Title = T("CAM_SEC"), Icon = "video" })
bindLang(function() setTitleSafe(Ctl.aimSectionCam, T("CAM_SEC")) end)

safeCreate(Ctl.aimSectionCam, "Button", {
    Title = T("CAM_CHECK"),
    Desc = T("CAM_CHECK_DESC"),
    Icon = "search",
    Callback = function()
        local ok, ctype = testCameraWritable()
        local msg
        if ok then
            msg = T("CAM_WRITABLE")
        else
            msg = T("CAM_LOCKED")
        end
        msg = msg .. "\n" .. T("CAM_TYPE") .. ": " .. tostring(ctype)
        pcall(function()
            msg = msg .. "\n" .. T("CAM_SUBJECT") .. ": " .. tostring(workspace.CurrentCamera.CameraSubject)
        end)
        Window:Dialog({
            Title = T("CAM_RESULT"),
            Content = msg,
            Buttons = { { Title = T("OK"), Variant = "Primary" } }
        })
    end
})

local aimCamMode = safeCreate(Ctl.aimSectionCam, "Dropdown", {
    Title = T("CAM_MODE"),
    Desc = T("CAM_MODE_DESC"),
    Values = { "直接写", "Hook 拦截" },
    Value = Ctl.AimState.CamMode,
    Callback = function(v)
        Ctl.AimState.CamMode = v
        if v == "Hook 拦截" then
            local ok = installCameraHook()
            WindUI:Notify({
                Title = T("CAM_SEC"),
                Content = ok and T("CAM_HOOK_OK") or T("CAM_HOOK_FAIL"),
                Icon = ok and "check" or "x",
                Duration = 3
            })
        end
    end
})
bindLang(function() pcall(function() aimCamMode:SetTitle(T("CAM_MODE")) end) end)

Ctl.aimSectionFilter = safeCreate(TabHandles.Aimbot, "Section", { Title = T("AIM_FILTER"), Icon = "filter" })
local aimFovSlider = safeCreate(Ctl.aimSectionFilter, "Slider", {
    Title = T("AIM_FOV"),
    Desc = T("AIM_FOV_DESC"),
    Value = { Min = 30, Max = 500, Default = Ctl.AimState.FOV },
    Step = 10,
    Callback = function(v) Ctl.AimState.FOV = tonumber(v) or 150 end
})
local aimDistSlider = safeCreate(Ctl.aimSectionFilter, "Slider", {
    Title = T("AIM_MAXDIST"),
    Value = { Min = 50, Max = 2000, Default = Ctl.AimState.MaxDistance },
    Step = 50,
    Callback = function(v) Ctl.AimState.MaxDistance = tonumber(v) or 300 end
})
local aimTeamToggle = safeCreate(Ctl.aimSectionFilter, "Toggle", {
    Title = T("AIM_TEAM"),
    Value = Ctl.AimState.TeamCheck,
    Callback = function(v) Ctl.AimState.TeamCheck = v end
})
local aimVisibleToggle = safeCreate(Ctl.aimSectionFilter, "Toggle", {
    Title = T("AIM_VIS"),
    Desc = T("AIM_VIS_DESC"),
    Value = Ctl.AimState.VisibleCheck,
    Callback = function(v) Ctl.AimState.VisibleCheck = v end
})
local aimShowFovToggle = safeCreate(Ctl.aimSectionFilter, "Toggle", {
    Title = T("AIM_SHOWFOV"),
    Value = Ctl.AimState.ShowFOV,
    Callback = function(v) Ctl.AimState.ShowFOV = v end
})
local aimColor = safeCreate(Ctl.aimSectionFilter, "Colorpicker", {
    Title = T("AIM_FOVCOLOR"),
    Default = Ctl.AimState.Color,
    Callback = function(c) Ctl.AimState.Color = c end
})

-- TriggerBot
Ctl.tbSection = safeCreate(TabHandles.Aimbot, "Section", { Title = T("TB_SEC"), Icon = "zap" })
bindLang(function() setTitleSafe(Ctl.tbSection, T("TB_SEC")) end)

local tbToggle = safeCreate(Ctl.tbSection, "Toggle", {
    Title = T("TB_ENABLE"),
    Desc = T("TB_ENABLE_DESC"),
    Value = TBState.Enabled,
    Callback = function(v)
        local hasWay = (TBState.UseRemote and FireRemote ~= nil) or (FireFn ~= nil)
        if v and not hasWay then
            WindUI:Notify({ Title = T("TB_SEC"), Content = T("TB_NOMETHOD"), Icon = "x", Duration = 4 })
            pcall(function() tbToggle:Set(false) end)
            return
        end
        TBState.Enabled = v
    end
})
bindLang(function()
    pcall(function() tbToggle:SetTitle(T("TB_ENABLE")) end)
    pcall(function() tbToggle:SetDesc(T("TB_ENABLE_DESC")) end)
end)

local FireRemote = nil   -- 手动指定的开火 Remote

local tbMethod = safeCreate(Ctl.tbSection, "Dropdown", {
    Title = T("TB_METHOD"),
    Desc = T("TB_METHOD_DESC"),
    Values = { "自动", "Remote 调用", "mouse1press", "mouse1click", "VirtualInputManager" },
    Value = TBState.Method,
    Callback = function(v)
        TBState.Method = v
        if v == "Remote 调用" then return end
        if v == "自动" then
            pcall(function()
                local candidates = { "mouse1press", "mouse1click", "VirtualInputManager",
                                     "mouse1down", "mousepress", "click" }
                FireFn = nil; FireFnName = nil
                for _, c in ipairs(candidates) do
                    local fn = resolveFireMethod(c)
                    if fn then FireFn = fn; FireFnName = c; break end
                end
            end)
        else
            pcall(function()
                FireFn = resolveFireMethod(v)
                FireFnName = v
            end)
        end
    end
})
bindLang(function() pcall(function() tbMethod:SetTitle(T("TB_METHOD")) end) end)

-- 开火 Remote 列表（从捕获到的 Remote 里选）
local function refreshFireRemoteList()
    local names = {}
    for name in pairs(RemoteLog) do table.insert(names, name) end
    table.sort(names)
    if #names == 0 then table.insert(names, "（暂无）") end
    if Ctl.fireRemoteDropdown and Ctl.fireRemoteDropdown.Refresh then
        pcall(function() Ctl.fireRemoteDropdown:Refresh(names) end)
    end
    return names
end

fireRemoteDropdown = safeCreate(Ctl.tbSection, "Dropdown", {
    Title = "开火 Remote",
    Desc = "先开子追的 Remote 模式开几枪捕获，再在这里选",
    Values = refreshFireRemoteList(),
    Value = "（暂无）",
    Callback = function(v)
        local e = RemoteLog[v]
        if e and e.remote then FireRemote = e.remote end
    end
})

Ctl.tbRemoteFire = safeCreate(Ctl.tbSection, "Toggle", {
    Title = "用 Remote 开火",
    Desc = "直接调用选中的开火 Remote，绕过模拟输入",
    Value = false,
    Callback = function(v)
        TBState.UseRemote = v
        if v and not FireRemote then
            WindUI:Notify({ Title = "开火 Remote", Content = "请先在上方选择一个 Remote", Icon = "x", Duration = 3 })
            pcall(function() Ctl.tbRemoteFire:Set(false) end)
        end
    end
})

safeCreate(Ctl.tbSection, "Button", {
    Title = "测试 Remote 开火",
    Icon = "play",
    Callback = function()
        if not FireRemote then
            WindUI:Notify({ Title = "开火 Remote", Content = "未选择 Remote", Icon = "x", Duration = 3 })
            return
        end
        local ok, err = pcall(function() FireRemote:FireServer() end)
        WindUI:Notify({
            Title = "Remote 开火",
            Content = ok and "已调用，看游戏有没有开枪" or ("调用失败: " .. tostring(err)),
            Icon = ok and "check" or "x",
            Duration = 3
        })
    end
})

Ctl.tbDelay = safeCreate(Ctl.tbSection, "Slider", {
    Title = T("TB_DELAY"),
    Desc = T("TB_DELAY_DESC"),
    Value = { Min = 0, Max = 500, Default = TBState.Delay },
    Step = 10,
    Callback = function(v) TBState.Delay = tonumber(v) or 0 end
})
bindLang(function() pcall(function() Ctl.tbDelay:SetTitle(T("TB_DELAY")) end) end)

Ctl.tbCooldown = safeCreate(Ctl.tbSection, "Slider", {
    Title = T("TB_COOLDOWN"),
    Desc = T("TB_COOLDOWN_DESC"),
    Value = { Min = 50, Max = 1000, Default = TBState.Cooldown },
    Step = 50,
    Callback = function(v) TBState.Cooldown = tonumber(v) or 100 end
})
bindLang(function() pcall(function() Ctl.tbCooldown:SetTitle(T("TB_COOLDOWN")) end) end)

Ctl.tbBurst = safeCreate(Ctl.tbSection, "Toggle", {
    Title = T("TB_BURST"),
    Desc = T("TB_BURST_DESC"),
    Value = TBState.Burst,
    Callback = function(v) TBState.Burst = v end
})
bindLang(function()
    pcall(function() Ctl.tbBurst:SetTitle(T("TB_BURST")) end)
    pcall(function() Ctl.tbBurst:SetDesc(T("TB_BURST_DESC")) end)
end)

Ctl.tbOnlyVis = safeCreate(Ctl.tbSection, "Toggle", {
    Title = T("TB_ONLYVIS"),
    Value = TBState.OnlyVisible,
    Callback = function(v) TBState.OnlyVisible = v end
})
bindLang(function() pcall(function() Ctl.tbOnlyVis:SetTitle(T("TB_ONLYVIS")) end) end)

Ctl.tbUseBullet = safeCreate(Ctl.tbSection, "Toggle", {
    Title = T("TB_HITCHK"),
    Desc = T("TB_HITCHK_DESC"),
    Value = TBState.UseBulletTarget,
    Callback = function(v) TBState.UseBulletTarget = v end
})
bindLang(function()
    pcall(function() Ctl.tbUseBullet:SetTitle(T("TB_HITCHK")) end)
    pcall(function() Ctl.tbUseBullet:SetDesc(T("TB_HITCHK_DESC")) end)
end)

safeCreate(Ctl.tbSection, "Button", {
    Title = T("TB_TEST"),
    Desc = T("TB_TEST_DESC"),
    Icon = "play",
    Callback = function()
        local hasWay = (TBState.UseRemote and FireRemote ~= nil) or (FireFn ~= nil)
        if not hasWay then
            WindUI:Notify({ Title = T("TB_SEC"), Content = T("TB_NOMETHOD"), Icon = "x", Duration = 4 })
            return
        end
        pcall(function() doFire(true) end)
        task.wait(0.05)
        pcall(function() doFire(false) end)
        WindUI:Notify({ Title = T("TB_SEC"), Content = T("TB_TESTED"), Icon = "check", Duration = 3 })
    end
})

safeCreate(TabHandles.Aimbot, "Button", {
    Title = T("AIM_RESET"),
    Icon = "refresh-cw",
    Callback = function()
        Ctl.AimState.Mode = "CFrame"; Ctl.AimState.Trigger = "常开"; Ctl.AimState.Part = "头部"
        Ctl.AimState.Smoothness = 0.35; Ctl.AimState.FOV = 150; Ctl.AimState.MaxDistance = 300
        Ctl.AimState.TeamCheck = true; Ctl.AimState.VisibleCheck = true; Ctl.AimState.ShowFOV = true
        Ctl.AimState.CamMode = "直接写"
        pcall(function() aimCamMode:Select("直接写") end)
        aimModeDropdown:Select("CFrame"); aimTriggerDropdown:Select("常开"); aimPartDropdown:Select("头部")
        aimSmoothSlider:Set(0.35); aimFovSlider:Set(150); aimDistSlider:Set(300)
        WindUI:Notify({ Title = T("AIM_TAB"), Content = T("AIM_RESET_MSG"), Icon = "check", Duration = 2 })
    end
})
-- ======================= 自瞄模块结束 =======================

-- ========================= 子弹追踪（子追）模块 =========================
Ctl.BulletState = {
    Enabled = false,          -- 总开关
    Mode = "射线重定向",       -- 射线重定向 / 命中点覆盖
    Part = "头部",             -- 头部 / 躯干
    HitChance = 100,          -- 命中率 %
    FOV = 200,                -- 追踪 FOV（像素）
    MaxDistance = 500,        -- 最远追踪距离
    TeamCheck = true,         -- 跳过队友
    VisibleCheck = true,      -- 只追可见目标
    FollowAimbot = true,      -- 优先使用自瞄锁定的目标
    Wallbang = false,         -- 穿墙追踪：射线忽略墙体
    Impl = "Hook",            -- 实现方式：Hook（拦截射线）/ Mouse（开火瞬间对准）
    FireKey = "左键",          -- Mouse 模式触发键：左键 / 右键
    ProjMinSpeed = 50,        -- 抛射物：最小弹速
    ProjRange = 25,           -- 抛射物：识别范围（判断是不是自己打的）
    RemoteKeyword = "",       -- Remote：名称关键词，留空=全部
    RemoteArgIndex = 1,       -- Remote：替换第几个参数
    RemoteArgType = "目标部位",  -- Remote：替换内容
}

-- Hitbox 扩大（独立于追踪方式，可叠加）
local HitboxState = {
    Enabled = false,
    Multiplier = 1.5,         -- 放大倍率
    Part = "躯干",             -- 躯干 / 头部
}
local HitboxOriginal = {}     -- [Part] = 原始 Size
local RemoteLog = {}          -- [RemoteName] = { count = n, remote = instance }

-- 底层 hook 能力检测
local HookEnv = {
    getrawmetatable = rawget(_G, "getrawmetatable") or rawget(getfenv(0), "getrawmetatable"),
    setreadonly = rawget(_G, "setreadonly") or rawget(getfenv(0), "setreadonly"),
    newcclosure = rawget(_G, "newcclosure") or rawget(getfenv(0), "newcclosure"),
    getnamecallmethod = rawget(_G, "getnamecallmethod") or rawget(getfenv(0), "getnamecallmethod"),
}
local hookReady = false
local hookInstalled = false

local function getBulletPart(char)
    if not char then return nil end
    if Ctl.BulletState.Part == "头部" then
        return char:FindFirstChild("Head")
    end
    return char:FindFirstChild("HumanoidRootPart") or char:FindFirstChild("Head")
end

-- 命中率判定
local function rollHitChance()
    if Ctl.BulletState.HitChance >= 100 then return true end
    if Ctl.BulletState.HitChance <= 0 then return false end
    return math.random(1, 100) <= Ctl.BulletState.HitChance
end

-- 找追踪目标
local function findBulletTarget()
    if Ctl.BulletState.FollowAimbot and Ctl.AimState and Ctl.AimState.Enabled then
        local ok, t = pcall(findAimTarget)
        if ok and t then return t end
    end
    local center = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
    local best, bestDist = nil, math.huge
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer then
            local skipTeam = Ctl.BulletState.TeamCheck and isEnemy(plr) == false
            if not skipTeam then
                local char = plr.Character
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                local part = getBulletPart(char)
                if part and hum and hum.Health > 0 then
                    local d3 = (part.Position - Camera.CFrame.Position).Magnitude
                    if d3 <= Ctl.BulletState.MaxDistance then
                        local sp, onScreen = Camera:WorldToViewportPoint(part.Position)
                        if onScreen then
                            local sd = (Vector2.new(sp.X, sp.Y) - center).Magnitude
                            if sd <= Ctl.BulletState.FOV and sd < bestDist then
                                local pass = Ctl.BulletState.Wallbang
                                    or (not Ctl.BulletState.VisibleCheck)
                                    or hasLineOfSight(part)
                                if pass then
                                    best, bestDist = part, sd
                                end
                            end
                        end
                    end
                end
            end
        end
    end
    return best
end

-- 抛射物重定向
local Projectiles = {}
local projConn = nil

local function trackProjectile(obj)
    if not obj:IsA("BasePart") then return end
    if #Projectiles > 300 then table.remove(Projectiles, 1) end
    table.insert(Projectiles, { p = obj, t = tick() })
end

pcall(function()
    projConn = workspace.DescendantAdded:Connect(trackProjectile)
end)
pcall(function()
    for _, d in ipairs(workspace:GetDescendants()) do
        if d:IsA("BasePart") and (d.Velocity.Magnitude >= 50) then trackProjectile(d) end
    end
end)

local function redirectProjectile(p, v)
    local t = findBulletTarget()
    if not t then return end
    local d = t.Position - p.Position
    if d.Magnitude <= 0 then return end
    local speed = v.Magnitude
    pcall(function()
        p.Velocity = d.Unit * speed
        p.CanCollide = false
    end)
    -- 同时改写物理驱动，避免被 BodyVelocity 拉回原方向
    pcall(function()
        for _, child in ipairs(p:GetChildren()) do
            if child:IsA("BodyVelocity") or child:IsA("LinearVelocity") or child:IsA("BodyForce") then
                if child:IsA("BodyVelocity") then
                    child.Velocity = d.Unit * speed
                elseif child:IsA("LinearVelocity") then
                    local ok2 = pcall(function() child.VectorVelocity = d.Unit * speed end)
                    if not ok2 then pcall(function() child.LineVelocity = speed end) end
                end
            end
        end
    end)
end

local function updateProjectiles()
    if not (Ctl.BulletState.Enabled and Ctl.BulletState.Mode == "抛射物重定向") then
        if #Projectiles > 0 then for i = #Projectiles, 1, -1 do Projectiles[i] = nil end end
        return
    end
    local myChar = LocalPlayer.Character
    local myHRP = myChar and myChar:FindFirstChild("HumanoidRootPart")
    if not myHRP then return end

    for i = #Projectiles, 1, -1 do
        local item = Projectiles[i]
        local p = item.p
        if not p or not p.Parent then
            table.remove(Projectiles, i)
        else
            if tick() - item.t > 6 then
                table.remove(Projectiles, i)
            else
                local v = p.Velocity
                if v.Magnitude >= Ctl.BulletState.ProjMinSpeed then
                    if (p.Position - myHRP.Position).Magnitude <= Ctl.BulletState.ProjRange then
                        if rollHitChance() then redirectProjectile(p, v) end
                    end
                end
            end
        end
    end
end

-- Hitbox 扩大
local function restoreAllHitbox()
    for part, orig in pairs(HitboxOriginal) do
        pcall(function()
            part.Size = orig
            part.CanCollide = true
            part.Massless = false
        end)
    end
    for k in pairs(HitboxOriginal) do HitboxOriginal[k] = nil end
end

local function updateHitbox()
    if not HitboxState.Enabled then
        if next(HitboxOriginal) then restoreAllHitbox() end
        return
    end
    local wanted = {}
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer and (not Ctl.BulletState.TeamCheck or isEnemy(plr)) then
            local char = plr.Character
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health > 0 then
                local part = (HitboxState.Part == "头部")
                    and char:FindFirstChild("Head")
                    or char:FindFirstChild("HumanoidRootPart")
                if part then
                    local d3 = (part.Position - Camera.CFrame.Position).Magnitude
                    if d3 <= Ctl.BulletState.MaxDistance then
                        local vis = Ctl.BulletState.Wallbang
                            or (not Ctl.BulletState.VisibleCheck)
                            or hasLineOfSight(part)
                        if vis then wanted[part] = true end
                    end
                end
            end
        end
    end

    -- 恢复不再需要的
    for part, orig in pairs(HitboxOriginal) do
        if not wanted[part] then
            pcall(function()
                part.Size = orig
                part.CanCollide = true
                part.Massless = false
            end)
            HitboxOriginal[part] = nil
        end
    end
    -- 放大需要的
    for part in pairs(wanted) do
        if not HitboxOriginal[part] then HitboxOriginal[part] = part.Size end
        pcall(function()
            part.Size = HitboxOriginal[part] * HitboxState.Multiplier
            part.CanCollide = false
            part.Massless = true
        end)
    end
end

RunService.RenderStepped:Connect(function()
    pcall(updateProjectiles)
    pcall(updateHitbox)
end)

-- Mouse 模式：开火瞬间把准星挪到目标身上（不依赖底层 hook）
local mousemoveFn = rawget(_G, "mousemoverel") or rawget(getfenv(0), "mousemoverel")
local mouseWarned = false

local function bulletMouseSnap()
    if not (Ctl.BulletState.Enabled and Ctl.BulletState.Impl == "Mouse") then return end
    if not rollHitChance() then return end
    local t = findBulletTarget()
    if not t then return end

    local sp, onScreen = Camera:WorldToViewportPoint(t.Position)
    if not onScreen then return end
    local center = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
    local dx = sp.X - center.X
    local dy = sp.Y - center.Y

    local moved = false
    if mousemoveFn then
        moved = pcall(mousemoveFn, dx, dy)
    end
    if not moved then
        -- 没有 mousemoverel 就改用视角瞬移
        pcall(function()
            Camera.CFrame = CFrame.new(Camera.CFrame.Position, t.Position)
        end)
        if not mouseWarned then
            mouseWarned = true
            WindUI:Notify({
                Title = T("BULLET_TITLE"),
                Content = T("BULLET_MOUSE_NOMOVEREL"),
                Icon = "info",
                Duration = 4
            })
        end
    end
end

UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end
    if not (Ctl.BulletState.Enabled and Ctl.BulletState.Impl == "Mouse") then return end
    local want = (Ctl.BulletState.FireKey == "左键" and input.UserInputType == Enum.UserInputType.MouseButton1)
        or (Ctl.BulletState.FireKey == "右键" and input.UserInputType == Enum.UserInputType.MouseButton2)
    if want then
        task.defer(bulletMouseSnap)
    end
end)


-- ========================= 相机诊断与强制写入 =========================
local CamHookInstalled = false
local CamDesiredCFrame = nil   -- Hook 模式下，游戏写完我们再覆盖

-- 检测相机是否可写
local function testCameraWritable()
    local cam = workspace.CurrentCamera
    if not cam then return false, "no camera" end
    local before = cam.CFrame
    local ok = pcall(function()
        cam.CFrame = before * CFrame.Angles(0, math.rad(5), 0)
    end)
    if not ok then return false, "write error" end
    -- 等一帧看是否被覆盖
    RunService.RenderStepped:Wait()
    local after = cam.CFrame
    local moved = (after.Position - before.Position).Magnitude > 0.01
        or math.abs((after.LookVector - before.LookVector).Magnitude) > 0.001
    -- 还原
    pcall(function() cam.CFrame = before end)
    return moved, tostring(cam.CameraType)
end

-- 安装相机 Hook：拦截游戏对 Camera.CFrame 的写入，改成我们的目标
local function installCameraHook()
    if CamHookInstalled then return true end
    local ok = pcall(function()
        local mt = HookEnv.getrawmetatable(workspace.CurrentCamera)
        if not mt then error("no mt") end
        local oldNewIndex = mt.__newindex
        HookEnv.setreadonly(mt, false)
        mt.__newindex = HookEnv.newcclosure(function(t, k, v)
            if k == "CFrame" and type(t) == "userdata" and Ctl.AimState.Enabled
                and Ctl.AimState.CamMode == "Hook 拦截" and CamDesiredCFrame then
                return oldNewIndex(t, k, CamDesiredCFrame)
            end
            return oldNewIndex(t, k, v)
        end)
        pcall(function() HookEnv.setreadonly(mt, true) end)
    end)
    CamHookInstalled = ok
    return ok
end

-- ========================= TriggerBot 自动开火 =========================
local FireFn = nil
local FireFnName = nil

-- 广谱查找：_G / getgenv / getfenv / 环境表
local function lookupGlobal(name)
    local places = {}
    pcall(function() places[#places + 1] = _G end)
    pcall(function() if getgenv then places[#places + 1] = getgenv() end end)
    pcall(function() places[#places + 1] = getfenv(0) end)
    pcall(function() places[#places + 1] = getfenv(1) end)
    for _, t in ipairs(places) do
        if type(t) == "table" then
            local v = rawget(t, name)
            if v ~= nil then return v end
        end
    end
    return nil
end

local function resolveFireMethod(name)
    if name == "VirtualInputManager" then
        local ok, svc = pcall(function() return game:GetService("VirtualInputManager") end)
        return (ok and svc) or nil
    end
    return lookupGlobal(name)
end

pcall(function()
    local candidates = { "mouse1press", "mouse1click", "VirtualInputManager",
                         "mouse1down", "mousepress", "click" }
    for _, c in ipairs(candidates) do
        local fn = resolveFireMethod(c)
        if fn then FireFn = fn; FireFnName = c; break end
    end
end)

local function doFire(press)
    -- Remote 开火优先
    if TBState.UseRemote and FireRemote then
        return pcall(function() FireRemote:FireServer() end)
    end
    if not FireFn then return false end
    local ok = false
    if FireFnName == "mouse1press" or FireFnName == "mouse1down" or FireFnName == "mousepress" then
        ok = pcall(FireFn, press ~= false)
    elseif FireFnName == "mouse1click" or FireFnName == "click" then
        if press ~= false then ok = pcall(FireFn) end
    elseif FireFnName == "VirtualInputManager" then
        ok = pcall(function()
            FireFn:SendMouseButtonEvent(0, 0, 0, press ~= false, game, 0)
        end)
    end
    return ok
end

-- 判断准星下是否是敌人
local function crosshairOnEnemy()
    if TBState.UseBulletTarget and Ctl.BulletState and Ctl.BulletState.Enabled and CurrentBulletTarget then
        return true
    end
    local cam = workspace.CurrentCamera
    local center = Vector2.new(cam.ViewportSize.X / 2, cam.ViewportSize.Y / 2)
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer and isEnemy(plr) then
            local char = plr.Character
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            local part = char and (char:FindFirstChild("Head") or char:FindFirstChild("HumanoidRootPart"))
            if part and hum and hum.Health > 0 then
                local d3 = (part.Position - cam.CFrame.Position).Magnitude
                if d3 <= Ctl.AimState.MaxDistance then
                    local sp, onScreen = cam:WorldToViewportPoint(part.Position)
                    if onScreen then
                        local sd = (Vector2.new(sp.X, sp.Y) - center).Magnitude
                        if sd <= Ctl.AimState.FOV then
                            if (not TBState.OnlyVisible) or hasLineOfSight(part) then
                                return true
                            end
                        end
                    end
                end
            end
        end
    end
    return false
end

RunService.RenderStepped:Connect(function()
    if not TBState.Enabled then return end
    if not crosshairOnEnemy() then return end
    local now = tick() * 1000
    if now - TBState.lastFire < TBState.Cooldown then return end
    TBState.lastFire = now
    if TBState.Delay > 0 then
        task.wait(TBState.Delay / 1000)
    end
    pcall(function() doFire(true) end)
    if not TBState.Burst then
        task.wait(0.03)
        pcall(function() doFire(false) end)
    end
end)

-- 安装 hook（只装一次，靠 Ctl.BulletState.Enabled 控制是否生效）
local function installBulletHook()
    if hookInstalled then return hookReady end
    if not (HookEnv.getrawmetatable and HookEnv.setreadonly and HookEnv.newcclosure) then
        hookReady = false
        return false
    end

    local ok = pcall(function()
        local mt = HookEnv.getrawmetatable(game)
        local oldNamecall = mt.__namecall
        local oldIndex = mt.__index
        HookEnv.setreadonly(mt, false)

        -- 射线类方法：把方向改到目标
        -- 构造「只命中目标角色」的 RaycastParams（穿墙用）
        local function makeTargetParams(target)
            local params = RaycastParams.new()
            params.FilterType = Enum.RaycastFilterType.Whitelist
            params.FilterDescendantsInstances = { target.Parent }
            params.IgnoreWater = true
            return params
        end

        mt.__namecall = HookEnv.newcclosure(function(self, ...)
            local method = ""
            pcall(function() method = HookEnv.getnamecallmethod() end)
            local args = { ... }

            if Ctl.BulletState.Enabled and Ctl.BulletState.Mode == "射线重定向" then
                local hit = rollHitChance()
                local t = findBulletTarget()
                if hit and t then
                    -- 统一计算指向目标的方向
                    local function toTargetRay(origin, minLen)
                        local d = t.Position - origin
                        if d.Magnitude <= 0 then return nil end
                        return d.Unit * math.max(d.Magnitude + 5, minLen or 0)
                    end

                    if method == "Raycast" then
                        if #args >= 2 and typeof(args[1]) == "Vector3" and typeof(args[2]) == "Vector3" then
                            local r = toTargetRay(args[1], args[2].Magnitude)
                            if r then
                                args[2] = r
                                if Ctl.BulletState.Wallbang then
                                    args[3] = makeTargetParams(t)
                                end
                            end
                        end
                    elseif method == "FindPartOnRay" or method == "FindPartOnRayWithIgnoreList" then
                        if #args >= 1 and typeof(args[1]) == "Ray" then
                            local r = toTargetRay(args[1].Origin, args[1].Direction.Magnitude)
                            if r then args[1] = Ray.new(args[1].Origin, r) end
                        end
                        -- 穿墙：改用白名单版本，只命中目标角色
                        if Ctl.BulletState.Wallbang and #args >= 1 and typeof(args[1]) == "Ray" then
                            local ok2, res2 = pcall(function()
                                return self.FindPartOnRayWithWhitelist(self, args[1], { t.Parent })
                            end)
                            if ok2 then return res2 end
                        end
                    elseif method == "FindPartOnRayWithWhitelist" then
                        if #args >= 1 and typeof(args[1]) == "Ray" then
                            local r = toTargetRay(args[1].Origin, args[1].Direction.Magnitude)
                            if r then args[1] = Ray.new(args[1].Origin, r) end
                        end
                        if Ctl.BulletState.Wallbang then
                            args[2] = { t.Parent }
                        end
                    end
                end
            end

            -- Remote 包改写：拦截 FireServer 并替换参数
            if Ctl.BulletState.Enabled and Ctl.BulletState.Mode == "Remote 包改写" and method == "FireServer" then
                local rname = ""
                pcall(function() rname = tostring(self.Name) end)
                local kw = Ctl.BulletState.RemoteKeyword or ""
                local match = (kw == "") or (string.find(string.lower(rname), string.lower(kw), 1, true) ~= nil)
                if match then
                    local entry = RemoteLog[rname]
                    if not entry then
                        entry = { count = 0, remote = self }
                        RemoteLog[rname] = entry
                    end
                    entry.count = entry.count + 1
                    if rollHitChance() then
                        local t = findBulletTarget()
                        if t then
                            local typ = Ctl.BulletState.RemoteArgType
                            local val = nil
                            if typ == T("T_POSITION") or typ == "目标坐标" then
                                val = t.Position
                            elseif typ == T("T_PLAYER") or typ == "目标玩家" then
                                local ok3, plr = pcall(function()
                                    return Players:GetPlayerFromCharacter(t.Parent)
                                end)
                                if ok3 and plr then val = plr end
                            else
                                val = t
                            end
                            if val ~= nil then
                                local idx = math.clamp(tonumber(Ctl.BulletState.RemoteArgIndex) or 1, 1, 10)
                                args[idx] = val
                            end
                        end
                    end
                end
            end

            local res = oldNamecall(self, unpack(args))

            -- ScreenPointToRay / ViewportPointToRay 改返回值
            if Ctl.BulletState.Enabled and Ctl.BulletState.Mode == "射线重定向" and rollHitChance() then
                if method == "ScreenPointToRay" or method == "ViewportPointToRay" then
                    local t = findBulletTarget()
                    if t and typeof(res) == "Ray" then
                        local origin = res.Origin
                        local d = t.Position - origin
                        if d.Magnitude > 0 then
                            return Ray.new(origin, d.Unit * (d.Magnitude + 5))
                        end
                    end
                end
            end
            return res
        end)

        -- mouse.Hit / Target / UnitRay 覆盖
        mt.__index = HookEnv.newcclosure(function(t, k)
            if Ctl.BulletState.Enabled and Ctl.BulletState.Mode == "命中点覆盖" then
                local target = findBulletTarget()
                if target then
                    -- 穿墙时 mouse.Hit 直接给目标坐标，不看中间遮挡
                    if k == "Hit" then
                        return CFrame.new(target.Position)
                    elseif k == "Target" then
                        return target
                    elseif k == "UnitRay" then
                        local origin = Camera.CFrame.Position
                        local d = target.Position - origin
                        if d.Magnitude > 0 then
                            return Ray.new(origin, d.Unit * (d.Magnitude + 5))
                        end
                    end
                end
            end
            return oldIndex(t, k)
        end)

        pcall(function() HookEnv.setreadonly(mt, true) end)
    end)

    hookInstalled = true
    hookReady = ok
    return hookReady
end

-- 子追界面
safeCreate(TabHandles.Bullet, "Paragraph", {
    Title = T("BULLET_TITLE"),
    Desc = T("BULLET_HEAD_DESC"),
    Image = "target",
    ImageSize = 20,
    Color = Color3.fromHex("#ff9f43"),
})
safeCreate(TabHandles.Bullet, "Divider", {})

local bulletStatus = safeCreate(TabHandles.Bullet, "Paragraph", {
    Title = T("BULLET_STATUS"),
    Desc = T("BULLET_STATUS_DESC"),
    Image = "activity",
    ImageSize = 20,
    Color = "Grey",
})
bindLang(function() pcall(function() bulletStatus:SetTitle(T("BULLET_STATUS")) end) end)

local bulletToggle = safeCreate(TabHandles.Bullet, "Toggle", {
    Title = T("BULLET_ENABLE"),
    Desc = T("BULLET_ENABLE_DESC"),
    Value = false,
    Callback = function(state)
        -- 抛射物重定向不依赖底层 hook；其余 Hook 模式都需要
        local needHook = (Ctl.BulletState.Impl ~= "Mouse") and (Ctl.BulletState.Mode ~= "抛射物重定向")
        if state and Ctl.BulletState.Impl == "Mouse" then
            Ctl.BulletState.Enabled = true
            pcall(function() bulletStatus:SetDesc(T("BULLET_MOUSE_READY")) end)
            return
        end
        if state and not needHook then
            Ctl.BulletState.Enabled = true
            pcall(function() bulletStatus:SetDesc(T("BULLET_PROJ_NOTE")) end)
            return
        end
        if state then
            local ok = installBulletHook()
            if not ok then
                WindUI:Notify({
                    Title = T("BULLET_NOTSUP_TITLE"),
                    Content = T("BULLET_NOTSUP_MSG"),
                    Icon = "x",
                    Duration = 4
                })
                Ctl.BulletState.Enabled = false
                pcall(function() bulletToggle:Set(false) end)
                pcall(function() bulletStatus:SetDesc(T("BULLET_NOTSUP_MSG")) end)
                return
            end
            WindUI:Notify({
                Title = T("BULLET_READY"),
                Content = T("BULLET_READY_MSG"),
                Icon = "check",
                Duration = 3
            })
            pcall(function() bulletStatus:SetDesc(T("BULLET_READY_MSG")) end)
        end
        Ctl.BulletState.Enabled = state
    end
})
bindLang(function()
    pcall(function() bulletToggle:SetTitle(T("BULLET_ENABLE")) end)
    pcall(function() bulletToggle:SetDesc(T("BULLET_ENABLE_DESC")) end)
end)

Ctl.bulletSectionBasic = safeCreate(TabHandles.Bullet, "Section", { Title = T("BULLET_BASIC"), Icon = "target" })
bindLang(function() setTitleSafe(Ctl.bulletSectionBasic, T("BULLET_BASIC")) end)

local bulletImpl = safeCreate(Ctl.bulletSectionBasic, "Dropdown", {
    Title = T("BULLET_IMPL"),
    Desc = T("BULLET_IMPL_DESC"),
    Values = { "Hook", "Mouse" },
    Value = Ctl.BulletState.Impl,
    Callback = function(v)
        Ctl.BulletState.Impl = v
        pcall(function()
            if v == "Mouse" then
                bulletStatus:SetDesc(T("BULLET_MOUSE_READY"))
            else
                bulletStatus:SetDesc(T("BULLET_STATUS_DESC"))
            end
        end)
    end
})
bindLang(function()
    pcall(function() bulletImpl:SetTitle(T("BULLET_IMPL")) end)
    pcall(function() bulletImpl:SetDesc(T("BULLET_IMPL_DESC")) end)
end)

local bulletFireKey = safeCreate(Ctl.bulletSectionBasic, "Dropdown", {
    Title = T("BULLET_FIREKEY"),
    Desc = T("BULLET_FIREKEY_DESC"),
    Values = { "左键", "右键" },
    Value = Ctl.BulletState.FireKey,
    Callback = function(v) Ctl.BulletState.FireKey = v end
})
bindLang(function()
    pcall(function() bulletFireKey:SetTitle(T("BULLET_FIREKEY")) end)
    pcall(function() bulletFireKey:SetDesc(T("BULLET_FIREKEY_DESC")) end)
end)

local bulletMethod = safeCreate(Ctl.bulletSectionBasic, "Dropdown", {
    Title = T("BULLET_METHOD"),
    Desc = T("BULLET_METHOD_DESC") .. "（" .. T("BULLET_HOOK_ONLY") .. "）",
    Values = { "射线重定向", "命中点覆盖", "抛射物重定向", "Remote 包改写" },
    Value = Ctl.BulletState.Mode,
    Callback = function(v)
        Ctl.BulletState.Mode = v
        pcall(function()
            if v == "抛射物重定向" then
                bulletStatus:SetDesc(T("BULLET_PROJ_NOTE"))
            elseif v == "Remote 包改写" then
                bulletStatus:SetDesc(T("BULLET_RM_NOTE"))
            else
                bulletStatus:SetDesc(T("BULLET_STATUS_DESC"))
            end
        end)
    end
})
bindLang(function() pcall(function() bulletMethod:SetTitle(T("BULLET_METHOD")) end) end)

local bulletPart = safeCreate(Ctl.bulletSectionBasic, "Dropdown", {
    Title = T("BULLET_PART"),
    Values = { "头部", "躯干" },
    Value = Ctl.BulletState.Part,
    Callback = function(v) Ctl.BulletState.Part = v end
})
bindLang(function() pcall(function() bulletPart:SetTitle(T("BULLET_PART")) end) end)

local bulletHitChance = safeCreate(Ctl.bulletSectionBasic, "Slider", {
    Title = T("BULLET_HITCHANCE"),
    Desc = T("BULLET_HITCHANCE_DESC"),
    Value = { Min = 0, Max = 100, Default = Ctl.BulletState.HitChance },
    Step = 5,
    Callback = function(v) Ctl.BulletState.HitChance = tonumber(v) or 100 end
})
bindLang(function() pcall(function() bulletHitChance:SetTitle(T("BULLET_HITCHANCE")) end) end)

local bulletFollow = safeCreate(Ctl.bulletSectionBasic, "Toggle", {
    Title = T("BULLET_FOLLOW"),
    Desc = T("BULLET_FOLLOW_DESC"),
    Value = Ctl.BulletState.FollowAimbot,
    Callback = function(v) Ctl.BulletState.FollowAimbot = v end
})
bindLang(function()
    pcall(function() bulletFollow:SetTitle(T("BULLET_FOLLOW")) end)
    pcall(function() bulletFollow:SetDesc(T("BULLET_FOLLOW_DESC")) end)
end)

Ctl.bulletSectionFilter = safeCreate(TabHandles.Bullet, "Section", { Title = T("BULLET_FILTER"), Icon = "filter" })
bindLang(function() setTitleSafe(Ctl.bulletSectionFilter, T("BULLET_FILTER")) end)

local bulletFov = safeCreate(Ctl.bulletSectionFilter, "Slider", {
    Title = T("BULLET_FOV"),
    Desc = T("BULLET_FOV_DESC"),
    Value = { Min = 30, Max = 600, Default = Ctl.BulletState.FOV },
    Step = 10,
    Callback = function(v) Ctl.BulletState.FOV = tonumber(v) or 200 end
})
bindLang(function() pcall(function() bulletFov:SetTitle(T("BULLET_FOV")) end) end)

local bulletDist = safeCreate(Ctl.bulletSectionFilter, "Slider", {
    Title = T("BULLET_MAXDIST"),
    Value = { Min = 50, Max = 2000, Default = Ctl.BulletState.MaxDistance },
    Step = 50,
    Callback = function(v) Ctl.BulletState.MaxDistance = tonumber(v) or 500 end
})
bindLang(function() pcall(function() bulletDist:SetTitle(T("BULLET_MAXDIST")) end) end)

local bulletWallbang = safeCreate(Ctl.bulletSectionFilter, "Toggle", {
    Title = T("BULLET_WALLBANG"),
    Desc = T("BULLET_WALLBANG_DESC"),
    Value = Ctl.BulletState.Wallbang,
    Callback = function(v)
        Ctl.BulletState.Wallbang = v
        pcall(function()
            if v then
                bulletStatus:SetDesc(T("BULLET_WALLBANG_NOTE") .. "\n" .. T("BULLET_SERVER_WARN"))
            else
                bulletStatus:SetDesc(T("BULLET_WALLBANG_OFF"))
            end
        end)
    end
})
bindLang(function()
    pcall(function() bulletWallbang:SetTitle(T("BULLET_WALLBANG")) end)
    pcall(function() bulletWallbang:SetDesc(T("BULLET_WALLBANG_DESC")) end)
end)

local bulletTeam = safeCreate(Ctl.bulletSectionFilter, "Toggle", {
    Title = T("BULLET_TEAM"),
    Value = Ctl.BulletState.TeamCheck,
    Callback = function(v) Ctl.BulletState.TeamCheck = v end
})
bindLang(function() pcall(function() bulletTeam:SetTitle(T("BULLET_TEAM")) end) end)

local bulletVisible = safeCreate(Ctl.bulletSectionFilter, "Toggle", {
    Title = T("BULLET_VIS"),
    Desc = T("BULLET_VIS_DESC"),
    Value = Ctl.BulletState.VisibleCheck,
    Callback = function(v) Ctl.BulletState.VisibleCheck = v end
})
bindLang(function()
    pcall(function() bulletVisible:SetTitle(T("BULLET_VIS")) end)
    pcall(function() bulletVisible:SetDesc(T("BULLET_VIS_DESC")) end)
end)

-- Hitbox 分区
Ctl.bulletSectionHitbox = safeCreate(TabHandles.Bullet, "Section", { Title = T("BULLET_HITBOX"), Icon = "maximize", Opened = true })
bindLang(function() setTitleSafe(Ctl.bulletSectionHitbox, T("BULLET_HITBOX")) end)

local bulletHbToggle = safeCreate(Ctl.bulletSectionHitbox, "Toggle", {
    Title = T("BULLET_HITBOX"),
    Desc = T("BULLET_HITBOX_DESC"),
    Value = HitboxState.Enabled,
    Callback = function(v)
        HitboxState.Enabled = v
        if not v then restoreAllHitbox() end
        pcall(function()
            bulletStatus:SetDesc(v and T("BULLET_HB_NOTE") or T("BULLET_STATUS_DESC"))
        end)
    end
})
bindLang(function()
    pcall(function() bulletHbToggle:SetTitle(T("BULLET_HITBOX")) end)
    pcall(function() bulletHbToggle:SetDesc(T("BULLET_HITBOX_DESC")) end)
end)

Ctl.bulletHbPart = safeCreate(Ctl.bulletSectionHitbox, "Dropdown", {
    Title = T("BULLET_HB_PART"),
    Values = { "躯干", "头部" },
    Value = HitboxState.Part,
    Callback = function(v) HitboxState.Part = v; restoreAllHitbox() end
})
bindLang(function() pcall(function() Ctl.bulletHbPart:SetTitle(T("BULLET_HB_PART")) end) end)

Ctl.bulletHbMult = safeCreate(Ctl.bulletSectionHitbox, "Slider", {
    Title = T("BULLET_HB_MULT"),
    Desc = T("BULLET_HB_MULT_DESC"),
    Value = { Min = 1, Max = 10, Default = HitboxState.Multiplier },
    Step = 0.5,
    Callback = function(v) HitboxState.Multiplier = tonumber(v) or 1.5; restoreAllHitbox() end
})
bindLang(function() pcall(function() Ctl.bulletHbMult:SetTitle(T("BULLET_HB_MULT")) end) end)

-- 抛射物参数
Ctl.bulletProjSpeed = safeCreate(Ctl.bulletSectionFilter, "Slider", {
    Title = T("BULLET_PROJ_SPEED"),
    Desc = T("BULLET_PROJ_SPEED_DESC"),
    Value = { Min = 10, Max = 500, Default = Ctl.BulletState.ProjMinSpeed },
    Step = 10,
    Callback = function(v) Ctl.BulletState.ProjMinSpeed = tonumber(v) or 50 end
})
bindLang(function() pcall(function() Ctl.bulletProjSpeed:SetTitle(T("BULLET_PROJ_SPEED")) end) end)

Ctl.bulletProjRange = safeCreate(Ctl.bulletSectionFilter, "Slider", {
    Title = T("BULLET_PROJ_RANGE"),
    Desc = T("BULLET_PROJ_RANGE_DESC"),
    Value = { Min = 5, Max = 200, Default = Ctl.BulletState.ProjRange },
    Step = 5,
    Callback = function(v) Ctl.BulletState.ProjRange = tonumber(v) or 25 end
})
bindLang(function() pcall(function() Ctl.bulletProjRange:SetTitle(T("BULLET_PROJ_RANGE")) end) end)

-- Remote 分区
Ctl.bulletSectionRemote = safeCreate(TabHandles.Bullet, "Section", { Title = T("BULLET_REMOTE"), Icon = "activity", Opened = true })
bindLang(function() setTitleSafe(Ctl.bulletSectionRemote, T("BULLET_REMOTE")) end)

safeCreate(Ctl.bulletSectionRemote, "Paragraph", {
    Title = T("BULLET_REMOTE"),
    Desc = T("BULLET_REMOTE_LOG_DESC"),
    Image = "info",
    ImageSize = 20,
    Color = "Grey",
})

safeCreate(Ctl.bulletSectionRemote, "Input", {
    Title = T("BULLET_RM_KW"),
    Desc = T("BULLET_RM_KW_DESC"),
    Value = Ctl.BulletState.RemoteKeyword,
    Type = "Input",
    Placeholder = "shoot",
    Callback = function(text) Ctl.BulletState.RemoteKeyword = tostring(text or "") end
})

Ctl.bulletRmIdx = safeCreate(Ctl.bulletSectionRemote, "Slider", {
    Title = T("BULLET_RM_IDX"),
    Desc = T("BULLET_RM_IDX_DESC"),
    Value = { Min = 1, Max = 10, Default = Ctl.BulletState.RemoteArgIndex },
    Step = 1,
    Callback = function(v) Ctl.BulletState.RemoteArgIndex = math.floor(tonumber(v) or 1) end
})
bindLang(function() pcall(function() Ctl.bulletRmIdx:SetTitle(T("BULLET_RM_IDX")) end) end)

Ctl.bulletRmType = safeCreate(Ctl.bulletSectionRemote, "Dropdown", {
    Title = T("BULLET_RM_TYPE"),
    Values = { "目标部位", T("T_PLAYER"), T("T_POSITION") },
    Value = Ctl.BulletState.RemoteArgType,
    Callback = function(v) Ctl.BulletState.RemoteArgType = v end
})
bindLang(function() pcall(function() Ctl.bulletRmType:SetTitle(T("BULLET_RM_TYPE")) end) end)

safeCreate(Ctl.bulletSectionRemote, "Button", {
    Title = T("BULLET_RM_LOG"),
    Icon = "list",
    Callback = function()
        local lines = {}
        for name, e in pairs(RemoteLog) do
            table.insert(lines, tostring(name) .. "  x" .. tostring(e.count))
        end
        if #lines == 0 then
            WindUI:Notify({ Title = T("BULLET_RM_LOG"), Content = T("BULLET_RM_EMPTY"), Icon = "info", Duration = 4 })
        else
            table.sort(lines)
            local body = table.concat(lines, "\n")
            if #body > 600 then body = string.sub(body, 1, 600) .. "\n..." end
            Window:Dialog({
                Title = T("BULLET_RM_CAPTURED"),
                Content = body,
                Buttons = { { Title = T("OK"), Variant = "Primary" } }
            })
        end
    end
})

safeCreate(TabHandles.Bullet, "Button", {
    Title = T("BULLET_RESET"),
    Icon = "refresh-cw",
    Callback = function()
        Ctl.BulletState.Mode = "射线重定向"; Ctl.BulletState.Part = "头部"
        Ctl.BulletState.HitChance = 100; Ctl.BulletState.FOV = 200
        Ctl.BulletState.MaxDistance = 500; Ctl.BulletState.TeamCheck = true
        Ctl.BulletState.VisibleCheck = true; Ctl.BulletState.FollowAimbot = true
        Ctl.BulletState.Wallbang = false
        Ctl.BulletState.Impl = "Hook"; Ctl.BulletState.FireKey = "左键"
        pcall(function() bulletWallbang:Set(false) end)
        Ctl.BulletState.ProjMinSpeed = 50; Ctl.BulletState.ProjRange = 25
        Ctl.BulletState.RemoteKeyword = ""; Ctl.BulletState.RemoteArgIndex = 1
        Ctl.BulletState.RemoteArgType = "目标部位"
        HitboxState.Enabled = false; HitboxState.Multiplier = 1.5; HitboxState.Part = "躯干"
        restoreAllHitbox()
        pcall(function() bulletImpl:Select("Hook") end)
        pcall(function() bulletFireKey:Select("左键") end)
        pcall(function() bulletHbToggle:Set(false) end)
        pcall(function() Ctl.bulletHbMult:Set(1.5) end)
        pcall(function() Ctl.bulletHbPart:Select("躯干") end)
        pcall(function() Ctl.bulletProjSpeed:Set(50) end)
        pcall(function() Ctl.bulletProjRange:Set(25) end)
        pcall(function() Ctl.bulletRmIdx:Set(1) end)
        pcall(function() Ctl.bulletRmType:Select("目标部位") end)
        bulletMethod:Select("射线重定向"); bulletPart:Select("头部")
        bulletHitChance:Set(100); bulletFov:Set(200); bulletDist:Set(500)
        WindUI:Notify({ Title = T("BULLET_TITLE"), Content = T("AIM_RESET_MSG"), Icon = "check", Duration = 2 })
    end
})
-- ======================= 子追模块结束 =======================



-- ========================= 飞行模块 =========================
Ctl.FlyState = {
    Enabled = false,
    Noclip = true,
    NoclipMode = "关闭碰撞",
    AutoUnstick = true,
    Speed = 1,
    VertSpeed = 1,
    flyConn = nil,
    noclipConn = nil,
    upConn = nil,
    downConn = nil,
    bg = nil,
    bv = nil,
}

local HUMANOID_STATES = {
    Enum.HumanoidStateType.Climbing, Enum.HumanoidStateType.FallingDown,
    Enum.HumanoidStateType.Flying, Enum.HumanoidStateType.Freefall,
    Enum.HumanoidStateType.GettingUp, Enum.HumanoidStateType.Jumping,
    Enum.HumanoidStateType.Landed, Enum.HumanoidStateType.Physics,
    Enum.HumanoidStateType.PlatformStanding, Enum.HumanoidStateType.Ragdoll,
    Enum.HumanoidStateType.Running, Enum.HumanoidStateType.RunningNoPhysics,
    Enum.HumanoidStateType.Seated, Enum.HumanoidStateType.StrafingNoPhysics,
    Enum.HumanoidStateType.Swimming,
}

local function setAllStates(hum, enabled)
    if not hum or not hum.Parent then return end
    for _, st in ipairs(HUMANOID_STATES) do
        pcall(function() hum:SetStateEnabled(st, enabled) end)
    end
end

local function flyChar() return LocalPlayer.Character end
local function flyHum(c) return c and c:FindFirstChildOfClass("Humanoid") end
local function flyRoot(c)
    return c and (c:FindFirstChild("HumanoidRootPart") or c:FindFirstChild("Torso") or c:FindFirstChild("UpperTorso"))
end

-- 穿墙：优先用「关闭碰撞」，避免 TranslateBy 把角色推进地形深处卡死
Ctl.NoclipSaved = {}

local function applyNoclipParts(enable)
    local c = flyChar()
    if not c then return end
    for _, part in ipairs(c:GetDescendants()) do
        if part:IsA("BasePart") then
            if enable then
                if part.CanCollide then
                    Ctl.NoclipSaved[part] = true
                    part.CanCollide = false
                end
            elseif Ctl.NoclipSaved[part] then
                part.CanCollide = true
                Ctl.NoclipSaved[part] = nil
            end
        end
    end
end

-- 检测角色是否嵌在实体内（多方向射线）
local function isStuck(root)
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Blacklist
    params.FilterDescendantsInstances = { root.Parent }
    params.IgnoreWater = true
    local dirs = {
        Vector3.new(0, 1, 0), Vector3.new(0, -1, 0),
        Vector3.new(1, 0, 0), Vector3.new(-1, 0, 0),
        Vector3.new(0, 0, 1), Vector3.new(0, 0, -1),
    }
    local hits = 0
    for _, d in ipairs(dirs) do
        if workspace:Raycast(root.Position, d * 1.2, params) then hits = hits + 1 end
    end
    return hits >= 4
end

-- 向上逐步试探，直到脱离实体
local function unstick(root)
    for _ = 1, 15 do
        if not isStuck(root) then return true end
        pcall(function() root.CFrame = root.CFrame + Vector3.new(0, 2, 0) end)
        task.wait(0.03)
    end
    return not isStuck(root)
end

-- 强化状态机重置：高档速度后状态更混乱，需多次重试
local function resetHumanoidState(hum)
    task.spawn(function()
        for i = 1, 4 do
            task.wait(0.12 * i)
            if Ctl.FlyState.Enabled then return end
            if not (hum and hum.Parent) then return end
            pcall(function()
                hum.PlatformStand = false
                hum.Sit = false
                hum:ChangeState(Enum.HumanoidStateType.Landed)
            end)
            task.wait(0.1)
            if Ctl.FlyState.Enabled then return end
            pcall(function() hum:ChangeState(Enum.HumanoidStateType.Running) end)
            task.wait(0.1)
            if Ctl.FlyState.Enabled then return end
            pcall(function() hum:ChangeState(Enum.HumanoidStateType.RunningNoPhysics) end)
        end
    end)
end

local function stopNoclip()
    if Ctl.FlyState.noclipConn then
        Ctl.FlyState.noclipConn:Disconnect()
        Ctl.FlyState.noclipConn = nil
    end
    applyNoclipParts(false)
    for k in pairs(Ctl.NoclipSaved) do Ctl.NoclipSaved[k] = nil end
end

local function startNoclip()
    stopNoclip()
    if not Ctl.FlyState.Noclip then return end

    if Ctl.FlyState.NoclipMode == "关闭碰撞" then
        applyNoclipParts(true)
        Ctl.FlyState.noclipConn = RunService.Heartbeat:Connect(function()
            if not Ctl.FlyState.Enabled then return end
            applyNoclipParts(true)
        end)
    else
        Ctl.FlyState.noclipConn = RunService.Heartbeat:Connect(function()
            if not Ctl.FlyState.Enabled then return end
            local c = flyChar()
            local h = flyHum(c)
            if not (c and c.Parent and h and h.Parent) then return end
            if h.MoveDirection.Magnitude > 0 then
                pcall(function() c:TranslateBy(h.MoveDirection * Ctl.FlyState.Speed) end)
            end
        end)
    end
end

local function stopFly()
    Ctl.FlyState.Enabled = false
    if Ctl.FlyState.upConn then Ctl.FlyState.upConn:Disconnect(); Ctl.FlyState.upConn = nil end
    if Ctl.FlyState.downConn then Ctl.FlyState.downConn:Disconnect(); Ctl.FlyState.downConn = nil end
    if Ctl.FlyState.flyConn then Ctl.FlyState.flyConn:Disconnect(); Ctl.FlyState.flyConn = nil end
    if Ctl.FlyState.bg then pcall(function() Ctl.FlyState.bg:Destroy() end); Ctl.FlyState.bg = nil end
    if Ctl.FlyState.bv then pcall(function() Ctl.FlyState.bv:Destroy() end); Ctl.FlyState.bv = nil end
    stopNoclip()

    local c = flyChar()
    local h = flyHum(c)
    local root = flyRoot(c)
    if c and h then
        local animate = c:FindFirstChild("Animate")
        if animate then animate.Disabled = false end
        pcall(function() h.PlatformStand = false end)
        setAllStates(h, true)
        -- 脱困：穿墙可能把角色留在实体内，先抬出来再恢复状态
        if root and Ctl.FlyState.AutoUnstick then
            pcall(function() unstick(root) end)
        end
        resetHumanoidState(h)
    end
end

local function startFly()
    stopFly()
    local c = flyChar()
    local h = flyHum(c)
    local root = flyRoot(c)
    if not (c and h and h.Parent and root) then
        WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_NOCHAR"), Icon = "x", Duration = 3 })
        return false
    end

    Ctl.FlyState.Enabled = true
    setAllStates(h, false)
    pcall(function() h:ChangeState(Enum.HumanoidStateType.Swimming) end)
    local animate = c:FindFirstChild("Animate")
    if animate then animate.Disabled = true end
    h.PlatformStand = true

    Ctl.FlyState.bg = Instance.new("BodyGyro")
    Ctl.FlyState.bg.P = 9e4
    Ctl.FlyState.bg.MaxTorque = Vector3.new(9e9, 9e9, 9e9)
    Ctl.FlyState.bg.CFrame = root.CFrame
    Ctl.FlyState.bg.Parent = root

    Ctl.FlyState.bv = Instance.new("BodyVelocity")
    Ctl.FlyState.bv.Velocity = Vector3.new(0, 0.1, 0)
    Ctl.FlyState.bv.MaxForce = Vector3.new(9e9, 9e9, 9e9)
    Ctl.FlyState.bv.Parent = root

    local cur = 0
    local maxSpd = 50 * Ctl.FlyState.Speed

    Ctl.FlyState.flyConn = RunService.Heartbeat:Connect(function()
        if not Ctl.FlyState.Enabled then return end
        local c2 = flyChar()
        local h2 = flyHum(c2)
        if not (c2 and c2.Parent and h2 and h2.Parent) then stopFly(); return end

        local moveDir = h2.MoveDirection
        local moving = moveDir.Magnitude > 0
        if moving then
            cur = math.min(cur + 0.5 + cur / maxSpd, maxSpd)
        elseif cur > 0 then
            cur = math.max(cur - 1, 0)
        end

        local cam = workspace.CurrentCamera
        if moving or cur > 0 then
            local cf = cam.CFrame
            local fwd = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z).Unit
            local rgt = Vector3.new(cf.RightVector.X, 0, cf.RightVector.Z).Unit
            local dir = fwd * -moveDir.Z + rgt * moveDir.X
            if dir.Magnitude > 0 then dir = dir.Unit end
            Ctl.FlyState.bv.Velocity = dir * cur
        else
            Ctl.FlyState.bv.Velocity = Vector3.new(0, Ctl.FlyState.bv.Velocity.Y, 0)
        end
        Ctl.FlyState.bg.CFrame = cam.CFrame
    end)

    if Ctl.FlyState.Noclip then startNoclip() end
    return true
end

local function startVertical(dir)
    local key = dir > 0 and "upConn" or "downConn"
    if Ctl.FlyState[key] then return end
    Ctl.FlyState[key] = RunService.Heartbeat:Connect(function()
        local root = flyRoot(flyChar())
        if root then
            pcall(function()
                root.CFrame = root.CFrame * CFrame.new(0, dir * Ctl.FlyState.VertSpeed, 0)
            end)
        end
    end)
end

local function stopVertical(dir)
    local key = dir > 0 and "upConn" or "downConn"
    if Ctl.FlyState[key] then
        Ctl.FlyState[key]:Disconnect()
        Ctl.FlyState[key] = nil
    end
end

local flyToggle = safeCreate(TabHandles.Fly, "Toggle", {
    Title = T("FLY_ENABLE"),
    Desc = T("FLY_ENABLE_DESC"),
    Value = false,
    Callback = function(v)
        if v then
            local ok = startFly()
            if not ok then
                pcall(function() flyToggle:Set(false) end)
                return
            end
            WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_STARTED"), Icon = "check", Duration = 2 })
        else
            stopFly()
            WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_STOPPED"), Icon = "check", Duration = 2 })
        end
    end
})
bindLang(function()
    pcall(function() flyToggle:SetTitle(T("FLY_ENABLE")) end)
    pcall(function() flyToggle:SetDesc(T("FLY_ENABLE_DESC")) end)
end)

safeCreate(TabHandles.Fly, "Divider", {})

Ctl.flySpeedSlider = safeCreate(TabHandles.Fly, "Slider", {
    Title = T("FLY_SPEED"),
    Desc = T("FLY_SPEED_DESC"),
    Value = { Min = 1, Max = 20, Default = Ctl.FlyState.Speed },
    Step = 1,
    Callback = function(v)
        Ctl.FlyState.Speed = tonumber(v) or 1
        if Ctl.FlyState.Noclip and Ctl.FlyState.Enabled then startNoclip() end
    end
})
bindLang(function() pcall(function() Ctl.flySpeedSlider:SetTitle(T("FLY_SPEED")) end) end)

Ctl.flyVertSlider = safeCreate(TabHandles.Fly, "Slider", {
    Title = T("FLY_VERTSPD"),
    Desc = T("FLY_VERTSPD_DESC"),
    Value = { Min = 1, Max = 10, Default = Ctl.FlyState.VertSpeed },
    Step = 1,
    Callback = function(v) Ctl.FlyState.VertSpeed = tonumber(v) or 1 end
})
bindLang(function() pcall(function() Ctl.flyVertSlider:SetTitle(T("FLY_VERTSPD")) end) end)

Ctl.flyNoclipToggle = safeCreate(TabHandles.Fly, "Toggle", {
    Title = T("FLY_NOCLIP"),
    Desc = T("FLY_NOCLIP_DESC"),
    Value = Ctl.FlyState.Noclip,
    Callback = function(v)
        Ctl.FlyState.Noclip = v
        if Ctl.FlyState.Enabled then
            if v then startNoclip() else stopNoclip() end
        end
    end
})
bindLang(function()
    pcall(function() Ctl.flyNoclipToggle:SetTitle(T("FLY_NOCLIP")) end)
    pcall(function() Ctl.flyNoclipToggle:SetDesc(T("FLY_NOCLIP_DESC")) end)
end)

Ctl.flyNoclipMode = safeCreate(TabHandles.Fly, "Dropdown", {
    Title = T("FLY_NOCLIP_MODE"),
    Desc = T("FLY_NOCLIP_MODE_DESC"),
    Values = { "关闭碰撞", "位移式" },
    Value = Ctl.FlyState.NoclipMode,
    Callback = function(v)
        Ctl.FlyState.NoclipMode = v
        if Ctl.FlyState.Enabled and Ctl.FlyState.Noclip then
            stopNoclip()
            startNoclip()
        end
    end
})
bindLang(function() pcall(function() Ctl.flyNoclipMode:SetTitle(T("FLY_NOCLIP_MODE")) end) end)

Ctl.flyUnstickToggle = safeCreate(TabHandles.Fly, "Toggle", {
    Title = T("FLY_UNSTICK"),
    Desc = T("FLY_UNSTICK_DESC"),
    Value = Ctl.FlyState.AutoUnstick,
    Callback = function(v) Ctl.FlyState.AutoUnstick = v end
})
bindLang(function()
    pcall(function() Ctl.flyUnstickToggle:SetTitle(T("FLY_UNSTICK")) end)
    pcall(function() Ctl.flyUnstickToggle:SetDesc(T("FLY_UNSTICK_DESC")) end)
end)

safeCreate(TabHandles.Fly, "Divider", {})

safeCreate(TabHandles.Fly, "Button", {
    Title = T("FLY_FORCE_RESET"),
    Desc = T("FLY_FORCE_RESET_DESC"),
    Icon = "refresh-cw",
    Variant = "Primary",
    Callback = function()
        stopFly()
        pcall(function() flyToggle:Set(false) end)
        task.wait(0.2)
        local c = flyChar()
        local root = flyRoot(c)
        local h = flyHum(c)
        if root then pcall(function() unstick(root) end) end
        if h then resetHumanoidState(h) end
        WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_RESET_DONE"), Icon = "check", Duration = 3 })
    end
})

safeCreate(TabHandles.Fly, "Divider", {})

safeCreate(TabHandles.Fly, "Button", {
    Title = T("FLY_UP"),
    Desc = T("FLY_UP_DESC"),
    Icon = "arrow-up",
    Callback = function()
        if not Ctl.FlyState.Enabled then
            WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_NOCHAR"), Icon = "x", Duration = 2 })
            return
        end
        startVertical(1)
        task.delay(0.35, function() stopVertical(1) end)
    end
})

safeCreate(TabHandles.Fly, "Button", {
    Title = T("FLY_DOWN"),
    Desc = T("FLY_DOWN_DESC"),
    Icon = "arrow-down",
    Callback = function()
        if not Ctl.FlyState.Enabled then
            WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_NOCHAR"), Icon = "x", Duration = 2 })
            return
        end
        startVertical(-1)
        task.delay(0.35, function() stopVertical(-1) end)
    end
})

safeCreate(TabHandles.Fly, "Button", {
    Title = T("FLY_STOP"),
    Icon = "square",
    Variant = "Tertiary",
    Callback = function()
        stopFly()
        pcall(function() flyToggle:Set(false) end)
        WindUI:Notify({ Title = T("FLY_TITLE"), Content = T("FLY_STOPPED"), Icon = "check", Duration = 2 })
    end
})

LocalPlayer.CharacterAdded:Connect(function()
    task.wait(0.7)
    stopFly()
    pcall(function() flyToggle:Set(false) end)
end)

-- ======================= 飞行模块结束 =======================

-- 诊断入口（挂在介绍页，任何情况下都能点开查看错误）
safeCreate(TabHandles.Profile, "Button", {
    Title = "脚本诊断",
    Desc = "查看界面构建与 ESP 运行中的错误",
    Icon = "activity",
    Callback = function()
        local lines = {}
        table.insert(lines, "ESP 已绘制: " .. tostring(ESPDrawnCount))
        table.insert(lines, "Drawing 可用: " .. tostring(ESPSupported))
        table.insert(lines, "")
        if ESPLastError and ESPLastError ~= "" then
            table.insert(lines, "ESP 运行错误:")
            table.insert(lines, string.sub(ESPLastError, 1, 800))
        else
            table.insert(lines, "ESP 运行错误: 无")
        end
        table.insert(lines, "")
        if #UIErrorLog > 0 then
            table.insert(lines, "界面构建错误 (" .. tostring(#UIErrorLog) .. "):")
            for i = 1, math.min(#UIErrorLog, 12) do
                table.insert(lines, string.sub(UIErrorLog[i], 1, 160))
            end
        else
            table.insert(lines, "界面构建错误: 无")
        end
        Window:Dialog({
            Title = "脚本诊断",
            Content = table.concat(lines, "\n"),
            Buttons = { { Title = "确定", Variant = "Primary" } }
        })
    end
})


-- ========================= 通用模块 =========================
Ctl.Lighting = game:GetService("Ctl.Lighting")

Ctl.MiscState = {
    Speed = false,  SpeedValue = 16,
    Jump = false,   JumpValue = 50,
    Health = false, HealthValue = 100,
    InfJump = false,
    Gravity = false, GravityValue = 196,
    Noclip = false,
    FOV = false,    FOVValue = 70,
    Bright = false,
}

Ctl.MiscOrig = {}
Ctl.NoclipSaved = {}
Ctl.LightingSaved = nil
Ctl.InfJumpConn = nil

local function miscChar() return LocalPlayer.Character end
local function miscHum()
    local c = miscChar()
    return c and c:FindFirstChildOfClass("Humanoid") or nil
end

local function saveMiscOrig()
    local h = miscHum()
    if h and not Ctl.MiscOrig.walk then
        Ctl.MiscOrig.walk = h.WalkSpeed
        Ctl.MiscOrig.jump = h.JumpPower
        Ctl.MiscOrig.maxhp = h.MaxHealth
    end
    if not Ctl.MiscOrig.gravity then Ctl.MiscOrig.gravity = workspace.Gravity end
    if not Ctl.MiscOrig.fov then Ctl.MiscOrig.fov = (Camera and Camera.FieldOfView) or 70 end
end

local function restoreNoclipAll()
    for part in pairs(Ctl.NoclipSaved) do
        pcall(function() part.CanCollide = true end)
        Ctl.NoclipSaved[part] = nil
    end
end

local function applyNoclipOn()
    local c = miscChar()
    if not c then return end
    for _, part in ipairs(c:GetDescendants()) do
        if part:IsA("BasePart") and part.CanCollide then
            Ctl.NoclipSaved[part] = true
            pcall(function() part.CanCollide = false end)
        end
    end
end

local function restoreLighting()
    if not Ctl.LightingSaved then return end
    pcall(function()
        Ctl.Lighting.Ambient = Ctl.LightingSaved.Ambient
        Ctl.Lighting.Brightness = Ctl.LightingSaved.Brightness
        Ctl.Lighting.FogEnd = Ctl.LightingSaved.FogEnd
        Ctl.Lighting.GlobalShadows = Ctl.LightingSaved.GlobalShadows
    end)
    LightingSaved = nil
end

local function applyLightingOn()
    if not Ctl.LightingSaved then
        LightingSaved = {
            Ambient = Ctl.Lighting.Ambient,
            Brightness = Ctl.Lighting.Brightness,
            FogEnd = Ctl.Lighting.FogEnd,
            GlobalShadows = Ctl.Lighting.GlobalShadows,
        }
    end
    pcall(function()
        Ctl.Lighting.Ambient = Color3.new(1, 1, 1)
        Ctl.Lighting.Brightness = 3
        Ctl.Lighting.FogEnd = 1e6
        Ctl.Lighting.GlobalShadows = false
    end)
end

local function applyMisc()
    saveMiscOrig()
    local h = miscHum()
    if h then
        if Ctl.MiscState.Speed then
            pcall(function() h.WalkSpeed = Ctl.MiscState.SpeedValue end)
        end
        if Ctl.MiscState.Jump then
            pcall(function() h.JumpPower = Ctl.MiscState.JumpValue end)
        end
        if Ctl.MiscState.Health then
            pcall(function()
                h.MaxHealth = Ctl.MiscState.HealthValue
                if h.Health > h.MaxHealth then h.Health = h.MaxHealth end
            end)
        end
    end
    if Ctl.MiscState.Gravity then
        pcall(function() workspace.Gravity = Ctl.MiscState.GravityValue end)
    end
    if Ctl.MiscState.Noclip then applyNoclipOn() end
    if Ctl.MiscState.FOV then
        pcall(function() Camera.FieldOfView = Ctl.MiscState.FOVValue end)
    end
    if Ctl.MiscState.Bright then applyLightingOn() end
end

local function restoreMiscAll()
    local h = miscHum()
    if h then
        pcall(function()
            if Ctl.MiscOrig.walk then h.WalkSpeed = Ctl.MiscOrig.walk end
            if Ctl.MiscOrig.jump then h.JumpPower = Ctl.MiscOrig.jump end
            if Ctl.MiscOrig.maxhp then h.MaxHealth = Ctl.MiscOrig.maxhp end
        end)
    end
    if Ctl.MiscOrig.gravity then pcall(function() workspace.Gravity = Ctl.MiscOrig.gravity end) end
    if Ctl.MiscOrig.fov then pcall(function() Camera.FieldOfView = Ctl.MiscOrig.fov end) end
    restoreNoclipAll()
    restoreLighting()
end

RunService.RenderStepped:Connect(function()
    if not (Ctl.MiscState.Speed or Ctl.MiscState.Jump or Ctl.MiscState.Health or Ctl.MiscState.Gravity
        or Ctl.MiscState.Noclip or Ctl.MiscState.FOV or Ctl.MiscState.Bright) then return end
    pcall(applyMisc)
end)

-- 关闭功能时恢复对应项
RunService.RenderStepped:Connect(function()
    if not Ctl.MiscState.Noclip then restoreNoclipAll() end
    if not Ctl.MiscState.Bright then restoreLighting() end
    if not Ctl.MiscState.Gravity and Ctl.MiscOrig.gravity then
        pcall(function() workspace.Gravity = Ctl.MiscOrig.gravity end)
    end
    if not Ctl.MiscState.FOV and Ctl.MiscOrig.fov then
        pcall(function() Camera.FieldOfView = Ctl.MiscOrig.fov end)
    end
end)

pcall(function()
    InfJumpConn = UserInputService.JumpRequest:Connect(function()
        if not Ctl.MiscState.InfJump then return end
        local h = miscHum()
        if h then
            pcall(function() h:ChangeState(Enum.HumanoidStateType.Jumping) end)
        end
    end)
end)

LocalPlayer.CharacterAdded:Connect(function()
    task.wait(0.5)
    Ctl.MiscOrig.walk = nil; Ctl.MiscOrig.jump = nil; Ctl.MiscOrig.maxhp = nil
    restoreNoclipAll()
    saveMiscOrig()
end)

-- ---------- 通用界面 ----------
safeCreate(TabHandles.Misc, "Paragraph", {
    Title = T("MISC_TAB"),
    Desc = T("MISC_DESC"),
    Image = "type",
    ImageSize = 20,
    Color = "White",
}, "miscHeader")
safeCreate(TabHandles.Misc, "Divider", {}, "miscDiv")

Ctl.miscSectionChar = safeCreate(TabHandles.Misc, "Section", { Title = T("MISC_SEC_CHAR"), Icon = "user" }, "miscSecChar")

Ctl.miscSpeedToggle = safeCreate(Ctl.miscSectionChar, "Toggle", {
    Title = T("MISC_SPEED"),
    Desc = T("MISC_SPEED_DESC"),
    Value = Ctl.MiscState.Speed,
    Callback = function(v) Ctl.MiscState.Speed = v; if not v and Ctl.MiscOrig.walk then pcall(function() miscHum().WalkSpeed = Ctl.MiscOrig.walk end) end end
}, "miscSpeedToggle")
bindLang(function()
    pcall(function() Ctl.miscSpeedToggle:SetTitle(T("MISC_SPEED")) end)
    pcall(function() Ctl.miscSpeedToggle:SetDesc(T("MISC_SPEED_DESC")) end)
end)

Ctl.miscSpeedSlider = safeCreate(Ctl.miscSectionChar, "Slider", {
    Title = T("MISC_SPEED"),
    Value = { Min = 16, Max = 500, Default = Ctl.MiscState.SpeedValue },
    Step = 1,
    Callback = function(v) Ctl.MiscState.SpeedValue = tonumber(v) or 16 end
}, "miscSpeedSlider")
bindLang(function() pcall(function() Ctl.miscSpeedSlider:SetTitle(T("MISC_SPEED")) end) end)

Ctl.miscJumpToggle = safeCreate(Ctl.miscSectionChar, "Toggle", {
    Title = T("MISC_JUMP"),
    Desc = T("MISC_JUMP_DESC"),
    Value = Ctl.MiscState.Jump,
    Callback = function(v) Ctl.MiscState.Jump = v end
}, "miscJumpToggle")
bindLang(function()
    pcall(function() Ctl.miscJumpToggle:SetTitle(T("MISC_JUMP")) end)
    pcall(function() Ctl.miscJumpToggle:SetDesc(T("MISC_JUMP_DESC")) end)
end)

Ctl.miscJumpSlider = safeCreate(Ctl.miscSectionChar, "Slider", {
    Title = T("MISC_JUMP"),
    Value = { Min = 50, Max = 500, Default = Ctl.MiscState.JumpValue },
    Step = 1,
    Callback = function(v) Ctl.MiscState.JumpValue = tonumber(v) or 50 end
}, "miscJumpSlider")
bindLang(function() pcall(function() Ctl.miscJumpSlider:SetTitle(T("MISC_JUMP")) end) end)

Ctl.miscHealthToggle = safeCreate(Ctl.miscSectionChar, "Toggle", {
    Title = T("MISC_HEALTH"),
    Desc = T("MISC_HEALTH_DESC"),
    Value = Ctl.MiscState.Health,
    Callback = function(v) Ctl.MiscState.Health = v end
}, "miscHealthToggle")
bindLang(function()
    pcall(function() Ctl.miscHealthToggle:SetTitle(T("MISC_HEALTH")) end)
    pcall(function() Ctl.miscHealthToggle:SetDesc(T("MISC_HEALTH_DESC")) end)
end)

Ctl.miscHealthSlider = safeCreate(Ctl.miscSectionChar, "Slider", {
    Title = T("MISC_HEALTH"),
    Value = { Min = 100, Max = 10000, Default = Ctl.MiscState.HealthValue },
    Step = 100,
    Callback = function(v) Ctl.MiscState.HealthValue = tonumber(v) or 100 end
}, "miscHealthSlider")
bindLang(function() pcall(function() Ctl.miscHealthSlider:SetTitle(T("MISC_HEALTH")) end) end)

Ctl.miscInfJumpToggle = safeCreate(Ctl.miscSectionChar, "Toggle", {
    Title = T("MISC_INFJUMP"),
    Desc = T("MISC_INFJUMP_DESC"),
    Value = Ctl.MiscState.InfJump,
    Callback = function(v) Ctl.MiscState.InfJump = v end
}, "miscInfJumpToggle")
bindLang(function()
    pcall(function() Ctl.miscInfJumpToggle:SetTitle(T("MISC_INFJUMP")) end)
    pcall(function() Ctl.miscInfJumpToggle:SetDesc(T("MISC_INFJUMP_DESC")) end)
end)

Ctl.miscSectionWorld = safeCreate(TabHandles.Misc, "Section", { Title = T("MISC_SEC_WORLD"), Icon = "globe" }, "miscSecWorld")

Ctl.miscGravityToggle = safeCreate(Ctl.miscSectionWorld, "Toggle", {
    Title = T("MISC_GRAVITY"),
    Desc = T("MISC_GRAVITY_DESC"),
    Value = Ctl.MiscState.Gravity,
    Callback = function(v) Ctl.MiscState.Gravity = v end
}, "miscGravityToggle")
bindLang(function()
    pcall(function() Ctl.miscGravityToggle:SetTitle(T("MISC_GRAVITY")) end)
    pcall(function() Ctl.miscGravityToggle:SetDesc(T("MISC_GRAVITY_DESC")) end)
end)

Ctl.miscGravitySlider = safeCreate(Ctl.miscSectionWorld, "Slider", {
    Title = T("MISC_GRAVITY"),
    Value = { Min = 0, Max = 400, Default = Ctl.MiscState.GravityValue },
    Step = 1,
    Callback = function(v) Ctl.MiscState.GravityValue = tonumber(v) or 196 end
}, "miscGravitySlider")
bindLang(function() pcall(function() Ctl.miscGravitySlider:SetTitle(T("MISC_GRAVITY")) end) end)

Ctl.miscNoclipToggle = safeCreate(Ctl.miscSectionWorld, "Toggle", {
    Title = T("MISC_NOCLIP"),
    Desc = T("MISC_NOCLIP_DESC"),
    Value = Ctl.MiscState.Noclip,
    Callback = function(v) Ctl.MiscState.Noclip = v end
}, "miscNoclipToggle")
bindLang(function()
    pcall(function() Ctl.miscNoclipToggle:SetTitle(T("MISC_NOCLIP")) end)
    pcall(function() Ctl.miscNoclipToggle:SetDesc(T("MISC_NOCLIP_DESC")) end)
end)

Ctl.miscFovToggle = safeCreate(Ctl.miscSectionWorld, "Toggle", {
    Title = T("MISC_FOV"),
    Desc = T("MISC_FOV_DESC"),
    Value = Ctl.MiscState.FOV,
    Callback = function(v) Ctl.MiscState.FOV = v end
}, "miscFovToggle")
bindLang(function()
    pcall(function() Ctl.miscFovToggle:SetTitle(T("MISC_FOV")) end)
    pcall(function() Ctl.miscFovToggle:SetDesc(T("MISC_FOV_DESC")) end)
end)

Ctl.miscFovSlider = safeCreate(Ctl.miscSectionWorld, "Slider", {
    Title = T("MISC_FOV"),
    Value = { Min = 70, Max = 120, Default = Ctl.MiscState.FOVValue },
    Step = 1,
    Callback = function(v) Ctl.MiscState.FOVValue = tonumber(v) or 70 end
}, "miscFovSlider")
bindLang(function() pcall(function() Ctl.miscFovSlider:SetTitle(T("MISC_FOV")) end) end)

Ctl.miscBrightToggle = safeCreate(Ctl.miscSectionWorld, "Toggle", {
    Title = T("MISC_BRIGHT"),
    Desc = T("MISC_BRIGHT_DESC"),
    Value = Ctl.MiscState.Bright,
    Callback = function(v) Ctl.MiscState.Bright = v end
}, "miscBrightToggle")
bindLang(function()
    pcall(function() Ctl.miscBrightToggle:SetTitle(T("MISC_BRIGHT")) end)
    pcall(function() Ctl.miscBrightToggle:SetDesc(T("MISC_BRIGHT_DESC")) end)
end)

safeCreate(TabHandles.Misc, "Button", {
    Title = T("MISC_RESET"),
    Desc = T("MISC_RESET_DESC"),
    Icon = "refresh-cw",
    Callback = function()
        Ctl.MiscState.Speed = false; Ctl.MiscState.Jump = false; Ctl.MiscState.Health = false
        Ctl.MiscState.InfJump = false; Ctl.MiscState.Gravity = false; Ctl.MiscState.Noclip = false
        Ctl.MiscState.FOV = false; Ctl.MiscState.Bright = false
        Ctl.MiscState.SpeedValue = 16; Ctl.MiscState.JumpValue = 50; Ctl.MiscState.HealthValue = 100
        Ctl.MiscState.GravityValue = 196; Ctl.MiscState.FOVValue = 70
        restoreMiscAll()
        stopAntiAFK()
        Ctl.XrayState.Enabled = false
        applyXray(true)
        pcall(function() Ctl.miscAfkToggle:Set(false) end)
        pcall(function() Ctl.miscXrayToggle:Set(false) end)
        pcall(function() Ctl.miscXraySlider:Set(70) end)
        pcall(function()
            Ctl.miscSpeedToggle:Set(false); Ctl.miscJumpToggle:Set(false)
            Ctl.miscHealthToggle:Set(false); Ctl.miscInfJumpToggle:Set(false)
            Ctl.miscGravityToggle:Set(false); Ctl.miscNoclipToggle:Set(false)
            Ctl.miscFovToggle:Set(false); Ctl.miscBrightToggle:Set(false)
            Ctl.miscSpeedSlider:Set(16); Ctl.miscJumpSlider:Set(50)
            Ctl.miscHealthSlider:Set(100); Ctl.miscGravitySlider:Set(196)
            Ctl.miscFovSlider:Set(70)
        end)
        WindUI:Notify({ Title = T("MISC_TAB"), Content = T("MISC_RESET_DONE"), Icon = "check", Duration = 2 })
    end
}, "miscResetBtn")

bindLang(function() setTitleSafe(TabHandles.Misc, T("MISC_TAB")) end)


-- ========================= 防AFK / 透视 / 传送 =========================
Ctl.VirtualUser = nil
pcall(function() VirtualUser = game:GetService("Ctl.VirtualUser") end)

Ctl.AntiAFKConn = nil
Ctl.XrayState = { Enabled = false, Amount = 0.7 }
Ctl.XrayConn = nil
Ctl.XrayTouched = {}
Ctl.TPList = {}
Ctl.TPSelected = nil

-- ---------- 防 AFK ----------
local function startAntiAFK()
    if Ctl.AntiAFKConn then return true end
    if Ctl.VirtualUser and LocalPlayer.Idled then
        AntiAFKConn = LocalPlayer.Idled:Connect(function()
            pcall(function()
                Ctl.VirtualUser:CaptureController()
                Ctl.VirtualUser:ClickButton2(Vector2.new())
            end)
        end)
        return true
    end
    -- 无 Ctl.VirtualUser 时：定期极微移动，避免被判静止
    AntiAFKConn = RunService.Heartbeat:Connect(function()
        -- 每 60 帧动一次
        if not Ctl._afkTick then Ctl._afkTick = 0 end
        Ctl._afkTick = Ctl._afkTick + 1
        if Ctl._afkTick < 60 then return end
        Ctl._afkTick = 0
        local c = LocalPlayer.Character
        local root = c and c:FindFirstChild("HumanoidRootPart")
        if root then
            pcall(function()
                root.CFrame = root.CFrame * CFrame.new(0, 0, 0.001)
            end)
        end
    end)
    return true
end

local function stopAntiAFK()
    if Ctl.AntiAFKConn then Ctl.AntiAFKConn:Disconnect(); AntiAFKConn = nil end
end

-- ---------- 透视 ----------
local function isCharPart(part)
    local m = part.Parent
    if not m then return false end
    if m:FindFirstChildOfClass("Humanoid") then return true end
    local gp = m.Parent
    if gp and gp:FindFirstChildOfClass("Humanoid") then return true end
    return false
end

local function applyXray(clear)
    for part in pairs(Ctl.XrayTouched) do
        pcall(function()
            part.LocalTransparencyModifier = clear and 0 or Ctl.XrayState.Amount
        end)
        if clear then Ctl.XrayTouched[part] = nil end
    end
end

local function scanXray()
    if not Ctl.XrayState.Enabled then
        applyXray(true)
        return
    end
    local myChar = LocalPlayer.Character
    for _, part in ipairs(workspace:GetDescendants()) do
        if part:IsA("BasePart") and not isCharPart(part) and part ~= workspace.Terrain then
            local skip = false
            if myChar and part:IsDescendantOf(myChar) then skip = true end
            if not skip then
                Ctl.XrayTouched[part] = true
                pcall(function() part.LocalTransparencyModifier = Ctl.XrayState.Amount end)
            end
        end
    end
end

-- ---------- 传送 ----------
local function refreshTPList()
    TPList = {}
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer then
            table.insert(Ctl.TPList, plr.DisplayName .. " (@" .. plr.Name .. ")")
        end
    end
    table.sort(Ctl.TPList)
    if #TPList == 0 then table.insert(Ctl.TPList, "（暂无其他玩家）") end
    return Ctl.TPList
end

local function findPlayerByLabel(label)
    local name = label:match("@([^)]+)")
    if name then
        return Players:FindFirstChild(name)
    end
    return nil
end

local function teleportTo(plr, behind, keepVeh)
    local myChar = LocalPlayer.Character
    local target = plr and plr.Character
    if not (myChar and target) then
        WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_NOCHAR"), Icon = "x", Duration = 2 })
        return
    end
    local myRoot = myChar:FindFirstChild("HumanoidRootPart")
    local tRoot = target:FindFirstChild("HumanoidRootPart")
    if not (myRoot and tRoot) then
        WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_NOCHAR"), Icon = "x", Duration = 2 })
        return
    end

    local cf = tRoot.CFrame
    if behind then
        cf = cf * CFrame.new(0, 0, 4)
    else
        cf = cf * CFrame.new(0, 3, 0)
    end

    local seat = myChar:FindFirstChildOfClass("Seat") or (myRoot:FindFirstChildOfClass("Weld") and nil)
    local hum = myChar:FindFirstChildOfClass("Humanoid")

    if keepVeh and hum and hum.SeatPart then
        local veh = hum.SeatPart
        pcall(function()
            if veh:IsA("BasePart") and veh.Parent and veh.Parent:IsA("Model") then
                veh.Parent:PivotTo(cf)
            else
                veh.CFrame = cf
            end
        end)
    else
        pcall(function() hum.Sit = false end)
        pcall(function() myRoot.CFrame = cf end)
        if myChar.PrimaryPart then
            pcall(function() myChar:PivotTo(cf) end)
        end
    end
    WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_OK"), Icon = "check", Duration = 2 })
end

-- ---------- 界面 ----------
Ctl.miscSectionAFK = safeCreate(TabHandles.Misc, "Section", { Title = T("MISC_SEC_AFK"), Icon = "shield" }, "miscSecAFK")

Ctl.miscAfkToggle = safeCreate(Ctl.miscSectionAFK, "Toggle", {
    Title = T("MISC_ANTIAFK"),
    Desc = T("MISC_ANTIAFK_DESC"),
    Value = false,
    Callback = function(v)
        if v then startAntiAFK() else stopAntiAFK() end
    end
}, "miscAfkToggle")
bindLang(function()
    pcall(function() Ctl.miscAfkToggle:SetTitle(T("MISC_ANTIAFK")) end)
    pcall(function() Ctl.miscAfkToggle:SetDesc(T("MISC_ANTIAFK_DESC")) end)
end)

Ctl.miscXrayToggle = safeCreate(Ctl.miscSectionAFK, "Toggle", {
    Title = T("MISC_XRAY"),
    Desc = T("MISC_XRAY_DESC"),
    Value = false,
    Callback = function(v)
        Ctl.XrayState.Enabled = v
        if v then
            scanXray()
            if not Ctl.XrayConn then
                XrayConn = RunService.Heartbeat:Connect(function()
                    if not Ctl.XrayState.Enabled then
                        applyXray(true)
                        if Ctl.XrayConn then Ctl.XrayConn:Disconnect(); XrayConn = nil end
                        return
                    end
                    if not Ctl._xrayTick then Ctl._xrayTick = 0 end
                    Ctl._xrayTick = Ctl._xrayTick + 1
                    if Ctl._xrayTick >= 120 then
                        Ctl._xrayTick = 0
                        scanXray()
                    end
                end)
            end
        else
            applyXray(true)
        end
    end
}, "miscXrayToggle")
bindLang(function()
    pcall(function() Ctl.miscXrayToggle:SetTitle(T("MISC_XRAY")) end)
    pcall(function() Ctl.miscXrayToggle:SetDesc(T("MISC_XRAY_DESC")) end)
end)

Ctl.miscXraySlider = safeCreate(Ctl.miscSectionAFK, "Slider", {
    Title = T("MISC_XRAY_AMT"),
    Desc = T("MISC_XRAY_AMT_DESC"),
    Value = { Min = 10, Max = 100, Default = math.floor(Ctl.XrayState.Amount * 100) },
    Step = 5,
    Callback = function(v)
        Ctl.XrayState.Amount = (tonumber(v) or 70) / 100
        if Ctl.XrayState.Enabled then scanXray() end
    end
}, "miscXraySlider")
bindLang(function() pcall(function() Ctl.miscXraySlider:SetTitle(T("MISC_XRAY_AMT")) end) end)

Ctl.miscSectionTP = safeCreate(TabHandles.Misc, "Section", { Title = T("MISC_SEC_TP"), Icon = "map-pin" }, "miscSecTP")

Ctl.miscTpDropdown = safeCreate(Ctl.miscSectionTP, "Dropdown", {
    Title = T("MISC_TP_SELECT"),
    Desc = T("MISC_TP_SELECT_DESC"),
    Values = refreshTPList(),
    Value = Ctl.TPList[1],
    Callback = function(v) TPSelected = v end
}, "miscTpDropdown")
bindLang(function() pcall(function() Ctl.miscTpDropdown:SetTitle(T("MISC_TP_SELECT")) end) end)

safeCreate(Ctl.miscSectionTP, "Button", {
    Title = T("MISC_TP_REFRESH"),
    Icon = "refresh-cw",
    Callback = function()
        local list = refreshTPList()
        pcall(function() Ctl.miscTpDropdown:Refresh(list) end)
        WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_REFRESHED"), Icon = "check", Duration = 2 })
    end
}, "miscTpRefreshBtn")

Ctl.miscTpVehToggle = safeCreate(Ctl.miscSectionTP, "Toggle", {
    Title = T("MISC_TP_VEH"),
    Desc = T("MISC_TP_VEH_DESC"),
    Value = false,
    Callback = function(v) Ctl.MiscState.TPKeepVeh = v end
}, "miscTpVehToggle")
bindLang(function()
    pcall(function() Ctl.miscTpVehToggle:SetTitle(T("MISC_TP_VEH")) end)
    pcall(function() Ctl.miscTpVehToggle:SetDesc(T("MISC_TP_VEH_DESC")) end)
end)

safeCreate(Ctl.miscSectionTP, "Button", {
    Title = T("MISC_TP_GO"),
    Icon = "navigation",
    Variant = "Primary",
    Callback = function()
        if not Ctl.TPSelected or Ctl.TPSelected:find("暂无") then
            WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_NONE"), Icon = "x", Duration = 2 })
            return
        end
        local plr = findPlayerByLabel(Ctl.TPSelected)
        if not plr then
            WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_NONE"), Icon = "x", Duration = 2 })
            return
        end
        teleportTo(plr, false, Ctl.MiscState.TPKeepVeh)
    end
}, "miscTpGoBtn")

safeCreate(Ctl.miscSectionTP, "Button", {
    Title = T("MISC_TP_BEHIND"),
    Desc = T("MISC_TP_BEHIND_DESC"),
    Icon = "arrow-right",
    Callback = function()
        if not Ctl.TPSelected or Ctl.TPSelected:find("暂无") then
            WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_NONE"), Icon = "x", Duration = 2 })
            return
        end
        local plr = findPlayerByLabel(Ctl.TPSelected)
        if not plr then
            WindUI:Notify({ Title = T("MISC_SEC_TP"), Content = T("MISC_TP_NONE"), Icon = "x", Duration = 2 })
            return
        end
        teleportTo(plr, true, Ctl.MiscState.TPKeepVeh)
    end
}, "miscTpBehindBtn")

-- 图标保守化
s = s.replace('Icon = "shield"', 'Icon = "shield"')

-- ======================= 防AFK / 透视 / 传送 结束 =======================


-- ======================= 通用模块结束 =======================

-- ========================= 个人档案页 =========================
local FPSMeter = { value = 0, frames = 0, last = tick() }
RunService.RenderStepped:Connect(function()
    FPSMeter.frames = FPSMeter.frames + 1
    if tick() - FPSMeter.last >= 1 then
        FPSMeter.value = FPSMeter.frames
        FPSMeter.frames = 0
        FPSMeter.last = tick()
    end
end)

local function getPing()
    local ok, ms = pcall(function()
        return math.floor(LocalPlayer:GetNetworkPing() * 1000)
    end)
    if ok and ms then return tostring(ms) .. " ms" end
    return T("PROFILE_UNKNOWN")
end

-- 账号年龄：天数 + 年数
local function accountAgeDays()
    local ok, age = pcall(function() return LocalPlayer.AccountAge end)
    if not ok or not age then return nil end
    return age
end
local function accountAgeText()
    local age = accountAgeDays()
    if not age then return T("PROFILE_UNKNOWN") end
    local years = math.floor((age / 365.25) * 10 + 0.5) / 10
    return tostring(age) .. " " .. T("PROFILE_DAYS") .. "  ·  "
        .. T("PROFILE_ABOUT") .. " " .. tostring(years) .. " " .. T("PROFILE_YEARS")
end

local function buildProfileText()
    local ok, placeId = pcall(function() return game.PlaceId end)
    local ok2, jobId = pcall(function() return game.JobId end)
    return table.concat({
        T("PROFILE_BASIC") .. ":",
        "  " .. T("PROFILE_USERNAME") .. ": " .. LocalPlayer.Name,
        "  " .. T("PROFILE_DISPLAYNAME") .. ": " .. (LocalPlayer.DisplayName or LocalPlayer.Name),
        "  " .. T("PROFILE_UID") .. ": " .. tostring(LocalPlayer.UserId),
        "  " .. T("PROFILE_ACCOUNTAGE") .. ": " .. accountAgeText(),
        "",
        T("PROFILE_SERVER") .. ":",
        "  " .. T("PROFILE_PLACEID") .. ": " .. tostring(ok and placeId or "?"),
        "  " .. T("PROFILE_JOBID") .. ": " .. (ok2 and string.sub(jobId, 1, 12) .. "..." or "?"),
        "  " .. T("PROFILE_PLAYERS") .. ": " .. tostring(#Players:GetPlayers()),
        "  " .. T("PROFILE_PING") .. ": " .. getPing(),
        "  " .. T("PROFILE_FPS") .. ": " .. tostring(FPSMeter.value),
    }, "\n")
end

safeCreate(TabHandles.Profile, "Paragraph", {
    Title = LocalPlayer.DisplayName or LocalPlayer.Name,
    Desc = "@" .. LocalPlayer.Name .. "  ·  " .. T("PROFILE_UID") .. " " .. tostring(LocalPlayer.UserId),
    Image = "user",
    ImageSize = 24,
    Color = Color3.fromHex("#30ff6a"),
})
safeCreate(TabHandles.Profile, "Divider", {})

Ctl.profileSectionBasic = safeCreate(TabHandles.Profile, "Section", { Title = T("PROFILE_BASIC"), Icon = "user", Opened = true })
local profileAgeText = safeCreate(Ctl.profileSectionBasic, "Paragraph", {
    Title = T("PROFILE_ACCOUNTAGE"),
    Desc = accountAgeText(),
    Image = "calendar",
    ImageSize = 20,
    Color = "White",
})
bindLang(function()
    setTitleSafe(profileAgeText, T("PROFILE_ACCOUNTAGE"))
    pcall(function() profileAgeText:SetDesc(accountAgeText()) end)
end)

safeCreate(Ctl.profileSectionBasic, "Button", {
    Title = T("PROFILE_COPYUID"),
    Icon = "copy",
    Callback = function()
        pcall(function() setclipboard(tostring(LocalPlayer.UserId)) end)
        WindUI:Notify({ Title = T("PROFILE_UID"), Content = T("PROFILE_COPIED"), Icon = "check", Duration = 2 })
    end
})
bindLang(function()
    setTitleSafe(Ctl.profileSectionBasic, T("PROFILE_BASIC"))
end)

Ctl.profileSectionServer = safeCreate(TabHandles.Profile, "Section", { Title = T("PROFILE_SERVER"), Icon = "database", Opened = true })
bindLang(function() setTitleSafe(Ctl.profileSectionServer, T("PROFILE_SERVER")) end)

safeCreate(Ctl.profileSectionServer, "Button", {
    Title = T("PROFILE_REFRESH"),
    Icon = "refresh-cw",
    Callback = function()
        Window:Dialog({
            Title = T("PROFILE_TAB"),
            Content = buildProfileText(),
            Buttons = { { Title = "OK", Variant = "Primary" } }
        })
    end
})
safeCreate(Ctl.profileSectionServer, "Button", {
    Title = T("PROFILE_COPYJOBID"),
    Icon = "copy",
    Callback = function()
        local ok, jobId = pcall(function() return game.JobId end)
        if ok and jobId and jobId ~= "" then
            pcall(function() setclipboard(jobId) end)
            WindUI:Notify({
                Title = T("PROFILE_JOBID"),
                Content = jobId .. "\n" .. T("PROFILE_COPIED"),
                Icon = "check",
                Duration = 3
            })
        else
            WindUI:Notify({
                Title = T("PROFILE_JOBID"),
                Content = T("PROFILE_UNKNOWN"),
                Icon = "x",
                Duration = 3
            })
        end
    end
})
safeCreate(Ctl.profileSectionServer, "Button", {
    Title = T("PROFILE_VIEW"),
    Icon = "user",
    Variant = "Tertiary",
    Callback = function()
        WindUI:Notify({
            Title = T("PROFILE_TAB"),
            Content = LocalPlayer.Name .. "  ·  " .. getPing() .. "  ·  " .. tostring(FPSMeter.value) .. " FPS",
            Icon = "user",
            Duration = 4
        })
    end
})

-- ========================= 切换语言页 =========================
safeCreate(TabHandles.Language, "Paragraph", {
    Title = T("LANG_TITLE"),
    Desc = T("LANG_DESC"),
    Image = "languages",
    ImageSize = 20,
    Color = Color3.fromHex("#315dff"),
})
safeCreate(TabHandles.Language, "Divider", {})

local langNames = {}
for _, item in ipairs(LANG_ORDER) do table.insert(langNames, item.Name) end

local currentLangName = "简体中文"
local langParagraph = safeCreate(TabHandles.Language, "Paragraph", {
    Title = T("LANG_CURRENT"),
    Desc = currentLangName,
    Image = "info",
    ImageSize = 20,
    Color = "White",
})
bindLang(function() setTitleSafe(langParagraph, T("LANG_CURRENT")) end)

Ctl.langSection = safeCreate(TabHandles.Language, "Section", { Title = T("LANG_SELECT"), Icon = "globe" })
bindLang(function() setTitleSafe(Ctl.langSection, T("LANG_SELECT")) end)

local langDropdown = Ctl.langSection:Dropdown({
    Title = T("LANG_SELECT"),
    Values = langNames,
    Value = currentLangName,
    Callback = function(choice)
        local code = findLangCode(choice)
        if not code then return end
        currentLangName = choice
        applyLanguage(code)
        pcall(function() langParagraph:SetDesc(choice) end)
        WindUI:Notify({
            Title = T("LANG_APPLIED"),
            Content = choice .. "\n" .. T("LANG_TIP"),
            Icon = "globe",
            Duration = 4
        })
    end
})
bindLang(function() setTitleSafe(langDropdown, T("LANG_SELECT")) end)

safeCreate(TabHandles.Language, "Button", {
    Title = T("LANG_TIP"),
    Icon = "refresh-cw",
    Variant = "Tertiary",
    Callback = function()
        WindUI:Notify({
            Title = T("LANG_CURRENT"),
            Content = currentLangName .. " (" .. CurrentLang .. ")",
            Icon = "globe",
            Duration = 3
        })
    end
})
-- ======================= 语言页结束 =======================



Ctl.espColor = safeCreate(Ctl.espSectionFilter, "Colorpicker", {
    Title = T("ESP_COLOR"),
    Default = Ctl.ESPState.Color,
    Callback = function(color) Ctl.ESPState.Color = color end
})
bindLang(function() pcall(function() Ctl.espColor:SetTitle(T("ESP_COLOR")) end) end)

safeCreate(TabHandles.ESP, "Button", {
    Title = T("ESP_DIAG"),
    Desc = T("ESP_DIAG_DESC"),
    Icon = "activity",
    Variant = "Primary",
    Callback = function()
        local lines = {}
        -- Drawing 支持检测
        local drawOk = pcall(function()
            local tmp = Drawing.new("Square")
            if tmp then tmp:Remove() end
        end)
        table.insert(lines, (drawOk and "[OK] " or "[X] ") .. (drawOk and T("ESP_DRAWING_OK") or T("ESP_DRAWING_NO")))
        table.insert(lines, T("ESP_STATE") .. ": " .. (Ctl.ESPState.Enabled and "ON" or "OFF"))
        table.insert(lines, T("ESP_DRAWN") .. ": " .. tostring(ESPDrawnCount))
        table.insert(lines, T("ESP_UNIT") .. ": " .. tostring(Ctl.ESPState.DistanceUnit))
        table.insert(lines, "最小模式: " .. tostring(Ctl.ESPState.Minimal))
        table.insert(lines, "")
        if #UIErrorLog > 0 then
            table.insert(lines, "构建错误 (" .. tostring(#UIErrorLog) .. "):")
            for i = 1, math.min(#UIErrorLog, 10) do
                table.insert(lines, string.sub(UIErrorLog[i], 1, 150))
            end
        else
            table.insert(lines, "构建错误: 无")
        end
        table.insert(lines, "")
        table.insert(lines, T("ESP_LASTERR") .. ":")
        if ESPLastError then
            table.insert(lines, string.sub(ESPLastError, 1, 500))
        else
            table.insert(lines, T("ESP_NOERR"))
        end
        table.insert(lines, "")
        table.insert(lines, T("ESP_CAMLOCKED"))
        table.insert(lines, T("TB_ONLY_LEFT"))

        Window:Dialog({
            Title = T("ESP_DIAG_RESULT"),
            Content = table.concat(lines, "\n"),
            Buttons = { { Title = T("OK"), Variant = "Primary" } }
        })
    end
})

safeCreate(TabHandles.ESP, "Button", {
    Title = T("ESP_CLEAR"),
    Desc = T("ESP_CLEAR_DESC"),
    Icon = "trash",
    Callback = function()
        for plr in pairs(ESPDrawings) do removeESPObject(plr) end
        for plr, dot in pairs(Ctl.RadarDots) do
            pcall(function() dot:Remove() end)
            Ctl.RadarDots[plr] = nil
        end
        WindUI:Notify({ Title = "ESP", Content = T("ESP_CLEARED"), Icon = "check", Duration = 2 })
    end
})

-- 构建错误提示（有错误才显示，方便定位 ESP 页空白问题）
if #UIErrorLog > 0 then
    local errText = table.concat(UIErrorLog, "\n")
    if #errText > 500 then errText = string.sub(errText, 1, 500) .. "\n..." end
    safeCreate(TabHandles.ESP, "Paragraph", {
        Title = "构建错误 (" .. tostring(#UIErrorLog) .. ")",
        Desc = errText,
        Image = "alert-triangle",
        ImageSize = 20,
        Color = "Red",
    }, "errParagraph")
end

safeCreate(TabHandles.Elements, "Paragraph", {
    Title = "Interactive Components",
    Desc = "Explore WindUI's powerful elements",
    Image = "component",
    ImageSize = 20,
    Color = Color3.fromHex("#30ff6a"),
})

safeCreate(TabHandles.Elements, "Divider", {})

local ElementsSection = safeCreate(TabHandles.Elements, "Section", {
    Title = "Section Example",
    Icon = "feather",
})

local toggleState = false
local featureToggle = ElementsSection:Toggle({
    Title = "Enable Features",
    --Desc = "Unlocks additional functionality",
    Value = false,
    Callback = function(state) 
        toggleState = state
        WindUI:Notify({
            Title = "Features",
            Content = state and "Features Enabled" or "Features Disabled",
            Icon = state and "check" or "x",
            Duration = 2
        })
    end
})

local intensitySlider = ElementsSection:Slider({
    Title = "Effect Intensity",
    Desc = "Adjust the effect strength",
    Value = { Min = 0, Max = 100, Default = 50 },
    Callback = function(value)
        print("Intensity set to:", value)
    end
})

local modeDropdown = ElementsSection:Dropdown({
    Title = "Select Mode",
    Values = { "Standard", "Advanced", "Expert" },
    Value = "Standard",
    Callback = function(option)
        WindUI:Notify({
            Title = "Mode Changed",
            Content = "Selected: "..option,
            Duration = 2
        })
    end
})

ElementsSection:Divider()

ElementsSection:Button({
    Title = "Show Notification",
    Icon = "bell",
    Callback = function()
        WindUI:Notify({
            Title = "Hello WindUI!",
            Content = "This is a sample notification",
            Icon = "bell",
            Duration = 3
        })
    end
})

ElementsSection:Colorpicker({
    Title = "Select Color",
    --Desc = "Select coloe",
    Default = Color3.fromHex("#30ff6a"),
    Transparency = 0, -- enable transparency
    Callback = function(color, transparency)
        WindUI:Notify({
            Title = "Color Changed",
            Content = "New color: "..color:ToHex().."\nTransparency: "..transparency,
            Duration = 2
        })
    end
})

ElementsSection:Code({
    Title = "my_code.luau",
    Code = [[print("Hello world!")]],
    OnCopy = function()
        print("Copied to clipboard!")
    end
})

local appearanceHeader = safeCreate(TabHandles.Appearance, "Paragraph", {
    Title = T("APPEARANCE_TITLE"),
    Desc = T("APPEARANCE_DESC"),
    Image = "palette",
    ImageSize = 20,
    Color = "White"
})
bindLang(function()
    pcall(function() appearanceHeader:SetTitle(T("APPEARANCE_TITLE")) end)
    pcall(function() appearanceHeader:SetDesc(T("APPEARANCE_DESC")) end)
end)

local themes = {}
for themeName, _ in pairs(WindUI:GetThemes()) do
    table.insert(themes, themeName)
end
table.sort(themes)

local canchangetheme = true
local canchangedropdown = true



local themeDropdown = safeCreate(TabHandles.Appearance, "Dropdown", {
    Title = "loc:THEME_SELECT",
    Values = themes,
    Value = "Dark",
    Callback = function(theme)
        canchangedropdown = false
        WindUI:SetTheme(theme)
        WindUI:Notify({
            Title = T("THEME_APPLIED"),
            Content = theme,
            Icon = "palette",
            Duration = 2
        })
        canchangedropdown = true
    end
})

local transparencySlider = safeCreate(TabHandles.Appearance, "Slider", {
    Title = "loc:TRANSPARENCY",
    Value = { 
        Min = 0,
        Max = 1,
        Default = 0.2,
    },
    Step = 0.1,
    Callback = function(value)
        WindUI.TransparencyValue = tonumber(value)
        Window:ToggleTransparency(tonumber(value) > 0)
    end
})

local ThemeToggle = safeCreate(TabHandles.Appearance, "Toggle", {
    Title = T("DARKMODE"),
    Desc = T("DARKMODE_DESC"),
    Value = true,
    Callback = function(state)
        if canchangetheme then
            WindUI:SetTheme(state and "Dark" or "Light")
        end
        if canchangedropdown then
            themeDropdown:Select(state and "Dark" or "Light")
        end
    end
})

WindUI:OnThemeChange(function(theme)
    canchangetheme = false
    ThemeToggle:Set(theme == "Dark")
    canchangetheme = true
end)


local createThemeBtn = safeCreate(TabHandles.Appearance, "Button", {
    Title = T("CREATE_THEME"),
    Icon = "plus",
    Callback = function()
        Window:Dialog({
            Title = T("CREATE_THEME_DLG"),
            Content = T("COMING_SOON"),
            Buttons = {
                {
                    Title = T("OK"),
                    Variant = "Primary"
                }
            }
        })
    end
})
bindLang(function() pcall(function() createThemeBtn:SetTitle(T("CREATE_THEME")) end) end)

-- ========================= 配置管理（挂在外观页） =========================
local ConfigManager = Window.ConfigManager
local configName = "default"
local configFile = nil

Ctl.configSection = safeCreate(TabHandles.Appearance, "Section", { Title = T("CONFIG_SEC"), Icon = "download", Opened = true })
bindLang(function() setTitleSafe(Ctl.configSection, T("CONFIG_SEC")) end)

local configHeader = safeCreate(Ctl.configSection, "Paragraph", {
    Title = T("CONFIG_TITLE"),
    Desc = T("CONFIG_NAME") .. ": " .. configName,
    Image = "save",
    ImageSize = 20,
    Color = "White",
})
bindLang(function()
    pcall(function() configHeader:SetTitle(T("CONFIG_TITLE")) end)
    pcall(function() configHeader:SetDesc(T("CONFIG_NAME") .. ": " .. configName) end)
end)

safeCreate(Ctl.configSection, "Input", {
    Title = T("CONFIG_NAME"),
    Desc = T("CONFIG_NAME_PLACEHOLDER"),
    Value = configName,
    Type = "Input",
    Placeholder = "default",
    Callback = function(text)
        configName = tostring(text or "default")
        pcall(function() configHeader:SetDesc(T("CONFIG_NAME") .. ": " .. configName) end)
    end
})

if ConfigManager then
    ConfigManager:Init(Window)

    local function collectControls()
        local Controls = {
            { "featureToggle", featureToggle }, { "intensitySlider", intensitySlider },
            { "modeDropdown", modeDropdown }, { "themeDropdown", themeDropdown },
            { "transparencySlider", transparencySlider },
            { "espToggle", espToggle }, { "Ctl.espBoxToggle", Ctl.espBoxToggle },
            { "Ctl.espNameToggle", Ctl.espNameToggle }, { "Ctl.espDistToggle", Ctl.espDistToggle },
            { "Ctl.espHealthToggle", Ctl.espHealthToggle }, { "Ctl.espTracerToggle", Ctl.espTracerToggle },
            { "Ctl.espTeamToggle", Ctl.espTeamToggle }, { "Ctl.espLosToggle", Ctl.espLosToggle },
            { "Ctl.espDistSlider", Ctl.espDistSlider }, { "Ctl.espThickSlider", Ctl.espThickSlider },
            { "Ctl.espTextSlider", Ctl.espTextSlider }, { "Ctl.espColor", Ctl.espColor },
            { "Ctl.espNameMode", Ctl.espNameMode }, { "Ctl.espFontDropdown", Ctl.espFontDropdown },
            { "Ctl.espAsciiToggle", Ctl.espAsciiToggle },
            { "Ctl.espMinimalToggle", Ctl.espMinimalToggle },
            { "Ctl.espUnitDropdown", Ctl.espUnitDropdown },
            { "Ctl.espUnitScale", Ctl.espUnitScale },
            { "Ctl.espSkeletonToggle", Ctl.espSkeletonToggle },
            { "Ctl.espBox3dToggle", Ctl.espBox3dToggle },
            { "Ctl.espHighlightToggle", Ctl.espHighlightToggle },
            { "Ctl.espHeadDotToggle", Ctl.espHeadDotToggle },
            { "Ctl.espViewLineToggle", Ctl.espViewLineToggle },
            { "Ctl.espArrowToggle", Ctl.espArrowToggle },
            { "Ctl.espWeaponToggle", Ctl.espWeaponToggle },
            { "Ctl.espTeamInfoToggle", Ctl.espTeamInfoToggle },
            { "Ctl.espHpNumToggle", Ctl.espHpNumToggle },
            { "Ctl.espTargetHlToggle", Ctl.espTargetHlToggle },
            { "Ctl.espTargetColor", Ctl.espTargetColor },
            { "Ctl.espRadarToggle", Ctl.espRadarToggle },
            { "Ctl.espRadarSize", Ctl.espRadarSize },
            { "Ctl.espRadarRange", Ctl.espRadarRange },
            { "Ctl.espRadarPos", Ctl.espRadarPos },
            { "aimToggle", aimToggle }, { "aimModeDropdown", aimModeDropdown },
            { "aimTriggerDropdown", aimTriggerDropdown }, { "aimPartDropdown", aimPartDropdown },
            { "aimSmoothSlider", aimSmoothSlider }, { "aimFovSlider", aimFovSlider },
            { "aimDistSlider", aimDistSlider }, { "aimTeamToggle", aimTeamToggle },
            { "aimVisibleToggle", aimVisibleToggle }, { "aimShowFovToggle", aimShowFovToggle },
            { "aimColor", aimColor }, { "aimCamMode", aimCamMode },
            { "tbToggle", tbToggle }, { "tbMethod", tbMethod },
            { "Ctl.tbDelay", Ctl.tbDelay }, { "Ctl.tbCooldown", Ctl.tbCooldown },
            { "Ctl.tbBurst", Ctl.tbBurst }, { "Ctl.tbOnlyVis", Ctl.tbOnlyVis },
            { "Ctl.tbUseBullet", Ctl.tbUseBullet },
            { "ThemeToggle", ThemeToggle },
            { "bulletToggle", bulletToggle }, { "bulletMethod", bulletMethod },
            { "bulletPart", bulletPart }, { "bulletHitChance", bulletHitChance },
            { "bulletFollow", bulletFollow }, { "bulletFov", bulletFov },
            { "bulletDist", bulletDist }, { "bulletTeam", bulletTeam },
            { "bulletWallbang", bulletWallbang },
            { "flyToggle", flyToggle }, { "Ctl.flySpeedSlider", Ctl.flySpeedSlider },
            { "Ctl.flyVertSlider", Ctl.flyVertSlider }, { "Ctl.flyNoclipToggle", Ctl.flyNoclipToggle },
            { "Ctl.flyNoclipMode", Ctl.flyNoclipMode }, { "Ctl.flyUnstickToggle", Ctl.flyUnstickToggle },
            { "Ctl.miscSpeedToggle", Ctl.miscSpeedToggle }, { "Ctl.miscSpeedSlider", Ctl.miscSpeedSlider },
            { "Ctl.miscJumpToggle", Ctl.miscJumpToggle }, { "Ctl.miscJumpSlider", Ctl.miscJumpSlider },
            { "Ctl.miscHealthToggle", Ctl.miscHealthToggle }, { "Ctl.miscHealthSlider", Ctl.miscHealthSlider },
            { "Ctl.miscInfJumpToggle", Ctl.miscInfJumpToggle },
            { "Ctl.miscGravityToggle", Ctl.miscGravityToggle }, { "Ctl.miscGravitySlider", Ctl.miscGravitySlider },
            { "Ctl.miscNoclipToggle", Ctl.miscNoclipToggle },
            { "Ctl.miscFovToggle", Ctl.miscFovToggle }, { "Ctl.miscFovSlider", Ctl.miscFovSlider },
            { "Ctl.miscBrightToggle", Ctl.miscBrightToggle },
            { "Ctl.miscAfkToggle", Ctl.miscAfkToggle },
            { "Ctl.miscXrayToggle", Ctl.miscXrayToggle }, { "Ctl.miscXraySlider", Ctl.miscXraySlider },
            { "Ctl.miscTpDropdown", Ctl.miscTpDropdown }, { "Ctl.miscTpVehToggle", Ctl.miscTpVehToggle },
            { "bulletImpl", bulletImpl }, { "bulletFireKey", bulletFireKey },
            { "bulletHbToggle", bulletHbToggle }, { "Ctl.bulletHbPart", Ctl.bulletHbPart },
            { "Ctl.bulletHbMult", Ctl.bulletHbMult }, { "Ctl.bulletProjSpeed", Ctl.bulletProjSpeed },
            { "Ctl.bulletProjRange", Ctl.bulletProjRange }, { "Ctl.bulletRmIdx", Ctl.bulletRmIdx },
            { "Ctl.bulletRmType", Ctl.bulletRmType },
        }
        return Controls
    end

    safeCreate(Ctl.configSection, "Button", {
        Title = T("CONFIG_SAVE"),
        Icon = "download",
        Variant = "Primary",
        Callback = function()
            configFile = ConfigManager:CreateConfig(configName)
            for _, item in ipairs(collectControls()) do
                pcall(function() configFile:Register(item[1], item[2]) end)
            end
            configFile:Set("lang", CurrentLang)
            configFile:Set("lastSave", os.date("%Y-%m-%d %H:%M:%S"))
            if configFile:Save() then
                WindUI:Notify({ Title = T("CONFIG_SAVED"), Content = configName, Icon = "check", Duration = 2 })
            else
                WindUI:Notify({ Title = T("CONFIG_SAVE_FAIL"), Content = configName, Icon = "x", Duration = 3 })
            end
        end
    })

    safeCreate(Ctl.configSection, "Button", {
        Title = T("CONFIG_LOAD"),
        Icon = "folder",
        Callback = function()
            configFile = ConfigManager:CreateConfig(configName)
            local loaded = configFile:Load()
            if loaded and type(loaded) == "table" and next(loaded) then
                if loaded.lang then applyLanguage(loaded.lang) end
                local keys = {}
                for k in pairs(loaded) do table.insert(keys, k) end
                table.sort(keys)
                WindUI:Notify({
                    Title = T("CONFIG_LOADED"),
                    Content = T("CONFIG_LOADED_KEYS") .. ": " .. table.concat(keys, ", "),
                    Icon = "check",
                    Duration = 4
                })
            else
                WindUI:Notify({ Title = T("CONFIG_LOAD_FAIL"), Content = T("CONFIG_EMPTY"), Icon = "x", Duration = 3 })
            end
        end
    })
else
    safeCreate(Ctl.configSection, "Paragraph", {
        Title = T("CONFIG_NOTSUP"),
        Desc = "ConfigManager = nil",
        Image = "alert-triangle",
        ImageSize = 20,
        Color = "White"
    })
end

-- ======================= 配置管理结束 =======================


-- ========================= 脚本库 =========================
--[[
    添加脚本的方法（重要）：
    往下面的 SCRIPT_LIB 数组里加一项即可，格式如下：

        {
            Name   = "脚本名称",              -- 显示名，必填
            Author = "作者名",                -- 可留空
            Game   = "适用服务器/游戏",       -- 分类用，同名的会归到一组
            Desc   = "一句话说明",            -- 可留空
            Url    = "https://...",           -- 脚本直链，必填（raw / gist 直链）
            Confirm = true,                   -- 加载前是否弹确认框，默认 true
        },

    注意事项：
    1. Url 必须是能直接返回 Lua 文本的直链（raw.githubusercontent.com、gist 的 /raw/ 等）
       不是 GitHub 网页地址，网页地址加载出来是 HTML 会报错
    2. Game 字段相同的脚本会自动归到同一个分类
    3. 加完保存即可，界面会自动出现新分类和新条目，无需改其他代码
]]

local SCRIPT_LIB = {
    -- ===== 示例条目（Url 为空，加载时会提示未配置）=====
    {
        Name = "ROB脚本中心 V4",
        Url = "loadstring(game:HttpGet("https://raw.githubusercontent.com/idrobsc/rob_script/refs/heads/main/rob.v4"))()",
    },
    {
        Name = "YirdeX(YX-Hub)脚本中心",
        Url = "loadstring(game:HttpGet("https://raw.githubusercontent.com/YirdeX-Dev/scripts/refs/heads/main/YX-HubLoader.lua"))()",
    },
    {
        Name = "黑洞(BS)脚本中心轻量版",
        Url = "loadstring(game:HttpGet("https://raw.githubusercontent.com/vbxfhcd/BS/refs/heads/main/BS-loves_you.txt"))()"
    -- ===== 在这里继续往下加 =====
    -- {
    --     Name = "xxx Hub",
    --     Author = "某人",
    --     Game = "某个服务器",
    --     Desc = "功能说明",
    --     Url = "https://raw.githubusercontent.com/xxx/yyy/main/xxx.lua",
    --     Confirm = true,
    -- },
}

local function infoTextOf(item)
    if not item then return T("SCRIPT_INFO_EMPTY") end
    local lines = {}
    lines[#lines + 1] = "名称: " .. tostring(item.Name or "-")
    lines[#lines + 1] = "作者: " .. tostring(item.Author or "-")
    lines[#lines + 1] = "适用: " .. tostring(item.Game or "-")
    lines[#lines + 1] = "说明: " .. tostring(item.Desc or "-")
    lines[#lines + 1] = "链接: " .. (((item.Url and item.Url ~= "") and item.Url) or T("SCRIPT_NO_URL"))
    return table.concat(lines, "\n")
end

Ctl.CustomScriptUrl = ""

Ctl.ScriptCats = {}
Ctl.ScriptCatNames = {}
do
    local seen = {}
    for _, item in ipairs(SCRIPT_LIB) do
        local g = item.Game or "未分类"
        if not seen[g] then
            seen[g] = true
            table.insert(Ctl.ScriptCatNames, g)
            Ctl.ScriptCats[g] = {}
        end
        table.insert(Ctl.ScriptCats[g], item)
    end
    table.sort(Ctl.ScriptCatNames)
end

Ctl.CurCat = Ctl.ScriptCatNames[1]
Ctl.CurScript = nil

local function scriptsOfCat(cat)
    local out = {}
    local list = Ctl.ScriptCats[cat] or {}
    for _, item in ipairs(list) do
        table.insert(out, item.Name)
    end
    table.sort(out)
    return out
end

local function findScript(cat, name)
    local list = Ctl.ScriptCats[cat] or {}
    for _, item in ipairs(list) do
        if item.Name == name then return item end
    end
    return nil
end

local function runScriptUrl(url, label)
    if not url or url == "" then
        WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_NO_URL"), Icon = "x", Duration = 3 })
        return
    end
    WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_LOADING"), Icon = "loader", Duration = 2 })
    task.spawn(function()
        local ok, src = pcall(function() return game:HttpGet(url) end)
        if not ok or not src or #src < 10 then
            WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_FAILED"), Icon = "x", Duration = 4 })
            return
        end
        local fn, cerr = loadstring(src)
        if not fn then
            warn("[LaevatainSky] 脚本解析失败: " .. tostring(cerr))
            WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_FAILED"), Icon = "x", Duration = 4 })
            return
        end
        local rok, rerr = pcall(fn)
        if not rok then
            warn("[LaevatainSky] 脚本运行出错: " .. tostring(rerr))
        end
        WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_LOADED"), Icon = "check", Duration = 3 })
    end)
end

-- ---------- 界面 ----------
safeCreate(TabHandles.ScriptHub, "Paragraph", {
    Title = T("SCRIPT_TAB"),
    Desc = T("SCRIPT_DESC"),
    Image = "list",
    ImageSize = 20,
    Color = "White",
}, "scriptHeader")
safeCreate(TabHandles.ScriptHub, "Divider", {}, "scriptDiv")

Ctl.scriptSectionPick = safeCreate(TabHandles.ScriptHub, "Section", { Title = T("SCRIPT_SELECT"), Icon = "list" }, "scriptSecPick")

Ctl.scriptCatDropdown = safeCreate(Ctl.scriptSectionPick, "Dropdown", {
    Title = T("SCRIPT_CATEGORY"),
    Desc = T("SCRIPT_CATEGORY_DESC"),
    Values = Ctl.ScriptCatNames,
    Value = Ctl.CurCat,
    Callback = function(v)
        CurCat = v
        CurScript = nil
        local list = scriptsOfCat(v)
        pcall(function() Ctl.scriptNameDropdown:Refresh(list) end)
        if #list > 0 then
            pcall(function() Ctl.scriptNameDropdown:Select(list[1]) end)
            CurScript = list[1]
            pcall(function() Ctl.scriptInfoPara:SetDesc(infoTextOf(findScript(v, list[1]))) end)
        end
    end
}, "scriptCatDropdown")
bindLang(function() pcall(function() Ctl.scriptCatDropdown:SetTitle(T("SCRIPT_CATEGORY")) end) end)

Ctl.scriptNameDropdown = safeCreate(Ctl.scriptSectionPick, "Dropdown", {
    Title = T("SCRIPT_SELECT"),
    Desc = T("SCRIPT_SELECT_DESC"),
    Values = scriptsOfCat(Ctl.CurCat),
    Value = (scriptsOfCat(Ctl.CurCat))[1],
    Callback = function(v)
        CurScript = v
        pcall(function() Ctl.scriptInfoPara:SetDesc(infoTextOf(findScript(Ctl.CurCat, v))) end)
    end
}, "scriptNameDropdown")
bindLang(function() pcall(function() Ctl.scriptNameDropdown:SetTitle(T("SCRIPT_SELECT")) end) end)

Ctl.scriptSectionInfo = safeCreate(TabHandles.ScriptHub, "Section", { Title = T("SCRIPT_INFO"), Icon = "info" }, "scriptSecInfo")

Ctl.scriptInfoPara = safeCreate(Ctl.scriptSectionInfo, "Paragraph", {
    Title = T("SCRIPT_INFO"),
    Desc = T("SCRIPT_INFO_EMPTY"),
    Image = "info",
    ImageSize = 20,
    Color = "White",
}, "scriptInfoPara")
bindLang(function() pcall(function() Ctl.scriptInfoPara:SetTitle(T("SCRIPT_INFO")) end) end)

safeCreate(Ctl.scriptSectionInfo, "Button", {
    Title = T("SCRIPT_LOAD"),
    Desc = T("SCRIPT_LOAD_DESC"),
    Icon = "play",
    Variant = "Primary",
    Callback = function()
        local item = findScript(Ctl.CurCat, Ctl.CurScript)
        if not item then return end
        if not item.Url or item.Url == "" then
            WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_NO_URL"), Icon = "x", Duration = 3 })
            return
        end
        if item.Confirm ~= false then
            Window:Dialog({
                Title = T("SCRIPT_CONFIRM_TITLE"),
                Content = item.Name .. "\n" .. T("SCRIPT_CONFIRM_BODY"),
                Buttons = {
                    { Title = T("SCRIPT_LOAD"), Variant = "Primary", Callback = function()
                        runScriptUrl(item.Url, item.Name)
                    end },
                    { Title = T("CANCEL") or "取消", Variant = "Secondary" },
                }
            })
        else
            runScriptUrl(item.Url, item.Name)
        end
    end
}, "scriptLoadBtn")

safeCreate(Ctl.scriptSectionInfo, "Button", {
    Title = T("SCRIPT_COPY"),
    Desc = T("SCRIPT_COPY_DESC"),
    Icon = "copy",
    Callback = function()
        local item = findScript(Ctl.CurCat, Ctl.CurScript)
        if not item or not item.Url or item.Url == "" then
            WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_NO_URL"), Icon = "x", Duration = 3 })
            return
        end
        pcall(function()
            if setclipboard then setclipboard(item.Url) end
        end)
        WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_COPIED"), Icon = "check", Duration = 2 })
    end
}, "scriptCopyBtn")

Ctl.scriptSectionCustom = safeCreate(TabHandles.ScriptHub, "Section", { Title = T("SCRIPT_CUSTOM_SEC"), Icon = "plus" }, "scriptSecCustom")

Ctl.scriptUrlInput = safeCreate(Ctl.scriptSectionCustom, "Input", {
    Title = T("SCRIPT_CUSTOM_URL"),
    Desc = T("SCRIPT_CUSTOM_URL_DESC"),
    Placeholder = "https://raw.githubusercontent.com/...",
    Value = "",
    Callback = function(v) CustomScriptUrl = v end
}, "scriptUrlInput")
bindLang(function() pcall(function() Ctl.scriptUrlInput:SetTitle(T("SCRIPT_CUSTOM_URL")) end) end)

safeCreate(Ctl.scriptSectionCustom, "Button", {
    Title = T("SCRIPT_CUSTOM_LOAD"),
    Icon = "play",
    Variant = "Primary",
    Callback = function()
        local url = Ctl.CustomScriptUrl
        if not url or url == "" then
            WindUI:Notify({ Title = T("SCRIPT_TAB"), Content = T("SCRIPT_CUSTOM_EMPTY"), Icon = "x", Duration = 3 })
            return
        end
        runScriptUrl(url, "自定义脚本")
    end
}, "scriptCustomLoadBtn")

Ctl.scriptSectionGuide = safeCreate(TabHandles.ScriptHub, "Section", { Title = T("SCRIPT_GUIDE"), Icon = "info" }, "scriptSecGuide")

safeCreate(Ctl.scriptSectionGuide, "Paragraph", {
    Title = T("SCRIPT_GUIDE"),
    Desc = T("SCRIPT_GUIDE_DESC") .. "\n\n" ..
        "1. 打开脚本文件，找到 SCRIPT_LIB 数组\n" ..
        "2. 照着示例条目加一项：Name / Author / Game / Desc / Url\n" ..
        "3. Url 必须是 raw 或 gist 直链，不能是 GitHub 网页地址\n" ..
        "4. Game 相同的会自动归到同一分类\n" ..
        "5. 保存后重新执行脚本即可看到新条目",
    Image = "info",
    ImageSize = 20,
    Color = "White",
}, "scriptGuidePara")

-- ======================= 脚本库结束 =======================


-- ========================= 构建自检 =========================
-- 任何 Tab 空白时，这里会在控制台输出并弹窗告知具体失败控件
task.spawn(function()
    task.wait(1.2)
    local okTabs, badTabs = {}, {}
    for name, tab in pairs(TabHandles) do
        if tab == nil then
            table.insert(badTabs, name .. "(nil)")
        else
            table.insert(okTabs, name)
        end
    end
    local msg
    if #UIErrorLog == 0 then
        msg = "界面构建完成，无错误"
    else
        local detail = table.concat(UIErrorLog, "\n")
        if #detail > 900 then detail = string.sub(detail, 1, 900) .. "\n..." end
        msg = "构建失败 " .. tostring(#UIErrorLog) .. " 项:\n" .. detail
    end
    print("===== LaevatainSky 构建自检 =====")
    print("Tab 数量: " .. tostring(#okTabs))
    print(msg)
    if #UIErrorLog > 0 then
        warn("[LaevatainSky] " .. msg)
        pcall(function()
            WindUI:Notify({
                Title = "构建错误 " .. tostring(#UIErrorLog),
                Content = string.sub(table.concat(UIErrorLog, " | "), 1, 200),
                Icon = "info",
                Duration = 8
            })
        end)
    end
end)


safeCreate(TabHandles.Profile, "Paragraph", {
    Title = "LaevatainSky",
    Desc = "LaevatainSky — 内部测试私服专用",
    Image = "github",
    ImageSize = 20,
    Color = "Grey",
    Buttons = {
        {
            Title = "Copy Link",
            Icon = "copy",
            Variant = "Tertiary",
            Callback = function()
                setclipboard("https://github.com/Footagesus/WindUI")
                WindUI:Notify({
                    Title = "Copied!",
                    Content = "GitHub link copied to clipboard",
                    Duration = 2
                })
            end
        }
    }
})

Ctl.footerSection = Window:Section({ Title = "WindUI " .. WindUI.Version })
Ctl.footerSection:Paragraph({
    Title = "LaevatainSky v1",
    Desc = "LaevatainSky — 内部测试私服专用",
    Image = "sparkles",
    ImageSize = 20,
    Color = "Grey",
})

Window:OnClose(function()
    print("Window closed")
    
    if ConfigManager and configFile then
        pcall(function()
            configFile:Set("lang", CurrentLang)
            configFile:Set("lastSave", os.date("%Y-%m-%d %H:%M:%S"))
            configFile:Save()
        end)
    end
    pcall(function()
        if HitboxState and HitboxState.Enabled then restoreAllHitbox() end
        if Ctl.FlyState and Ctl.FlyState.Enabled then stopFly() end
        if Ctl.MiscState and Ctl.MiscState.Noclip then restoreNoclipAll() end
    end)
    print("LaevatainSky closed")
end)

pcall(function()
    if TabHandles.Profile and TabHandles.Profile.Show then TabHandles.Profile:Show() end
end)

Window:OnDestroy(function()
    print("Window destroyed")
end)

-- 版本检查（静默，失败不影响使用）
task.spawn(function()
    pcall(function()
        local ok, remote = pcall(function() return game:HttpGet(VER_URL) end)
        if ok and remote then
            remote = string.gsub(tostring(remote), "%s+", "")
            if remote ~= "" and remote ~= LIB_VERSION then
                warn(("[" .. LIB_NAME .. "] 有新版本 %s（当前 %s）"):format(remote, LIB_VERSION))
            end
        end
    end)
end)

-- 返回模块表，供二次开发
return {
    Name    = LIB_NAME,
    Version = LIB_VERSION,
    Repo    = LIB_REPO,
    WindUI  = WindUI,
    Window  = Window,
    Tabs    = TabHandles,
    State   = {
        ESP    = Ctl.ESPState,
        Aimbot = Ctl.AimState,
        Bullet = Ctl.BulletState,
        Fly    = Ctl.FlyState,
    },
    SetLanguage = applyLanguage,
    Teleport = teleportTo,
}