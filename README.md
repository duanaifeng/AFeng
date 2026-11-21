# AFeng 🚀 工具合集

<p align="center">
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-在线可用-22c55e?style=for-the-badge&logo=githubpages&logoColor=white">
  <img alt="纯前端" src="https://img.shields.io/badge/纯前端-零后端-9333ea?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/协议-MIT-blue?style=for-the-badge">
</p>

<p align="center">
  <strong>个人工具箱 · 导航 · 小游戏 · 公式 · 记工时 · 赶集日历</strong>
  <br>
  <sub>纯静态页面，放到 GitHub Pages 即可使用 —— 无需服务器，无需数据库</sub>
</p>

<p align="center">
  <a href="https://duanaifeng.github.io/AFeng/"><b>🔗 主页</b></a> &nbsp;·&nbsp;
  <a href="https://duanaifeng.github.io/AFeng/daohang/"><b>🧭 导航</b></a> &nbsp;·&nbsp;
  <a href="https://duanaifeng.github.io/AFeng/game/"><b>🎮 小游戏</b></a> &nbsp;·&nbsp;
  <a href="https://duanaifeng.github.io/AFeng/gongshi/"><b>📐 公式</b></a> &nbsp;·&nbsp;
  <a href="https://duanaifeng.github.io/AFeng/ganji/"><b>📅 赶集日历</b></a> &nbsp;·&nbsp;
  <a href="https://duanaifeng.github.io/AFeng/worktime/"><b>⏰ 记工时</b></a>
</p>

---

## 📖 项目介绍

**AFeng** 是一个轻量的静态网页工具包，所有页面均为纯前端实现，部署到 GitHub Pages 即可直接访问。

可用于收藏常用网址、运行网页小游戏、查阅常用公式、记录上班工时与赶集日期。
支持按分类快速跳转，手机与电脑端均可正常浏览。

> 个人自用的工具站，欢迎 Fork 后按需修改。

---

## ✨ 功能模块

| 模块 | 在线地址 | 说明 |
| :--- | :--- | :--- |
| 🏠 主页 | [`/AFeng/`](https://duanaifeng.github.io/AFeng/) | 全部工具的入口 |
| 🧭 导航 | [`/AFeng/daohang/`](https://duanaifeng.github.io/AFeng/daohang/) | 网址分类，支持直接跳转指定分组 |
| 🎮 小游戏 | [`/AFeng/game/`](https://duanaifeng.github.io/AFeng/game/) | 网页小游戏合集 |
| 📐 公式 | [`/AFeng/gongshi/`](https://duanaifeng.github.io/AFeng/gongshi/) | 常用公式速查 |
| 📅 赶集日历 | [`/AFeng/ganji/`](https://duanaifeng.github.io/AFeng/ganji/) | 记录赶集的日子 |
| ⏰ 记工时 | [`/AFeng/worktime/`](https://duanaifeng.github.io/AFeng/worktime/) | 记录工时，自动计算时长，数据保存在本地 |

### 🔗 导航快速跳转示例

```text
/AFeng/daohang/?item=wangluo-guanjia        # 网络管家
/AFeng/daohang/?item=diannao-weihu-gongju   # 电脑维护工具
```

---

## 🛠 技术栈

| 项目 | 说明 |
| :--- | :--- |
| 前端 | HTML / CSS / JavaScript（原生，无框架） |
| 托管 | GitHub Pages |
| 后端 | ❌ 无后台、无数据库，打开即用 |
| 适配 | ✅ 手机 / 电脑响应式布局 |
| 存储 | 浏览器本地存储（localStorage） |

---

## 🚀 本地运行

### 1. 克隆代码

```bash
git clone https://github.com/duanaifeng/AFeng.git
cd AFeng
```

### 2. 打开页面

直接用浏览器打开 `index.html`，或启动一个本地静态服务器：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node.js
npx serve .
```

然后访问 <http://localhost:8080>。

---

## 📄 开源协议

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源，可自由使用、修改与分发。

<p align="center">
  <sub>Made with ❤️ by <a href="https://github.com/duanaifeng">AFeng</a></sub>
</p>