# LaevatainSky

Roblox 脚本中心 / 功能库。ESP、自瞄、子追、飞行，8 国语言界面，开箱即用。

**作者**：Laevatain · **仓库**：[Leiwanting/Laevatain](https://github.com/Leiwanting/Laevatain)

---

## 加载

三个源，哪个能通就用哪个：

```lua
-- 1. jsDelivr（国内推荐，一般都能通）
loadstring(game:HttpGet("https://cdn.jsdelivr.net/gh/Leiwanting/Laevatain@main/LaevatainSky.lua"))()

-- 2. GitHub raw
loadstring(game:HttpGet("https://raw.githubusercontent.com/Leiwanting/Laevatain/main/LaevatainSky.lua"))()

-- 3. Gitee 镜像（需先在 Gitee 导入本仓库）
loadstring(game:HttpGet("https://gitee.com/Leiwanting/Laevatain/raw/main/LaevatainSky.lua"))()
```

无任何卡密、无白名单，谁都能用。

**注意**：`raw.githubusercontent.com` 在部分地区会被拦截（表现为连接被重置 / 超时）。
如果执行后没有任何反应，优先换 jsDelivr 链接。

脚本内置可见提示：开始加载会弹「脚本已开始加载…」，界面库获取失败会弹「加载失败」并说明原因，
方便判断是网络问题还是脚本问题。

---

## 功能

| 模块 | 内容 |
|---|---|
| 介绍 | 账号信息、服务器信息、复制 UID / JobId、脚本诊断 |
| ESP | 方框 / 名字 / 距离 / 血条 / 追踪线、距离单位切换（stud / m / km） |
| ESP 扩展 | 骨架、3D 立体框、原生高亮穿墙描边、头顶圈、视野线、屏幕外箭头、武器 / 队伍 / 血量数字、雷达 |
| 自瞄 | CFrame / Mouse 两种模式、FOV 圈、平滑度、部位选择、相机诊断、自动开火（TriggerBot） |
| 子追 | Hook / Mouse 两种实现、射线重定向 / 命中点覆盖 / 抛射物重定向 / Remote 改写、穿墙、Hitbox 扩大 |
| 飞行 | BodyGyro + BodyVelocity 驱动，穿墙、速度档位、停止自动脱困 |
| 通用 | 移动速度、跳跃力、生命上限、无限跳跃、重力、穿墙、视野 FOV、夜视、防 AFK 踢出、透视、传送到玩家、一键重置 |
| 设置 | 8 国语言切换、外观主题、配置保存 / 读取 |
| 脚本 | 脚本库：收录第三方脚本，按服务器分类，支持自定义 URL 加载 |

---

## 依赖

运行时自动拉取界面库 **WindUI**（KingScriptAE），无需手动准备。

若网络不通导致加载失败，可在文件顶部填写加速域名：

```lua
local PROXY = "https://你的加速域名"
```

---

## 常见问题

**某个页面显示 "This tab is empty"**

脚本内置了构建自检：加载 1.2 秒后会在控制台打印 `===== LaevatainSky 构建自检 =====` 并列出失败项，同时弹窗提示。把错误内容提交 issue 即可定位。

**ESP 扩展功能没反应**

检查「ESP 扩展」页的「最小模式」开关——开启时只保留基础 5 项，会暂停全部扩展绘制。

**中文名字显示为问号**

Drawing 默认字体不支持中文。在 ESP 页「名字显示」里切换字体（System / Plex 通常可以），或保持默认用户名模式。

---

## 二次开发

脚本末尾返回模块表，可直接拿到内部状态：

```lua
local Sky = loadstring(game:HttpGet("https://raw.githubusercontent.com/Leiwanting/Laevatain/main/LaevatainSky.lua"))()
print(Sky.Version)        -- 1.0.0
Sky.State.ESP.Box = false -- 关闭方框
Sky.SetLanguage("en")     -- 切英文
```

---

## 说明

本项目仅用于学习 Roblox Lua / Luau 脚本编写与 UI 开发，请在遵守游戏服务条款的前提下使用。作者不对任何使用后果负责。

---

## 如何往脚本库里加脚本

打开 `LaevatainSky.lua`，搜索 `SCRIPT_LIB`，往数组里加一项：

```lua
local SCRIPT_LIB = {
    {
        Name    = "脚本名称",            -- 显示名，必填
        Author  = "作者名",              -- 可留空
        Game    = "适用服务器/游戏",     -- 分类名，相同的自动归到一组
        Desc    = "一句话说明",          -- 可留空
        Url     = "https://...",         -- 脚本直链，必填
        Confirm = true,                  -- 加载前弹确认框
    },

    -- 继续加
    -- {
    --     Name = "xxx Hub",
    --     Author = "某人",
    --     Game = "某个服务器",
    --     Desc = "功能说明",
    --     Url  = "https://raw.githubusercontent.com/xxx/yyy/main/xxx.lua",
    -- },
}
```

**要点**

- `Url` 必须是能直接返回 Lua 文本的直链：`raw.githubusercontent.com`、`gist` 的 `/raw/` 等
- **不能**用 GitHub 网页地址（`github.com/xxx/blob/...`），那会返回 HTML 导致解析失败
- `Game` 字段相同的条目会自动归入同一分类，界面上先选分类再选脚本
- 加完保存，重新执行脚本即可看到新条目，无需改动其他代码

界面里也有「自定义脚本」入口，可临时粘贴 URL 直接加载，不必写进代码。
