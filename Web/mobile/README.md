# 党校学习系统 · Expo Mobile

党员主路径：登录 → 首页 / 支部动态 / 通知 / 我的。与 Web 共用 Spring Boot API（`:8080`）。管理员与书记请使用 Web 端。

## 环境变量

在 `Web/mobile/` 下复制 `.env.example` 为 `.env`（或启动前导出）：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080
```

说明：

- 模拟器 / 本机调试可用 `http://localhost:8080`（Android 模拟器常见为 `http://10.0.2.2:8080`）。
- **真机 Expo Go** 必须填电脑的**局域网 IP**（如 `http://192.168.1.23:8080`），不能写 `localhost`。
- 修改后需重启 `npx expo start`。

## 启动

```bash
cd Web/mobile
npm install
npx expo start
```

用 Expo Go 扫码，或按 `a` / `i` 打开模拟器。

种子账号（党员）：`member/mem123`（另有 `zhangwei` / `lina` 等，密码均为 `mem123`）。

## 功能概览

| Tab | 说明 |
|-----|------|
| 首页 | 红色 Banner、个人信息与打卡、个性化三课推荐、六宫格导航、学习数据看板 |
| 支部动态 | 支部活动与学习动态 |
| 通知 | 任务 / 考试 / 系统消息 |
| 我的 | 个人资料与退出 |

首页六宫格可进入：线上党课（学习中心）、知识自测/考核（任务）、先锋榜样（探索）等。

## 校验

```bash
npm run typecheck
```
