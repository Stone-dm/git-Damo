# 党校学习系统 · Expo Mobile

党员主路径：登录 → 学习 / 推荐 / 助手 / 我的。与 Web 共用 Spring Boot API（`:8080`）。

## 环境变量

在 `Web/mobile/` 下创建 `.env`（或启动前导出）：

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

种子账号：`member/mem123`（党员）、`admin/admin123`、`secretary/sec123`。  
管理员 / 书记可登录；「我的」页会提示管理功能请使用 Web 端，仍可使用助手 Tab。

## 校验

```bash
npm run typecheck
```
