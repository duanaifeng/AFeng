# AFeng

AiFeng 的个人导航页与工具集。

## 内容

- `index.html` — 导航主页
- `ganji.html` — 西邑赶集日历 / 街道查询
- `xiaoyouxi.html` — 怀旧小游戏合集
- `404.html` — 404 页面
- `manifest.json` + `sw.js` — PWA 支持

## 在线访问

https://duanaifeng.github.io/AFeng/

## 功能

- 分类导航，emoji 图标
- 站内搜索（输入即过滤，回车搜全网）
- 常用 / 最近访问
- 访问次数统计
- 日夜主题切换
- PWA（可添加到主屏幕，离线可用）
- 编辑模式（管理员登录后可增删改、上下移动排序、导出 HTML）

## 编辑模式

1. 页面底部点「管理员登录」
2. 输入密码
3. 进入编辑模式后，可增删改链接、调整分类和卡片顺序
4. 修改后点「导出HTML」下载完整文件，上传覆盖仓库里的 `index.html`

## 键盘快捷键

- `/` 或 `Ctrl/⌘ + K` — 聚焦搜索框
- `Esc` — 关闭弹窗 / 清空搜索
- `?` — 显示快捷键面板
- 搜索框内 `↑` / `↓` — 选择建议
- `Enter` — 打开选中的建议

## 更新

用 GitHub Desktop 或命令行推送，GitHub Pages 自动部署。