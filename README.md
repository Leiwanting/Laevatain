# LaevatainSky

Roblox 脚本中心 / 功能库。ESP、自瞄、子追、飞行，8 国语言界面，开箱即用。

**作者**：Laevatain · **仓库**：[Leiwanting/Laevatain](https://github.com/Leiwanting/Laevatain)

---

## 加载

主链接（GitHub raw）：

```lua
loadstring(game:HttpGet("https://raw.githubusercontent.com/Leiwanting/Laevatain/main/LaevatainSky.lua"))()
```

国内访问慢用 jsDelivr 加速：

```lua
loadstring(game:HttpGet("https://cdn.jsdelivr.net/gh/Leiwanting/Laevatain@main/LaevatainSky.lua"))()
```

无任何卡密、无白名单，谁都能用。

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
| 设置 | 8 国语言切换、外观主题、配置保存 / 读取 |

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
